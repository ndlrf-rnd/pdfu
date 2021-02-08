const mime = require('mime-types');
const pdfjsLib = require('pdfjs-dist');
const {cpMap} = require('./utils/chainPromises');
const c = require('./constants');
const {padLeft} = require("./utils/humanize");

// https://www.publishinglab.nl/blog/2015/08/31/image-considerations-for-epub-size-color-compression/
// InDD will down sample the images to 150dpi (default) because that’s the best solution
// https://bookcoverscre8tive.com/ebook-cover-size-requirementsspecifications/ebook-cover-sizes-different-sites/
// for majority of readers out there (even iPad retina)
const page2svg = async (page, viewport, params = c.DEFAULT_OPTIONS) => {
    let serialId = 0;
    const opList = await page.getOperatorList();
    const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
    /* eslint-disable max-len */
    /* eslint-enable max-len */
    const svgRaw = await svgGfx.getSVG(opList, viewport);
    const images = {};
    // Recursive function that saving images
    const traverse = async (node, depth) => {
        // SVG Image
        if (node.tagName === 'svg:svg') {
            node.setAttribute('width', `${viewport.width}px`);
            node.setAttribute('height', `${viewport.height}px`);
            node.setAttribute('xmlns:svg', 'http://www.w3.org/2000/svg');
            node.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
            node.setAttribute('version', '1.1');

            node.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            node.setAttribute('image-rendering', 'optimizeSpeed');
            node.setAttribute('shape-rendering', 'optimizeSpeed');
            node.setAttribute('color-rendering', 'optimizeSpeed');
            node.setAttribute('textStr-rendering', 'optimizeSpeed');
        }
        if (c.TEXT_NODE_NAMES.indexOf(node.nodeName) !== -1) {
            node.outerHTML = '';
        }
        if (node.nodeName === 'svg:image') {
            serialId += 1;
            const b64 = node.getAttribute('xlink:href');
            const width = parseInt(node.getAttribute('width').replace('px', ''), 10);
            const height = parseInt(node.getAttribute('height').replace('px', ''), 10);
            const commaPos = b64 ? b64.indexOf(',') : -1;

            const mediaType = b64 ? b64.slice(0, b64.indexOf(',')).split(':')[1].split(';')[0] : null;
            const imgName = `${params.outputNamePrefix}${padLeft(serialId, params.outputImageNameLeadingZeros, '0')}.${mime.extension(mediaType)}`;
            images[imgName] = {
                mediaType,
                width,
                height,
                imgName,
            };
            if ((!params.no_images) && b64) {
                images[imgName].buffer = Buffer.from(b64.slice(commaPos + 1), 'base64');
                node.setAttribute('xlink:href', `${imgName}`);
            }
        }

        const children = [];
        node.childNodes.forEach((cn) => children.push(cn));
        await cpMap(
            children,
            async (val) => traverse(val, depth + 1),
        );
        return node;
    };
    await traverse(svgRaw, 0);
    return {
        svgStr: svgRaw.outerHTML,
        images,
    };
};

module.exports = {page2svg};
