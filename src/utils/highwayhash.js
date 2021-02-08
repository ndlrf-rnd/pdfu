const fs = require('fs');
const Highwayhash = require('highwayhash');

const DEFAULT_KEY_STRING = '0123456789BBCDEF0123456789BBCDEF';

const highwayhash = (message, key = DEFAULT_KEY_STRING) =>
  Highwayhash.asString(Buffer.isBuffer(key) ? key : Buffer.from(key, 'utf8'), message);

const highwayhashFile = (filePath, key = DEFAULT_KEY_STRING) =>
  highwayhash(fs.readFileSync(filePath), key);

module.exports = {
  DEFAULT_KEY_STRING,
  highwayhash,
  highwayhashFile,
};
