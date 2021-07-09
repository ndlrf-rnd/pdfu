const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const glob = require('glob');

const mkdirp = require('mkdirp');
const flatten = require('lodash.flatten');

const c = require('../constants');
const { cpMap } = require('./chainPromises');
const { forceArray } = require('./arrays');
const { warn, error } = require('./log');

/**
 * @param {string} command process to run
 * @param {string[]} args commandline arguments
 * @returns {Promise<void>} promise
 */
const runCommand = (command, args = []) => new Promise((resolve, reject) => {
  const executedCommand = cp.spawn(command, args, {
    stdio: 'inherit',
    shell: true,
  });
  executedCommand.on('error', (e) => {
    error(e);
    reject(e);
  });
  executedCommand.on('exit', (code) => {
    if (code === 0) {
      resolve(code);
    } else {
      error(`Process exited with code: ${code}`);
      reject(code);
    }
  });
});

/**
 * Recursively remove directory like `rm -rf`
 * Taken from: https://stackoverflow.com/a/32197381
 * @param dirPath {string} - path to remove
 */
const rmrf = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    if (fs.statSync(dirPath).isDirectory()) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = `${dirPath}/${file}`;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          rmrf(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    } else {
      fs.unlinkSync(dirPath);
    }
  }
};

const mkdirpAsync = async (dir, recreate = false) => {
  if (!dir) {
    return null;
  }
  if (recreate && fs.existsSync(dir)) {
    rmrf(dir);
  }
  return new Promise((resolve, reject) => {
    mkdirp(dir, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

const mkdirpSync = (dir, recreate = false) => {
  if (!dir) {
    return null;
  }
  if (recreate && fs.existsSync(dir)) {
    rmrf(dir);
  }
  return mkdirp.sync(dir);
};

const shouldCreate = async (p, overwrite = true, silent = true) => new Promise(
  (resolve, reject) => {
    fs.exists(p, (result) => {
      if (result) {
        if (overwrite) {
          if (!silent) {
            warn(`${p} will be replaced`);
          }
          rmrf(p);
          resolve(true);
        } else {
          if (!silent) {
            warn(`${p} is already exists`);
          }
          resolve(false);
        }
      } else {
        const dir = path.dirname(p);
        fs.exists(dir, (ex) => {
          if (!ex) {
            mkdirpAsync(dir)
              .then(() => resolve(true))
              .catch((e) => {
                error(`Failed to create folder: ${dir}`);
                reject(e);
              });
          } else {
            resolve(true);
          }
        });
      }
    });
  },
);


const findFiles = async (inputPatterns, defaultExtension = '*') => flatten(await cpMap(
  forceArray(inputPatterns),
  (globPattern) => {
    if (!globPattern.match(/[*?+!{}()|@]/ug)) {
      // Usual path
      if (fs.existsSync(globPattern)) {
        const stat = fs.statSync(globPattern);
        if (stat.isDirectory()) {
          globPattern = path.join(globPattern.replace(/[/\\]$/u, ''), '**', `*.${defaultExtension}`);
        } else if (!stat.isFile()) {
          throw new Error(`Invalid pattern: "${globPattern}"`);
        }
      }
    }
    return new Promise(
      (resolve, reject) => glob(
        globPattern,
        c.GLOB_OPTIONS,
        (err, files) => {
          if (err) {
            reject(err);
          } else {
            resolve(files);
          }
        },
      ),
    );
  },
));

const addFilenameSuffix = (fn, suffix = '') => {
  const parts = fn.split('.');
  const basenameIdx = parts.length - ((parts.length > 1) ? 2 : 1);
  parts[basenameIdx] = parts[basenameIdx] + suffix;
  return parts.join('.');
};

module.exports = {
  addFilenameSuffix,
  findFiles,
  rmrf,
  shouldCreate,
  mkdirpSync,
  runCommand,
  mkdirpAsync,
  glob,
};
