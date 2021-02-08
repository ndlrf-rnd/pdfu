const fs = require('fs');
const os = require('os');
const path = require('path');
const ejs = require('ejs');
const mime = require('mime-types');
const yaml = require('js-yaml');
const omit = require('lodash.omit');
const flatten = require('lodash.flatten');
const defaults = require('lodash.defaults');
const pdfjsLib = require('pdfjs-dist');

require('./stubs.js').setStubs(global);

// global.window.pdfjsWorker = require('./worker.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.js');
const { cpMap } = require('./utils/chainPromises');
const { extractText } = require('./pdf2text');
const { isNil } = require('./utils/isNil');
const { log, error, warn, info } = require('./utils/log');
const { makeVeraPdfReport, makeVeraPdfMetadata } = require('./verapdf');
const { md5File } = require('./utils/md5');
const { optimizeImage, resize } = require('./optimize-images');
const { mkdirpSync, shouldCreate, rmrf, findFiles } = require('./utils/fs');
const { page2svg } = require('./page2svg');
const { range } = require('./utils/arrays');
const { renderPage } = require('./renderPage');
const { highwayhashFile } = require('./utils/highwayhash');
const { slicePdf } = require('./slicePdf');
const { textStat, charsStat } = require('./textStat');
const c = require('./constants');
const { addFilenameSuffix } = require('./utils/fs');
const { padLeft } = require('./utils/humanize');

/**
 * Libvips https://libvips.github.io/libvips/install.html
 */

/**
 * Export single PDF page
 * @param inputPdfPath
 * @param outputDirectory
 * @param options
 * @returns {Promise<*>}
 */
