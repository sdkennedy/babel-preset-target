'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var canIUse = require('caniuse-db/data.json');

var supportMap = {
  y: 1,
  a: 0.01,
  n: 0,
  p: 0,
  u: 0,
  x: 0,
  d: 0
};

function getBrowserSupport(featureSupport, browser) {
  var _featureSupport$stats = featureSupport.stats;
  _featureSupport$stats = _featureSupport$stats === undefined ? {} : _featureSupport$stats;
  var browserSupport = _featureSupport$stats[browser];

  return browserSupport;
}

function parseVersionKey(key) {
  var parts = key.split('-');
  var range = parts.length === 2 ? parts : [parts[0], parts[0]];

  var _range$map = range.map(parseFloat);

  var _range$map2 = _slicedToArray(_range$map, 2);

  var minVersion = _range$map2[0];
  var maxVersion = _range$map2[1];

  return { minVersion: minVersion, maxVersion: maxVersion, key: key };
}

function getVersions(supportObj) {
  return Object.keys(supportObj).map(parseVersionKey).sort(function (a, b) {
    return a.maxVersion - b.maxVersion;
  });
}

function parseVersionSupport(supportStr, notes) {
  var parts = supportStr.split(' ');
  var support = parts[0];
  var noteKeys = parts.slice(1)
  // Strip '#' character
  .map(function (key) {
    return key.substr(1);
  });
  return {
    full: support === 'y',
    partial: support === 'a',
    none: support === 'n',
    polyfill: support === 'p',
    unknown: support === 'u',
    prefix: support === 'x',
    flag: support === 'd',
    support: supportMap[support],
    notes: noteKeys.map(function (key) {
      return notes[key];
    })
  };
}

module.exports.query = function query(browser, version, feature) {
  var featureSupport = canIUse.data[feature];
  if (!featureSupport) {
    return undefined;
  }
  var browserSupport = getBrowserSupport(featureSupport, browser);
  if (!browserSupport) {
    return undefined;
  }
  var versions = getVersions(browserSupport);
  if (typeof version === 'undefined') {
    // Set version to latest version
    version = versions[versions.length - 1].maxVersion;
  }

  var _ref = versions.find(function (_ref2) {
    var maxVersion = _ref2.maxVersion;
    var minVersion = _ref2.minVersion;
    return version >= minVersion && version <= maxVersion;
  }) || {};

  var key = _ref.key;

  if (!key) {
    return undefined;
  }

  return parseVersionSupport(browserSupport[key], featureSupport.notes);
};