const path = require('path');
const fs = require('fs');
const imagemin = require('imagemin');
const pick = require('lodash.pick');
const imageminWebp = require('imagemin-webp');
const pngToJpeg = require('png-to-jpeg');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const imageminPngquant = require('imagemin-pngquant');
const imageminPngCrush = require('imagemin-pngcrush');
const mkdirp = require("mkdirp");
const {rmrf} = require("./utils/fs");
const {forceArray} = require("./utils/arrays");
const {prettyBytes} = require("./utils/humanize");
const {cpMap} = require("./utils/chainPromises");
const sharp = require("sharp");

const ENGINES_CONF = {
    'jpeg': {
        plugins: [
            pngToJpeg({
                quality: 95,
            }),
        ]
    },
    'jpeg-veryhigh': {
        plugins: [
            pngToJpeg({
                quality: 100,
            }),
            imageminJpegRecompress({
                quality: 'veryhigh',
                strip: true,
                progressive: true,
                // accurate: true,
                // subsample: 'default',
                // method: 'ssim',
                // loops: 6,
                // defish: 0,
            }),
        ],
    },
    'jpeg-high': {
        plugins: [
            pngToJpeg({
                quality: 100,
            }),
            imageminJpegRecompress({
                quality: 'high',
                strip: true,
                progressive: true,
                // accurate: true,
                // subsample: 'default',
                // method: 'ssim',
                // loops: 6,
                // defish: 0,
            }),
        ],
    },
    'png-pngquant': {
        plugins: [
            imageminPngquant({
                speed: 2,
                strip: true,
                quality: [1.0, 1.0],
                dithering: false,
            })
        ]
    },

    'png-pngcrush': {
        plugins: [
            imageminPngCrush({})
        ]
    },

    'webp-lossless': {
        plugins: [
            imageminWebp({
                lossless: true,
            }),
        ]
    },
    'webp-near-lossless': {
        plugins: [
            imageminWebp({
                nearLossless: 95,
            }),
        ]
    },

    'webp-lossy': {
        plugins: [
            imageminWebp({
                q: 95,
            }),
        ]
    }
};
const DEFAULT_ENGINES = ['jpeg'];
const optimizeImage = async (
    inputPaths,
    tempFolder,
    engines = DEFAULT_ENGINES,
    removeOriginalImages = false,
) => {
    const imagesCount = forceArray(inputPaths).length;
    if (imagesCount === 0) {
        process.stderr.write('[optimize-images] No images to optimize\n');
        return [];
    }
    if (fs.existsSync(tempFolder)) {
        rmrf(tempFolder);
    }
    await cpMap(
        Object.keys(pick(ENGINES_CONF, forceArray(engines).length > 0 ? engines : DEFAULT_ENGINES)),
        async (engine) => cpMap(
            inputPaths,
            async (ip) => {
                mkdirp(tempFolder);
                const minT1 = (new Date()).getTime();
                await imagemin(
                    forceArray(inputPaths),
                    {
                        destination: tempFolder,
                        ...ENGINES_CONF[engine],
                    }
                );
                const minT2 = (new Date()).getTime() - minT1;
                const ipSize = fs.statSync(ip).size;
                process.stdout.write([
                        path.basename(ip),
                        prettyBytes(ipSize),
                        `${ipSize} bytes `,
                    ].join(' ')
                );
                fs.readdirSync(tempFolder).forEach((f) => {
                    const fp = path.join(tempFolder, f);
                    const fSize = fs.statSync(fp).size;
                    const resPath = path.join(
                        path.dirname(ip),
                        `${path.basename(f, path.extname(path.basename(f)))}-${engine}.${engine.split('-')[0]}`
                    );
                    process.stdout.write([
                        '-[',
                        `${(ipSize ? (fSize / ipSize) * 100 : 0).toFixed(2)}%`,
                        ']->',
                        path.basename(resPath),
                        prettyBytes(fSize),
                        `${fSize} bytes`,
                        `${(minT2 / imagesCount).toFixed(0)} ms/image`,
                    ].join(' '));
                    if (fs.existsSync(resPath)) {
                        fs.unlinkSync(resPath);
                    }
                    fs.renameSync(fp, resPath);
                });
                rmrf(tempFolder);
                process.stdout.write('\n')
            }
        )
    );
    if (removeOriginalImages) {
        forceArray(inputPaths).forEach(
            (ip) => {
                process.stderr.write(`[optimize-images] Removing original: ${ip}\n`);
                fs.unlinkSync(ip)
            }
        )
    }
};

const resize = (
    inputBuffer,
    o = {},
    format = 'jpeg'
) => sharp(inputBuffer).resize({
    width: 2048,
    height: 2048,
    fit: sharp.fit.inside,
    position: sharp.strategy.entropy,
    ...(o || {}),
}).toFormat(format || 'jpeg', undefined).toBuffer();

module.exports = {
    ENGINES_CONF,
    optimizeImage,
    resize,
};