const exportPage = async (
  inputPdfPath,
  outputDirectory,
  options,
) => {
  const o = defaults(
    options || {},
    {
      ...c.DEFAULT_OPTIONS,
      jobs: os.cpus().length,
    },
  );
  // if (o.render) {
  //   const renderSize = (o.render || '').toLowerCase()
  //     .split('x')
  //     .map((v) => parseInt(v, 10))
  //     .filter((x) => !isNil(x));
  //   if (renderSize.length >= 1) {
  //     o.pageSizePt.width = renderSize[0];
  //     if (renderSize.length >= 2) {
  //       o.pageSizePt.height = renderSize[1];
  //     }
  //   }
  // }
  const t1 = (new Date()).getTime();
  inputPdfPath = path.resolve(inputPdfPath);
  outputDirectory = path.resolve(outputDirectory);
  mkdirpSync(outputDirectory);

  let currentProgress = {
    loaded: 0,
    total: 0,
  };
  let pdfDocument;
  let loadingTask;
  try {
    loadingTask = pdfjsLib.getDocument({
      ...o.pdfDocumentLoaderParams,
      // nativeImageDecoderSupport: pdfjsLib.NativeImageDecoding.DISPLAY,
      nativeImageDecoderSupport: pdfjsLib.NativeImageDecoding.DECODE,
      url: `file://${inputPdfPath}`,
    });
    const progressInterval = setInterval(() => {
      if (currentProgress.total > 0) {
        log(inputFilename, `        ...loading progress: ${currentProgress.loaded}`, '/', currentProgress.total);
      }
    }, o.progressUpdateMs);
    loadingTask.onProgress = (data) => {
      currentProgress = data;
    };
    loadingTask.onError = (e) => {
      error('err', e);
      clearInterval(progressInterval);
      throw e;
    };

    pdfDocument = await loadingTask.promise;
    clearInterval(progressInterval);
  } catch (e) {
    error('err', e);
    throw e;
  }

  const pagesRange = range(pdfDocument.numPages);
  // Associates the actual page with the view, and drawing it
  const result = await cpMap(
    pagesRange,
    async (i) => {
      const pageNumber = o.fromPage + i;
      const pdfPage = await pdfDocument.getPage(i + 1);
      const widthInches = (pdfPage.view[2] / 72);
      const heightInches = (pdfPage.view[3] / 72);
      const scaleCoeffW = (
        widthInches < heightInches ? o.pageSizePt.width : o.pageSizePt.height
      ) / pdfPage.view[2];
      const scaleCoeffH = (
        widthInches < heightInches ? o.pageSizePt.height : o.pageSizePt.width
      ) / pdfPage.view[3];
      // Use height constraint as primary
      const scaleCoeff = scaleCoeffH;
      const viewportParams = {
        ...(o.viewportParams || {}),
        scale: scaleCoeff,
      };
      log(inputPdfPath, 'page', pageNumber, 'dimensions of PDF (W x H):', pdfPage.view[2], ' mm x', pdfPage.view[3], 'mmop');

      // Render page
      const viewport = await pdfPage.getViewport(viewportParams);
      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);
      const fileName = `${o.outputNamePrefix}${padLeft(pageNumber, o.outputNameLeadingZeros, '0')}`;

      const pageResult = {
        width,
        height,
        report: {
          pageNumber,
          widthInches: parseFloat(widthInches.toFixed(3)),
          widthMm: parseFloat((widthInches * c.MM_IN_INCHES).toFixed(3)),
          heightMm: parseFloat((heightInches * c.MM_IN_INCHES).toFixed(3)),
          heightInches: parseFloat(heightInches.toFixed(3)),
          pageDir: outputDirectory,
        },
        scale: scaleCoeff,
        output: outputDirectory,
        outputNamePrefix: fileName,
        lineHeight: 10,
        maybePageNumbers: [],
        images: [],
        svgStr: '',
        debugHtmlOverlayPaths: [],
        paddedBbox: {
          x0: width / 2,
          x1: width / 2,
          y0: width / 2,
          y1: width / 2,
        },
        bbox: {
          x0: width / 2,
          x1: width / 2,
          y0: width / 2,
          y1: width / 2,
        },
        jsonPaths: [],
        hocrPaths: [],
        tsvPath: [],
      };

      if (o.text) {
        const textData = await extractText(pdfPage, viewport);

        if (o.html) {
          pageResult.textHtmlStr = textData.html;
          const textHtmlPath = path.join(outputDirectory, `${fileName}-text.${c.HTML_EXTENSION}`);
          fs.writeFileSync(textHtmlPath, textData.html);
          log(
            inputPdfPath,
            'page', pageNumber,
            'PDF -> XHTML with view dimensions scale coefficients W x H:',
            scaleCoeffW.toFixed(3),
            'x',
            scaleCoeffH.toFixed(3),
            'final scale coeff:',
            scaleCoeff.toFixed(3),
          );
        }
        pageResult.textStr = textData.text;
        const textPath = path.join(outputDirectory, `${fileName}-text.${c.TEXT_EXTENSION}`);
        log(inputPdfPath, 'page', pageNumber, `extracted text path:\t${textPath}`);
        fs.writeFileSync(textPath, textData.text);

        const testStatReport = o.text ? textStat(textData.text, { format: o.reportFormat }) : {};
        pageResult.report = {
          ...pageResult.report,
          textPath,
          ...testStatReport,
        };
      }

      // Svg output
      const svgRes = await page2svg(
        pdfPage,
        viewport,
        {
          ...o,
          outputNamePrefix: `${o.outputNamePrefix}${padLeft(pageNumber, o.outputNameLeadingZeros, '0')}-image-`,
        },
      );
      if (o.svg) {
        pageResult.svgStr = svgRes.svgStr;
        const svgPath = path.join(outputDirectory, `${fileName}.${c.SVG_EXTENSION}`);
        fs.writeFileSync(svgPath, pageResult.svgStr, 'utf-8');
        log(inputPdfPath, 'page', pageNumber, `SVG wrapper ${svgPath}`);
      }
      pageResult.report.images = [];
      await cpMap(
        Object.keys(svgRes.images || {}).sort(),
        async (imagePath, idx) => {
          const widthDpi = svgRes.images[imagePath].width / (pdfPage.view[2] / 72);
          const heightDpi = svgRes.images[imagePath].height / (pdfPage.view[3] / 72);
          const dpi = Math.min(widthDpi, heightDpi);
          log(inputPdfPath, 'page', pageNumber, 'image', idx + 1, '/', Object.keys(svgRes.images).length, `DPI (W x H: selected): ${widthDpi.toFixed(1)} x ${heightDpi.toFixed(1)}: ${dpi.toFixed(1)}`);
          pageResult.report.images.push({
            ...omit(svgRes.images[imagePath], ['buffer']),
            widthDpi: parseFloat(widthDpi.toFixed(3)),
            heightDpi: parseFloat(heightDpi.toFixed(3)),
          });
          if (!o.no_images) {
            const fullImagePath = path.join(outputDirectory, path.basename(imagePath));
            fs.writeFileSync(fullImagePath, svgRes.images[imagePath].buffer);
            if (o.preview) {
              const previewImagePath = addFilenameSuffix(fullImagePath, '.preview');
              fs.writeFileSync(
                previewImagePath,
                await resize(
                  svgRes.images[imagePath].buffer,
                  {
                    width: parseInt(o.preview.split('x')[0], 10),
                    height: parseInt(o.preview.split('x').slice(-1)[0], 10),
                  },
                  c.previewMediaType,
                ),
              );
            }
            pageResult.images.push(fullImagePath);
          }
        },
      );
      if (o.optimize) {
        await optimizeImage(
          pageResult.images,
          path.join(outputDirectory, o.optimizedImagesFolderName),
          o.optimize_engines || c.DEFAULT_OPTIONS.optimizeEngines,
          o.removeOriginalImages,
        );
        pageResult.report.imagesCount = pageResult.report.images.length;
      }
      warn(inputPdfPath, 'page', pageNumber, `produced following resources:`);
      pageResult.images.forEach(
        (imagePath) => log(inputPdfPath, 'page', pageNumber, `- ${imagePath}`),
      );
      pageResult.hocrPaths.sort().forEach(
        (hocrPaths) => log(inputPdfPath, 'page', pageNumber, `- ${hocrPaths}`),
      );
      pageResult.jsonPaths.sort().forEach(
        (jsonPaths) => log(inputPdfPath, 'page', pageNumber, `- ${jsonPaths}`),
      );

      if (o.render) {
        // Render section
        log(inputPdfPath, 'page', pageNumber, 'Rendering...');
        const renderFormat = (pageResult.images.length > 0)
          ? mime.contentType(path.extname(pageResult.images[0]).substr(1))
          : c.RENDER_PAGE_OUTPUT_TYPES.PNG;
        const ext = mime.extension(renderFormat);
        const renderBuffer = await renderPage(pdfPage, viewport, renderFormat);
        pageResult.renderPath = path.join(outputDirectory, `${fileName}.${ext}`);
        log(inputPdfPath, 'page', pageNumber, `render saved to: ${pageResult.renderPath}`);
        fs.writeFileSync(pageResult.renderPath, renderBuffer);
      }
      // End of render section
      if (o.html) {
        const renderCtx = {
          width,
          height,
          mime,
          bbox: pageResult.bbox,
          paddedBbox: pageResult.paddedBbox,
          pageNumber: pageResult.maybePageNumbers[0] || null,
          title: pageResult.title,
          encoding: o.wrappersEncoding,
          lang: o.language,
          styleSheets: o.styleSheets,
          renderPath: pageResult.renderPath ? `${path.relative(outputDirectory, pageResult.renderPath)}` : null,
          textStr: pageResult.textHtmlStr,
          areasStr: pageResult.areasStr,
          svgStr: pageResult.svgStr,
        };

        const wrappers = {
          xhtml: o.templates.xhtml ? path.join(outputDirectory, `${fileName}.${c.XHTML_EXTENSION}`) : null,
          html: o.templates.html ? path.join(outputDirectory, `${fileName}.${c.HTML_EXTENSION}`) : null,
          'html-strip': o.templates['html-strip'] ? path.join(outputDirectory, `${fileName}-strip.${c.HTML_EXTENSION}`) : null,
        };

        await cpMap(
          Object.keys(wrappers).sort(),
          async (wrapperType) => {
            const wrapperOutputPath = wrappers[wrapperType];
            if (typeof wrapperOutputPath === 'string') {
              if (await shouldCreate(wrapperOutputPath, o.overwrite)) {
                const render = await ejs.renderFile(
                  o.templates[wrapperType],
                  renderCtx,
                  { async: true },
                );
                fs.writeFileSync(wrapperOutputPath, render);
              }
            }
          },
        );
      }
      const reportFormat = (c.REPORT_OPTIONS.format || '');
      let reportStr = '';
      if (reportFormat === 'yaml') {
        reportStr = yaml.safeDump(pageResult.report, c.REPORT_OPTIONS.yaml);
      } else if (reportFormat === 'yaml') {
        reportStr = JSON.stringify(pageResult.report, null, c.REPORT_OPTIONS.json.ident);
      } else {
        throw new Error(`ERROR: INVALID REPORT FORMAT: "${c.REPORT_OPTIONS.format}"`);
      }
      const reportPath = path.join(outputDirectory, `${o.outputNamePrefix}${padLeft(pageNumber, o.outputNameLeadingZeros, '0')}.report.${c.YAML_EXTENSION}`);
      fs.writeFileSync(reportPath, reportStr);

      return pageResult.report;
    },
  );

  // Finalize
  // loadingTask.destroy();
  const t2 = (new Date()).getTime() - t1;
  log(
    [`${inputPdfPath} (${result.length} pages) processing complete in ${t2 / 2} seconds (${((t2 / 1000) / result.length).toFixed(2)} seconds/page)`,
    ].join('\t'),
  );
  return result;
};
const getMetadata = async (pdfPath) => new Promise(
  (resolve, reject) => {
    const loadingTask = pdfjsLib.getDocument({
      url: `file://${pdfPath}`,
    });
    loadingTask.promise.then((pdfDoc) => {
      pdfDoc.getMetadata().then(resolve).catch(reject);
    }).catch(reject);
  },
);

