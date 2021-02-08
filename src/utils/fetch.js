const { fs } = require('fs');
const { path } = require('path');
const { request } = require('superagent');

const { mkdirp } = require('./fs');
const { error, log } = require('./log');
const { c } = require('../constants');

/**
 * Fetch remote file
 * @param src
 * @param localPath
 * @returns {Promise<Promise<*|*|Promise<any>|Promise>|*>}
 */
const fetch = async (src, localPath) => {
  if (src.startsWith('file://')) {
    mkdirp(path.dirname(localPath));
    fs.copyFileSync(src.split('//')[1], localPath);
    return localPath;
  }

  const requestAction = request.get(src).set({ 'User-Agent': c.resourceDownloadUserAgent });
  requestAction.pipe(fs.createWriteStream(localPath));
  return new Promise((resolve, reject) => {
    requestAction.on('error', (e) => {
      error(`Error while downloading ${src}`, e);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      reject(e);
    });
    requestAction.on('end', () => {
      log('[Download Success]', src);
      resolve(localPath);
    });
  });
};

module.exports = {
  fetch,
};
