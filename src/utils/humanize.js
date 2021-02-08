const prettyBytes = (num) => {
  if ((typeof num !== 'number') || Number.isNaN(num)) {
    throw new TypeError('Expected a number');
  }

  const neg = num < 0;
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  if (neg) {
    num = -num;
  }

  if (num < 1) {
    return `${(neg ? '-' : '') + num} B`;
  }

  const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
  num = (num / (1000 ** exponent)).toFixed(2) * 1;
  return `${(neg ? '-' : '') + num} ${units[exponent]}`;
};


/**
 * Pad string on left side
 * @param str
 * @param len
 * @param sym
 * @returns {string}
 */
const padLeft = (str, len, sym = ' ') => [
  `${sym}`.repeat(Math.max(len - `${str}`.length, 0)),
  str,
].join('');

/**
 * Pad string on right side
 * @param str
 * @param len
 * @param sym
 * @returns {string}
 */
const padRight = (str, len, sym = ' ') => [
  str,
  `${sym}`.repeat(Math.max(len - `${str}`.length, 0)),
].join('');

const formatUuid = (uuidStr) => [
  uuidStr.substr(0, 8),
  uuidStr.substr(8, 4),
  uuidStr.substr(12, 4),
  uuidStr.substr(16, 4),
  uuidStr.substr(20, 12),
].join('-');

module.exports = {
  formatUuid,
  padRight,
  padLeft,
  prettyBytes,
};
