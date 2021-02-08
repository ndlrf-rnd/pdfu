const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const c = require('./constants');

const textStat = (inputStr) => {
  const perChar = inputStr.split('');
  const perWord = inputStr.split(' ');
  const charsFreq = {};
  perChar.forEach((char) => {
    charsFreq[char] = (charsFreq[char] || 0) + 1;
  });
  const allChars = Object.keys(charsFreq).sort();
  const allPrintableChars = allChars.filter((ch) => ch.match(/[^\n\t\r ]/));
  const charsCount = Object.values(charsFreq).reduce((a, v) => a + v, 0);
  const charsCountPrintable = allPrintableChars.reduce((a, ch) => a + charsFreq[ch], 0);
  const wordsCount = perWord.length;
  const averageWordLength = parseFloat(
    (perWord.reduce((a, obj) => a + obj.length, 0) / perWord.length).toFixed(3),
  );
  const charsCountNonPrintable = charsCount - charsCountPrintable;
  return {
    wordsCount,
    charsCount,
    charsCountPrintable,
    charsCountNonPrintable,
    charsFreq,
    averageWordLength,
  };
};

const textFileStat = (inputFilePath, options = c.REPORT_OPTIONS) => {
  const o = { ...c.REPORT_OPTIONS, ...(options || {}) };
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`Invalid input file path: ${inputFilePath}`);
  }
  const inputStr = fs.readFileSync(inputFilePath, o.encoding);
  return textStat(inputStr, options);
};


const charsStat = (pageChars) => {
  const pages = Object.keys(pageChars).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const charsFreq = Object.values(pageChars).sort().reduce(
    (a, pageCharsFreq) => {
      Object.keys(pageCharsFreq || {}).forEach((k) => {
        a[k] = (a[k] || 0) + pageCharsFreq[k];
      });
      return a;
    },
    {}
  );

  const allChars = Object.keys(charsFreq).sort();

  const charsTable = [
    [
      'page',
      ...allChars.map(
        (char) => char.replace(/\t/, '[TAB]').replace(/\n/, '[NL]').replace(/\r/, '[CR]')
      ),
    ],
    ...pages.map(
      (pageNumber) => ([
        pageNumber,
        ...allChars.map((k) => pageChars[pageNumber][k] || 0),
      ])
    ),
  ];
  const allPrintableChars = allChars.filter((ch) => ch.match(/[^\n\t\r ]/));
  const printableCharsRatioTable = [
    [
      'page',
      ...allPrintableChars.map(
        (char) => char
      ),
    ],
    ...pages.map(
      (pageNumber) => {
        const pageCharsTotal = allPrintableChars.reduce(
          (a, ch) => a + (pageChars[pageNumber][ch] || 0),
          0
        );
        return [
          pageNumber,
          ...allPrintableChars.map(
            (ch) => (pageCharsTotal > 0 ? (pageChars[pageNumber][ch] || 0) / pageCharsTotal : 0)
          ),
        ];
      }
    ),
  ];
  return {
    charsFreq,
    charsTable,
    printableCharsRatioTable,
  };
};

if ((process.mainModule) && (process.mainModule.filename === __filename)) {
  if (process.argv.length < 3) {
    throw new Error('No input file defined. Run script as:\n$ textStat.js input.txt');
  }
  const inputFilePath = path.resolve(process.argv[2]);
  const report = textFileStat(inputFilePath);
  const format = (c.REPORT_OPTIONS.format || '');

  let resulttStr = '';
  if (format === 'yaml') {
    resulttStr = yaml.safeDump(report, c.REPORT_OPTIONS.yaml);
  } else if (format === 'yaml') {
    resulttStr = JSON.stringify(report, null, c.REPORT_OPTIONS.json.ident);
  } else {
    resulttStr = `ERROR: INVALID REPORT FORMAT: "${c.REPORT_OPTIONS.format}"`;
    process.stderr.write(resulttStr);
    process.exit(1);
  }

  process.stdout.write(resulttStr);
  process.exit(0);
}

module.exports = {
  textStat,
  textFileStat,
  charsStat,
};
