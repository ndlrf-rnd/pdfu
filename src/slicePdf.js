const fs = require('fs');
const path = require('path');
const hummus = require('hummus');
const mkdirp = require('mkdirp');
const {padLeft} = require("./utils/humanize");
const {parseRanges} = require('./utils/parseRanges');

const {cpMap} = require('./utils/chainPromises');
const {info, warn} = require('./utils/log');
const {init} = require('./runnerInit');
const {DEFAULT_OPTIONS} = require('./constants');

init();

// Main function
const slicePdf = async (inputPath, outputDirectory, options) => {
  // Validation
  const o = {...DEFAULT_OPTIONS, ...(options || {})};
  if (o.debug) {
    process.env.DEBUG = true;
  } else {
    process.env.DEBUG = process.env.DEBUG || false;
  }
  inputPath = path.resolve(inputPath);
  info(`Slicing PDF ${inputPath}  ->  ${outputDirectory}`);
  mkdirp.sync(outputDirectory)
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input path do not exists: ${inputPath}`);
  }
  if (!inputPath.toLowerCase().endsWith(`.${o.outputExtension}`)) {
    warn(`Input path should have PDF type and .pdf extension: ${inputPath}`);
  }

  // Processing
  const pdfReader = hummus.createReader(inputPath);

  const numPages = pdfReader.getPagesCount();
  info('Total pages count:', numPages);
  info('PDF Slice step:', o.step);
  if (o.pages) {
    info('User defined page ranges:', o.pages);
  }
  o.pageRanges = parseRanges(o.pages, numPages, o.step);

  info(`Following page ranges will be processed: ${
    o.pageRanges.map(
      ({from, to}) => ((from === to) ? from : `${from}-${to}`),
    ).join(', ')
  }`);
  return cpMap(
    o.pageRanges,
    async ({from, to}) => {
      const fromPage = Math.max(from, 1);
      const toPage = Math.min(to, numPages);
      const fromId = fromPage - 1;
      const toId = toPage - 1;
      const count = (toId - fromId) + 1;
      const formatPageNo = pageNo =>padLeft(pageNo, Math.ceil(Math.log10(numPages)), '0')

      const chunkPath = path.join(
        outputDirectory,
        count === 1
          ? `${o.outputNamePrefix}${formatPageNo(fromPage)}.${o.outputExtension}`
          : `${o.outputNamePrefix}${formatPageNo(fromPage)}-${formatPageNo(toPage)}.${o.outputExtension}`,
      );
      const isExisting = fs.existsSync(chunkPath);
      info(
        `[slicePdf] ${inputPath}[${formatPageNo(from)}-${formatPageNo(to)}] -> ${chunkPath} (${numPages} pages)`
      );
      if (isExisting && o.overwrite) {
        fs.unlinkSync(chunkPath);
        warn(`[slicePdf[ existing ${chunkPath} will be replaced`)
      }
      const result = {
        chunkPath,
        fromId,
        toId,
        fromPage,
        toPage,
        created: ((!isExisting) || o.overwrite),
      };

      if ((!isExisting) || o.overwrite) {
        try {
          const pdfWriter = hummus.createWriter(chunkPath);
          for (let i = fromId; i < toId + 1; i += 1) {
            // console.error('from', fromId, 'i', i, 'to', toId, 'chunkPath', chunkPath);
            pdfWriter.createPDFCopyingContext(pdfReader).appendPDFPageFromPDF(i);
          }
          pdfWriter.end();
        } catch (err) {
          warn(`Problematic chunk path is: ${chunkPath}`)
          throw err;
        }
      }
      return result;
    },
  );
};

module.exports = {
  slicePdf,
  DEFAULT_OPTIONS,
};
