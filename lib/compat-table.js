'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Normalize keys to browser + version format used in icanuse
var es5 = require('compat-table/data-es5');
var es6 = require('compat-table/data-es6');
var es2016plus = require('compat-table/data-es2016plus');
var rawVersionMap = require('../compat-table-versions.json');

var _require = require('./util');

var average = _require.average;
var toTuples = _require.toTuples;

// Invert map for faster lookup

var versionMap = Object.keys(rawVersionMap).reduce(function (acc, key) {
    var _rawVersionMap$key = rawVersionMap[key];
    var name = _rawVersionMap$key.name;
    var version = _rawVersionMap$key.version;

    acc[name + '.' + version] = key;
    return acc;
}, {});

// Merge all tests together
var tests = [es5, es6, es2016plus].reduce(function (acc, _ref) {
    var tests = _ref.tests;
    return [].concat(_toConsumableArray(acc), _toConsumableArray(tests));
}, []);

var buildKey = function buildKey(name, version) {
    return versionMap[name + '.' + version];
};
var getTest = function getTest(name) {
    return tests.find(function (test) {
        return test.name === name;
    });
};

function getResultsForKey(subtests, key) {
    return subtests.map(function (_ref2) {
        var _ref2$res = _ref2.res;
        var res = _ref2$res === undefined ? {} : _ref2$res;
        return res[key];
    }).filter(function (val) {
        return typeof val !== 'undefined';
    });
}

var buildOutput = function buildOutput(results) {
    return {
        support: average(results.map(function (val) {
            return val === false ? 0 : 1;
        }))
    };
};

function buildExactOutput(subtests, name, version) {
    var exactKey = buildKey(name, version);
    var exactResults = getResultsForKey(subtests, exactKey);
    if (exactResults.length) {
        // Subtests cover exact browser version
        return buildOutput(exactResults);
    }
    return undefined;
}

function getLatestKey(subtests, needleName, needleVersion) {
    if (subtests.length === 0) {
        return undefined;
    }
    // Look at the first subtest results to determine which browsers the test was run on
    var possibleKeys = Object.keys(subtests[0].res);

    var _possibleKeys$filter$ = possibleKeys
    // Filter out keys for a different browser
    .filter(function (possibleKey) {
        // Lookup browser name from rawVersionMap
        var _rawVersionMap$possib = rawVersionMap[possibleKey];
        _rawVersionMap$possib = _rawVersionMap$possib === undefined ? {} : _rawVersionMap$possib;
        var name = _rawVersionMap$possib.name;

        return name === needleName;
    })
    // Find highest version we have data for
    .reduce(function (acc, possibleKey) {
        var _acc = _slicedToArray(acc, 2);

        var accVersion = _acc[0];
        var accKey = _acc[1];

        var possibleVersion = parseFloat(rawVersionMap[possibleKey].version);
        if (possibleVersion > accVersion) {
            return [possibleVersion, possibleKey];
        }
        return acc;
    }, [0, null]);

    var _possibleKeys$filter$2 = _slicedToArray(_possibleKeys$filter$, 2);

    var highestVersion = _possibleKeys$filter$2[0];
    var highestKey = _possibleKeys$filter$2[1];
    // needle version is higher than the highest version we have info for

    if (highestKey && needleVersion > highestVersion) {
        return [highestKey, highestVersion];
    }
    return undefined;
}

function buildLatestOutput(subtests, name, version) {
    var _ref3 = getLatestKey(subtests, name, version) || [];

    var _ref4 = _slicedToArray(_ref3, 2);

    var latestKey = _ref4[0];
    var latestVersion = _ref4[1];

    if (latestKey) {
        var latestResults = getResultsForKey(subtests, latestKey);
        if (latestResults.length) {
            console.warn('No compat-table data for version ' + version + ' falling back to ' + latestVersion);
            return buildOutput(latestResults);
        }
    }
    return undefined;
}

module.exports.query = function query(name, version, feature) {
    var test = getTest(feature);
    if (!test) {
        // No test for feature
        return undefined;
    }

    var subtests = test.subtests;
    // Look for exact version

    var exactOutput = buildExactOutput(subtests, name, version);
    if (exactOutput) {
        // Subtests cover exact browser version
        return exactOutput;
    }

    // Find the latest version we have data for if version is greater than that value
    var latestOutput = buildLatestOutput(subtests, name, version);
    if (latestOutput) {
        return latestOutput;
    }

    return undefined;
};