/**
 * @fileOverview Constants
 */
const path = require('path');

/**
 * Page size multiplier
 * @type {number}
 */
const PAGE_SIZE_SCALE = 1.0;

const RENDER_PAGE_OUTPUT_TYPES = {
  PDF: 'application/pdf',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
};

const URL_RE = /(https?:\/\/[^\s)]+)/g;

// /**
//  * Imagemin WebP codec settings (lossy by default)
//  */

/**
 * Default options
 * @const DEFAULT_OPTIONS
 * @type {{
 *    debug: boolean,
 *    outputNamePrefix: string,
 *    step: number,
 *    outputExtension: string,
 *    overwrite: boolean,
 * }}
 */
const DEFAULT_OPTIONS = {
  step: 10,
  optimizeEngines: ['webp-lossy', 'jpeg-veryhigh'],
  optimizedImagesFolderName: 'optimized',
  removeOriginalImages: false,
  outputExtension: 'pdf',
  outputNamePrefix: 'page-',
  outputImageNameLeadingZeros: 1,
  outputNameLeadingZeros: 4,
  chunksDirSuffix: '.chunks.tmp',
  debug: false,
  overwrite: false,
  startPageNum: 1,
  language: 'en',
  previewMediaType: 'jpeg',
  textsEncoding: 'utf8',
  wrappersEncoding: 'utf8',
  progressUpdateMs: 1000,
  keepChunks: false,
  veraPdf: {
    /*
     veraPDF supported PDF/A profiles:
     1a - PDF/A-1A validation profile
     1b - PDF/A-1B validation profile
     2a - PDF/A-2A validation profile
     2b - PDF/A-2B validation profile
     2u - PDF/A-2U validation profile
     3a - PDF/A-3A validation profile
     3b - PDF/A-3B validation profile
     3u - PDF/A-3U validation profile
     */
    path: '/usr/local/opt/verapdf',
    cmd: '-f 0',
    cmdMetadata: '/usr/local/opt/verapdf --off --extract ',
    use: false,
  },
  pageSizePt: {
    width: 2048 * PAGE_SIZE_SCALE,
    height: 1536 * PAGE_SIZE_SCALE,
  },
  pdfDocumentLoaderParams: {},
  templates: {
    html: path.join(__dirname, 'templates/page.html.ejs'),
    'html-strip': path.join(__dirname, 'templates/page-strip.html.ejs'),
    xhtml: path.join(__dirname, 'templates/page.xhtml.ejs'),
  },
  identBetweenPagesLineHeight: 0.75,
  styleSheets: [
    `file://${require.resolve('pdfjs-dist/web/pdf_viewer.css')}`,
  ],
  reportFormat: 'yaml',
};

/**
 * Html page css name
 * @constant CSS_NAME
 * @type {string}
 */
const CSS_NAME = 'book.css';

/**
 * XHTML file extension name
 * @constant XHTML_EXTENSION
 * @type {string}
 */
const XHTML_EXTENSION = 'xhtml';

/**
 * HTML file extension name
 * @constant HTML_EXTENSION
 * @type {string}
 */
const HTML_EXTENSION = 'html';

/**
 * PNG file extension name
 * @constant PNG_EXTENSION
 * @type {string}
 */
const PNG_EXTENSION = 'png';

/**
 * SVG file extension name
 * @constant SVG_EXTENSION
 * @type {string}
 */
const SVG_EXTENSION = 'svg';

/**
 * TEXT file extension name
 * @constant TEXT_EXTENSION
 * @type {string}
 */
const TEXT_EXTENSION = 'txt';

/**
 * PDF file extension name
 * @constant PDF_EXTENSION
 * @type {string}
 */
const PDF_EXTENSION = 'pdf';

/**
 * TEXT file extension name
 * @constant TEXT_EXTENSION
 * @type {string}
 */
const YAML_EXTENSION = 'yaml';

/**
 * @constant TEXT_NODE_NAMES {Array<string>} - Svg textStr node names
 * @type {*[]}
 */
const TEXT_NODE_NAMES = ['svg:tspan', 'svg:textStr'];

const MM_IN_INCHES = 25.4;

const REPORT_OPTIONS = {
  encoding: 'utf-8',
  chars: {
    count: true,
    countRatio: true,
  },
  format: 'yaml',
  json: {
    ident: 2,
  },
  yaml: {
    lineWidth: 2048,
    sortKeys: true,
  },
};

const XML2JS_REPORT_OPTIONS = {
  nativeType: true,
  alwaysArray: true,
  compact: true,
  alwaysChildren: true,
};

module.exports = {
  CSS_NAME,
  DEFAULT_OPTIONS,
  PAGE_SIZE_SCALE,
  RENDER_PAGE_OUTPUT_TYPES,
  PNG_EXTENSION,
  SVG_EXTENSION,
  YAML_EXTENSION,
  TEXT_EXTENSION,
  PDF_EXTENSION,
  REPORT_OPTIONS,
  TEXT_NODE_NAMES,
  XML2JS_REPORT_OPTIONS,
  URL_RE,
  MM_IN_INCHES,
  HTML_EXTENSION,
  XHTML_EXTENSION,
};
