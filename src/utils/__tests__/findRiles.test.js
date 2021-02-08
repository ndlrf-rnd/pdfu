const path = require('path');
const {cpMap} = require('../chainPromises');
const {findFiles} = require('../fs');

test('findPdfs', async (done) => {
  expect.assertions(6);
  await cpMap(
    [
      path.join(__dirname, '..', '..', '__tests__', 'data'),
      path.join(__dirname, '..', '..', '__tests__', 'data') + path.sep,
      path.join(__dirname, '..', '..', '__tests__', 'data', '*.pdf'),
      path.join(__dirname, '..', '..', '__tests__', 'data', '**', '*.pdf'),
    ],
    async (p) => {
      expect(
        (await findFiles(p, 'pdf')).map(p => path.basename(p))
      ).toEqual(
        ['page-1-42.pdf']
      );
    }
  );
  expect(
    await findFiles(
      path.join(__dirname, '..', '..', '__tests__', 'data'),
      'txt'
    )
  ).toEqual(
    []
  );
  expect(
    (await findFiles(
      path.join(__dirname, '..', '..', '__tests__', 'data', '*.pdf'),
      'txt'
    )).map(p => path.basename(p))
  ).toEqual(
    ['page-1-42.pdf']
  );
  done()
});