const processPdf = async (options = c.DEFAULT_OPTIONS) => {
  const o = defaults(options || {}, c.DEFAULT_OPTIONS);
  const input = path.resolve(o.input);
  const tsStart = (new Date()).getTime();

  const inputFilename = path.basename(input, path.extname(input));
  const outputDir = o.output
    ? path.resolve(o.output)
    : path.join(path.dirname(input), inputFilename);

  if (o.overwrite) {
    warn(`Removing old output folder ${outputDir}`);
    rmrf(outputDir);
  }
  mkdirpSync(outputDir);

  // veraPDF
  let fullPdfReport = {
    file: {
      path: input,
      sizeBytes: fs.statSync(input).size,
    },
    output: outputDir,
  };

  // Size and hashes
  warn(`Input file: ${input} (${fullPdfReport.file.sizeBytes} bytes) -> output folder: ${outputDir}`);
  if (o.highwayhash) {
    const highwayhashT1 = (new Date()).getTime();
    fullPdfReport.file.highwayhash = highwayhashFile(input);
    const highwayhashT2 = (new Date()).getTime() - highwayhashT1;
    info(inputFilename, `highwayhash: ${fullPdfReport.file.highwayhash} (${highwayhashT2.toFixed(0)} ms)`);
  }

  if (o.md5) {
    // MD5
    const md5T1 = (new Date()).getTime();
    fullPdfReport.file.md5 = md5File(input);
    const md5T2 = (new Date()).getTime() - md5T1;
    info(inputFilename, `MD5: ${fullPdfReport.file.md5} (${md5T2.toFixed(0)} ms)`);
  }

  if (o.veraPdf.use || o.report) {
    const veraPdfReport = await makeVeraPdfReport(
      input,
      path.join(outputDir, `${inputFilename}.veraPDF_report.xml`),
      o.veraPdf,
    );
    const veraPdfMetadata = await makeVeraPdfMetadata(
      input,
      path.join(outputDir, `${inputFilename}.veraPDF_metadata.xml`),
      o.veraPdf,
    );
    fullPdfReport = {
      ...fullPdfReport,
      veraPdf: {
        ...veraPdfReport,
        ...veraPdfMetadata,
      },
    };
  }

  // Chunk PDF-s
  const outputPdfChunksDir = path.join(outputDir, o.chunksDirSuffix);
  log(inputFilename, `Using temporary folder for chunked PDF output path: ${outputPdfChunksDir}`);
  mkdirpSync(outputPdfChunksDir);
  const pdfDocuments = await slicePdf(input, outputPdfChunksDir, o);
  // console.error('pdfDocuments', pdfDocuments)
  // Content files
  const exportResults = flatten(await cpMap(
    pdfDocuments,
    async ({ chunkPath, fromId, toId, fromPage, toPage }) => exportPage(
      chunkPath,
      outputDir,
      {
        fromPage,
        toPage,
        from: fromId,
        to: toId,
        ...o,
      },
    ),
    o.jobs,
  )).sort(
    (a, b) => (parseInt(a.pageNumber, 10) - parseInt(b.pageNumber, 10)),
  );
  // Images
  const imagesTable = [
    ['page', 'image', 'mediaType', 'width', 'height', 'widthDPI', 'heightDPI'],
    ...exportResults.map(
      ({ pageNumber, images }) => images.map(
        ({ mediaType, width, height, widthDpi, heigthDpi }, imageId) => ([
          pageNumber,
          imageId + 1,
          mediaType,
          width,
          height,
          widthDpi,
          heigthDpi,
        ]).join('\n'),
      ),
    ),
  ];

  const imagesReportPath = path.join(outputDir, `${inputFilename}.images.tsv`);
  fs.writeFileSync(
    imagesReportPath,
    imagesTable.map((p) => p.join('\t')).join('\n'),
    o.encoding,
  );

  // Chars
  const pageChars = {};
  exportResults.forEach(({ charsFreq, pageNumber }) => {
    pageChars[pageNumber] = charsFreq;
  });

  const { charsTable, printableCharsRatioTable, ...fullCharsStat } = charsStat(pageChars);

  const charsReportPath = path.join(outputDir, `chars-all-frequency.tsv`);
  fs.writeFileSync(
    charsReportPath,
    charsTable.map((p) => p.join('\t')).join('\n'),
    o.encoding,
  );

  const printableCharsRationReportPath = path.join(outputDir, `chars-printable-frequency-ratio.tsv`);
  log(inputFilename, 'Images properties table', imagesReportPath);
  log(inputFilename, 'Character frequency table', charsReportPath);
  log(inputFilename, 'Printable characters frequency ratio table', printableCharsRationReportPath);
  fs.writeFileSync(
    printableCharsRationReportPath,
    printableCharsRatioTable.map(
      (p) => p.map(
        (r) => ((typeof r === 'number') ? parseFloat(r.toFixed(3)) : r),
      ).join('\t'),
    ).join('\n'),
    o.encoding,
  );
  const metadata = await getMetadata(input);

  const tsFinish = (new Date()).getTime();
  const textsPath = path.join(outputDir, `texts.txt`);
  rmrf(textsPath);
  exportResults.forEach(({ textPath }) => {
    if ((!textPath) || (!fs.existsSync(textPath))) {
      return;
    }
    const text = fs.readFileSync(textPath, { encoding: o.textsEncoding });
    const safeText = `${text
      .replace(/\n/, '\\n')
      .replace(/\r/, '\\r')
      .replace(/\t/, '\\t')}\n`;
    fs.appendFileSync(textsPath, safeText, {
      encoding: o.textsEncoding,
      flag: 'a+',
    });
  });
  fullPdfReport.pdfu = {
    charsReportPath,
    textsPath,
    printableCharsRationReportPath,
    createdInMs: tsFinish - tsStart,
    createdTs: tsFinish,
    // Metadata
    metadata,
    ...fullCharsStat,
    ...exportResults.reduce(
      (
        a,
        { charsFreq, images, ...report },
      ) => {
        Object.keys(report).forEach((k) => {
          const val = report[k];
          if (k in a) {
            a[k].push(val);
          } else {
            a[k] = [val];
          }
          if (typeof val === 'number') {
            if (k.toLowerCase().endsWith('count')) {
              a[`${k}Total`] = (a[`${k}Total`] || 0) + val;
            }
            if (k !== 'pageNumber') {
              a[`${k}Mean`] = (a[`${k}Mean`] || 0) + (val / exportResults.length);
            }
          }
        });
        return a;
      },
      {},
    ),
  };
  Object.keys(fullPdfReport.pdfu).forEach((k) => {
    if (k.endsWith('Mean')) {
      fullPdfReport.pdfu[k] = parseFloat(fullPdfReport.pdfu[k].toFixed(3));
    }
    if (k.endsWith('Total')) {
      fullPdfReport.pdfu[k] = parseFloat(fullPdfReport.pdfu[k].toFixed(3));
    }
  });
  const fillPdfReportPath = path.join(outputDir, `${inputFilename}.report.yaml`);
  if (!o.keepChunks) {
    warn(`Removing temporary pdf chunks dir ${outputPdfChunksDir} due keepChunks === false`);
    rmrf(outputPdfChunksDir);
  }

  warn(`Final report saved to: ${fillPdfReportPath}`);
  fs.writeFileSync(fillPdfReportPath, yaml.safeDump(fullPdfReport), o.encoding);
  return fullPdfReport;
};

module.exports = {
  processPdf,
  findFiles,
};
