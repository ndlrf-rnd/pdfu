const { processPdf } = require('./pdf');
const { page2svg } = require('./page2svg');
const { parseArgs } = require('./cli');
const { error } = require('./utils/log');
const { slicePdf } = require('./slicePdf');

// Main
const run = () => {
  const args = process.argv.slice(2, process.argv.length);
  processPdf(parseArgs(args))
    .then(() => process.exit(0))
    .catch((e) => {
      error(e);
      process.exit(1);
    });
};

if ((process.mainModule) && (process.mainModule.filename === __filename)) {
  run();
}

module.exports = {
  run,
  slicePdf,
  parseArgs,
  page2svg,
};
