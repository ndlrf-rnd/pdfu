const { error } = require('./utils/log');


const trapExceptions = () => {
  ['uncaughtException', 'unhandledRejection'].forEach(
    (globalException) => {
      process.on(globalException, (err) => {
        error(err);
        process.exit(1);
      });
    },
  );
};

const init = () => {
  trapExceptions();
  process.env.DEBUG = (process.argv.indexOf('--debug') !== -1) || (process.argv.indexOf('-d') !== -1) || process.env.DEBUG || '';
};

module.exports = {
  init,
};
