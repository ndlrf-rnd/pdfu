/**
 * Inspired by: https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.js
 */
require('./stubs.js').setStubs(global);
const pdfjsLib = require('pdfjs-dist');

const makeContainerForViewport = (viewport) => {
  const document = global.document;
  const container = document.createElement('div');
  container.setAttribute('id', Math.random().toString());
  container.setAttribute('style', `width: ${viewport.width}px; height: ${viewport.height}px;`);
  container.setAttribute('class', 'textLayer');
  document.body.appendChild(container);
  return container;
};

const extractText = async (page, viewport) => {
  const container = makeContainerForViewport(viewport);
  const textContent = await page.getTextContent();
  const task = pdfjsLib.renderTextLayer({
    textContent,
    container,
    viewport,
    enhanceTextSelection: true,
  });
  await task;
  // Add width and height properties using bounds
  task._bounds.forEach(el=>{
    el.div.setAttribute('style', `${el.div.getAttribute('style') || ''}width:${el.size[0]}px;height:${el.size[1]}px;`);
  });
  const result = {
    html: container.outerHTML,
    text: container.textContent,
  };
  console.log('container', Object.keys(container));
  container.innerHtml = '';
  return result;
};



module.exports = {
  extractText,
};
