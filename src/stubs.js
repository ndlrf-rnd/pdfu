const fs = require('fs');
const jsdom = require('jsdom');
const PdfWorker = require('pdfjs-dist/build/pdf.worker.js');

const c = require('./constants');

exports.dom = new jsdom.JSDOM(
  fs.readFileSync(c.DEFAULT_OPTIONS.templates.html),
  { pretendToBeVisual: false },
);

exports.window = exports.dom.window;
exports.window.requestAnimationFrame = (x) => {
  setImmediate(x);
};
exports.Element = exports.dom.window.Element;

function Image() {
  this._src = null;
  this.onload = null;
}

Image.prototype = {
  get src() {
    return this._src;
  },
  set src(value) {
    this._src = value;
    if (this.onload) {
      this.onload();
    }
  },
};

exports.Image = Image;

exports.document = exports.dom.window.document;
exports.window.pdfjsWorker = PdfWorker;
const exported_symbols = Object.keys(exports);

exports.setStubs = function setStubs(namespace) {
  exported_symbols.forEach((key) => {
    namespace[key] = exports[key];
  });
};
exports.unsetStubs = function unsetStubs(namespace) {
  exported_symbols.forEach((key) => {
    delete namespace[key];
  });
};
