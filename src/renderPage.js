const Canvas = require('canvas');
const assert = require('assert');
const { error } = require('./utils/log');
const c = require('./constants');
const domStubs = require('./stubs');

function NodeCanvasFactory() {}

NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    // assert(width > 0 && height > 0, 'Invalid canvas size');
    const canvas = Canvas.createCanvas(width, height);
    const context = canvas.getContext('2d');
    return {
      canvas,
      context,
    };
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, 'Canvas is not specified');
    assert(width > 0 && height > 0, 'Invalid canvas size');
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, 'Canvas is not specified');

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};


const renderPage = async (page, viewport, outputType = c.renderPageOutputType) => new Promise(
  (resolve, reject) => {
    const canvasFactory = new NodeCanvasFactory();
    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);
    domStubs.unsetStubs(global);
    const renderTask = page.render({
      canvasContext: context,
      viewport,
      canvasFactory,
    });
    renderTask.onError = (e) => {
      error(e);
      reject(e);
    };
    renderTask.promise
      .then(() => {
        domStubs.setStubs(global);
        resolve(canvas.toBuffer(outputType));
      })
      .catch(reject);
  },
);

module.exports = { renderPage };
