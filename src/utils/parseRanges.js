const rangeParser = require('parse-numeric-range');
const uniq = require('lodash.uniq');

const parseRanges = (rangesStr, maxValue = null, maxStep = null) => {
  const numbers = uniq(rangeParser.parse(rangesStr || ''))
    .map((n) => {
      if (n >= 0) {
        return n;
      }
      if ((n < 0) && (maxValue !== null) && (maxValue > 0)) {
        return maxValue + n + 1;
      }
      return null;
    })
    .filter((n) => (n !== null) && ((!maxValue) || (n <= maxValue)))
    .sort((a, b) => a - b);
  if (numbers.length === 0) {
    if ((maxValue !== null) && (maxValue > 0)) {
      for (let i = 1; i < maxValue + 1; i += 1) {
        numbers.push(i);
      }
    }
  }

  let prevNumber = null;
  return numbers
    .reduce((acc, n) => {
      const isSequenceGap = n - prevNumber > 1;
      const isFirstValue = prevNumber === null;
      const isStrideLimit = maxStep
        && (maxStep > 0)
        && (acc.length > 0)
        && ((acc[acc.length - 1].to - acc[acc.length - 1].from) + 1 >= maxStep);
      if (isFirstValue || isSequenceGap || isStrideLimit) {
        acc.push({
          from: n,
          to: n,
        });
      } else {
        acc[acc.length - 1].to = n;
      }
      prevNumber = n;
      return acc;
    }, []);
};

module.exports = { parseRanges };
