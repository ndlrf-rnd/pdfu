const path = require('path');
const fs = require('fs');
const { rmrf, mkdirpSync } = require('./../utils/fs');
const { slicePdf } = require('../slicePdf');

const TMP_DIR = path.join(__dirname, 'output/split_test/');
const INPUT_PDF = path.join(__dirname, 'data/page-1-42.pdf');

const PARAMS = {
  step: 10,
  debug: true,
};

const REF = [
  {
    created: true,
    fromId: 0,
    fromPage: 1,
    slicePath: path.join(TMP_DIR, 'page-1-10.pdf'),
    toId: 9,
    toPage: 10,
  },
  {
    created: true,
    fromId: 10,
    fromPage: 11,
    slicePath: path.join(TMP_DIR, 'page-11-20.pdf'),
    toId: 19,
    toPage: 20,
  },
  {
    created: true,
    fromId: 20,
    fromPage: 21,
    slicePath: path.join(TMP_DIR, 'page-21-30.pdf'),
    toId: 29,
    toPage: 30,
  },
  {
    created: true,
    fromId: 30,
    fromPage: 31,
    slicePath: path.join(TMP_DIR, 'page-31-40.pdf'),
    toId: 39,
    toPage: 40,
  },
  {
    created: true,
    fromId: 40,
    fromPage: 41,
    slicePath: path.join(TMP_DIR, 'page-41-42.pdf'),
    toId: 41,
    toPage: 42,
  },
];

test('test ordinal', (done) => {
  mkdirpSync(TMP_DIR);
  slicePdf(
    INPUT_PDF,
    TMP_DIR,
    PARAMS,
  ).then((res) => {
    expect(res).toEqual(REF);
    res.forEach(({ slicePath }) => {
      expect(fs.existsSync(slicePath)).toBeTruthy();
      expect(fs.statSync(slicePath).size).toBeGreaterThan(100 * 1000);
    });
    rmrf(TMP_DIR);
    done();
  }).catch((e) => {
    rmrf(TMP_DIR);
    done(e);
  });
});
