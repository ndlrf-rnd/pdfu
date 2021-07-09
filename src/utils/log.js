// eslint-disable-next-line no-console
const debug = console.debug;

// eslint-disable-next-line no-console
const info = (...args)=>process.stdout.write(`${args.join(' ')}\n`);

// eslint-disable-next-line no-console
const warn = (...args)=>process.stderr.write(`WARNING: ${args.join(' ')}\n`);

// eslint-disable-next-line no-console
const error = (...args)=>process.stderr.write(`ERROR: ${args.join(' ')}\n`);

// eslint-disable-next-line no-console
const log = (...args) => (process.env.DEBUG ? console.debug(...args) : null);

module.exports = {
  debug,
  info,
  warn,
  error,
  log,
};
