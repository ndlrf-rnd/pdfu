const path = require('path');
const fs = require('fs');
const os = require('os');
const { rmrf } = require('./../utils/fs');
const { slicePdf } = require('../slicePdf');

const TMP_DIR = path.join(os.tmpdir(), 'glob_test_output/');
const INPUT_PDF = path.join(__dirname, 'data/page-01-42.pdf');

const PARAMS = {
  step: 10,
  debug: true,
};

const REF = [
  {
    created: true,
    fromId: 0,
    fromPage: 1,
    chunkPath: path.join(TMP_DIR, 'page-01-10.pdf'),
    toId: 9,
    toPage: 10,
  },
  {
    created: true,
    fromId: 10,
    fromPage: 11,
    chunkPath: path.join(TMP_DIR, 'page-11-20.pdf'),
    toId: 19,
    toPage: 20,
  },
  {
    created: true,
    fromId: 20,
    fromPage: 21,
    chunkPath: path.join(TMP_DIR, 'page-21-30.pdf'),
    toId: 29,
    toPage: 30,
  },
  {
    created: true,
    fromId: 30,
    fromPage: 31,
    chunkPath: path.join(TMP_DIR, 'page-31-40.pdf'),
    toId: 39,
    toPage: 40,
  },
  {
    created: true,
    fromId: 40,
    fromPage: 41,
    chunkPath: path.join(TMP_DIR, 'page-41-42.pdf'),
    toId: 41,
    toPage: 42,
  },
];

test('test ordinal', (done) => {
  slicePdf(
    INPUT_PDF,
    TMP_DIR,
    PARAMS,
  ).then((res) => {
    expect(res).toEqual(REF);
    res.forEach(({ chunkPath }) => {
      expect(fs.existsSync(chunkPath)).toBeTruthy();
      expect(fs.statSync(chunkPath).size).toBeGreaterThan(100 * 1000);
    });
    rmrf(TMP_DIR);
    done();
  }).catch((e) => {
    rmrf(TMP_DIR);
    done(e);
  });
});
