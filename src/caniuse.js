const canIUse = require('caniuse-db/data.json');

const supportMap = {
  y: 1,
  a: 0.01,
  n: 0,
  p: 0,
  u: 0,
  x: 0,
  d: 0,
};

function getBrowserSupport(featureSupport, browser) {
  const {
    stats: {
      [browser]: browserSupport
    } = {}
  } = featureSupport;
  return browserSupport;
}

function parseVersionKey(key) {
  const parts = key.split('-');
  const range = parts.length === 2 ? parts : [parts[0], parts[0]];
  const [minVersion, maxVersion] = range.map(parseFloat);
  return {minVersion, maxVersion, key};
}

function getVersions(supportObj) {
  return Object
    .keys(supportObj)
    .map(parseVersionKey)
    .sort((a, b) => a.maxVersion - b.maxVersion);
}

function parseVersionSupport(supportStr, notes) {
  const parts = supportStr.split(' ');
  const support = parts[0];
  const noteKeys = parts
    .slice(1)
    // Strip '#' character
    .map(key => key.substr(1));
  return {
    full: support === 'y',
    partial: support === 'a',
    none: support === 'n',
    polyfill: support === 'p',
    unknown: support === 'u',
    prefix: support === 'x',
    flag: support === 'd',
    support: supportMap[support],
    notes: noteKeys.map(key => notes[key])
  };
}

module.exports.query = function query(browser, version, feature) {
  const featureSupport = canIUse.data[feature];
  if (!featureSupport) {
    return undefined;
  }
  const browserSupport = getBrowserSupport(featureSupport, browser);
  if (!browserSupport) {
    return undefined;
  }
  const versions = getVersions(browserSupport);
  if (typeof version === 'undefined') {
    // Set version to latest version
    version = versions[versions.length - 1].maxVersion;
  }
  const {key} = versions.find(
    ({maxVersion, minVersion}) => version >= minVersion && version <= maxVersion
  ) || {};
  if (!key) {
    return undefined;
  }

  return parseVersionSupport(
    browserSupport[key],
    featureSupport.notes
  );
};
