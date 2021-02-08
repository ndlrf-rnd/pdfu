const fs = require('fs');
const xmlJs = require('xml-js');
const flatten = require('lodash.flatten');
const {runCommand} = require('./utils/fs');
const {error, log} = require('./utils/log');
const {REPORT_OPTIONS, XML2JS_REPORT_OPTIONS} = require('./constants');

const unwrap = (arr) => (Array.isArray(arr) && (arr.length === 1) ? arr[0] : arr);
const importVeraPdfReport = (reportXmlPath, options = REPORT_OPTIONS) => {
  const o = {...REPORT_OPTIONS, ...(options || REPORT_OPTIONS)};
  const veraResultJs = xmlJs.xml2js(
    fs.readFileSync(reportXmlPath, o.encoding),
    XML2JS_REPORT_OPTIONS,
  );
  return {
    reportXmlPath,
    isCompliant: unwrap(flatten(veraResultJs.report.map(
      ({jobs}) => flatten((jobs || []).map(
        ({job}) => flatten((job || []).map(
          ({item}) => (item || []).map(
            ({_attributes}) => (_attributes || {isCompliant: 'false'}).isCompliant === 'true',
          )
        ))
      )),
    ))),
    report: unwrap(flatten(
      veraResultJs.report.map(
        ({jobs}) => flatten((jobs || []).map(
          ({job}) => flatten((job || []).map(
            ({item, validationReport}) => ({
              attrs: unwrap((item || []).map(
                ({_attributes}) => ({
                  ..._attributes,
                  name: (item || []).map(
                    ({name}) => flatten((name || []).map(
                      ({_text}) => _text
                    )).join('\n')
                  ).join(''),
                })
              )),
              details: unwrap(flatten(validationReport.map(
                ({_attributes, details}) => ({
                  ..._attributes,
                  rules: flatten((details || []).map(
                    ({rule}) => (rule || []).map(
                      ({_attributes: ra, description, object}) => ({
                        ...ra,
                        description: [
                          ...description,
                          ...object,
                        ].map(
                          ({_text}) => _text.join('\n').trim()
                        ).join('\n').trim(),
                      })
                    )
                  )),
                })
              ))),
            })
          ))
        )),
      )
    )),
  };
};

const importVeraPdfMetadata = (metadataXmlPath, options = REPORT_OPTIONS) => {
  const o = {...REPORT_OPTIONS, ...(options || REPORT_OPTIONS)};
  const metadata = xmlJs.xml2js(
    fs.readFileSync(metadataXmlPath, o.encoding),
    XML2JS_REPORT_OPTIONS,
  );
  return {
    metadata: unwrap(flatten(
      metadata.report.map(
        ({jobs}) => flatten((jobs || []).map(
          ({job}) => flatten((job || []).map(
            ({item, featuresReport}) => ({
              attrs: (item || []).map(
                ({_attributes}) => ({
                  ..._attributes,
                  name: (item || []).map(
                    ({name}) => flatten((name || []).map(
                      ({_text}) => _text
                    )).join('\n')
                  ).join(''),
                })
              ),
              details: unwrap(flatten((featuresReport || []).map(
                ({informationDict}) => flatten((informationDict || []).map(
                  ({entry}) => (entry || []).reduce(
                    (a, {_attributes: {key}, _text}) => {
                      a[key] = _text.join('\n').trim();
                      return a;
                    },
                    {}
                  )
                )),
              ))),
            })
          ))
        )),
      )
    )),
    metadataXmlPath,
  };
};

const makeVeraPdfMetadata = async (input, xmlPath, options = REPORT_OPTIONS) => {
  const o = {...REPORT_OPTIONS, ...(options || REPORT_OPTIONS)};
  if (!fs.existsSync(o.path)) {
    process.stderr.write(`Vera PDF not found at ${o.path} path. Not running\n`);
    return {};
  }
  const veraMetadataCmd = `${o.cmdMetadata} ${input} > ${xmlPath}`;
  log(`veraPDF metadata - running: ${veraMetadataCmd}`);
  await runCommand(veraMetadataCmd);
  importVeraPdfMetadata(xmlPath, o);
  log(`veraPDF metadata - done. Metadata path: ${xmlPath}`);
};

const makeVeraPdfReport = async (input, xmlPath, options = REPORT_OPTIONS) => {
  const o = {...REPORT_OPTIONS, ...(options || REPORT_OPTIONS)};
  const veraPdfCmd = `${o.path} ${o.cmd} ${input} > ${xmlPath}`;
  let isCompliant = null;
  if (!fs.existsSync(o.path)) {
    process.stderr.write(`Vera PDF not found at ${o.path} path. Not running\n`);
    return {};
  }
  log(`veraPDF checks - running ${veraPdfCmd}`);
  try {
    isCompliant = (await runCommand(veraPdfCmd)) === 0;
  } catch (e) {
    isCompliant = false;
  }
  const result = importVeraPdfReport(xmlPath, o);
  if (!isCompliant) {
    error('veraPDF checks - failed');
  } else {
    error('veraPDF checks - successful');
  }
  log(`veraPDF checks - done. Report path: ${xmlPath}`);
  return result;
};

module.exports = {
  makeVeraPdfReport,
  importVeraPdfReport,
  makeVeraPdfMetadata,
  importVeraPdfMetadata,
};
