const arrays = (x) => (Array.isArray(x) && (x.length === 1) ? x[0] : x);

const forceArray = (x) => (Array.isArray(x) ? x : [x].filter((v) => !!v));

const range = (x) => (' '.repeat(x)).split('').map((_, idx) => idx);

module.exports = {
  range,
  forceArray,
  unwrap: arrays,
};
