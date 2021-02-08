const argparse = require('argparse');
const fs = require('fs');
const path = require('path');

const c = require('./constants');
const {ENGINES_CONF} = require("./optimize-images");

const packageInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));

const parseArgs = (args) => {
  const parser = new argparse.ArgumentParser({
    version: packageInfo.version,
    description: packageInfo.name,
    addHelp: true,
  });

  parser.addArgument(
    ['-f', '--overwrite', '--force'],
    {
      help: 'force re-create existing files',
      action: ['storeTrue'],
    },
  );

  parser.addArgument(
    ['-s', '--step'],
    {
      help: 'max pages in PDF slice',
      type: 'int',
      defaultValue: c.DEFAULT_OPTIONS.step,
    },
  );

  parser.addArgument(
    ['-d', '--debug'],
    {
      help: 'debug output',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['-o', '--output'],
    {
      help: 'output path',
    },
  );
  parser.addArgument(
    ['-I', '--no-images'],
    {
      help: 'don\'t export resource images',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['-V', '--vera'],
    {
      help: 'Force enable verapdf reporting if verapdf is installed',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['-S', '--svg'],
    {
      help: 'export to .svg',
      action: ['storeTrue'],
    },
  );

  parser.addArgument(
    ['-H', '--html'],
    {
      help: 'Export to .html and .xhtml',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['--highwayhash'],
    {
      help: 'Calculate input file highwayhash',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['-O', '--optimize'],
    {
      help: 'Optimize images',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['--optimize-engines'],
    {
      help: 'Image optimization engines',
      options: Object.keys(ENGINES_CONF).sort(),
      nargs: '*'
    },
  );
  parser.addArgument(
    ['--optimize-replace'],
    {
      help: 'Remove original images after iptimization',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['-P', '--preview'],
    {
      help: 'Render preview with max size in px given as WxH (e.g. 2048x1536)',
    },
  );
  parser.addArgument(
    ['--md5'],
    {
      help: 'Calculate input file md5 checksum',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['-T', '--text'],
    {
      help: 'Export text from pages to .txt',
      action: ['storeTrue'],
    },
  );
  parser.addArgument(
    ['-r', '--render'],
    {
      help: 'Page render size in px in format WxH (e.g. 2048x1536)',
      nargs: '?'
    },
  );
  parser.addArgument(
    ['-p', '--pages', '--page'],
    {
      help: 'Page ranges and numbers like "4,6,8-10,12,14..16,18,20..23-5" negative numbers using enumeration from tail of total pages count, so for 32 pages PDF -1 is 32 and -33 is 1 page',
    },
  );

  parser.addArgument(
    'input',
    {
      help: 'input .pdf file path',
      type: 'string',
    },
  );

  return parser.parseArgs(args);
};

module.exports = {
  parseArgs,
};
