// eslint-disable-next-line no-console
const debug = console.debug;

// eslint-disable-next-line no-console
const info = console.info;

// eslint-disable-next-line no-console
const warn = console.warn;

// eslint-disable-next-line no-console
const error = console.error;

// eslint-disable-next-line no-console
const log = (...args) => (process.env.DEBUG ? console.debug(...args) : null);

module.exports = {
  debug,
  info,
  warn,
  error,
  log,
};
