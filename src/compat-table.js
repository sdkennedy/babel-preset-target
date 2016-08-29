// Normalize keys to browser + version format used in icanuse
const es5 = require('compat-table/data-es5');
const es6 = require('compat-table/data-es6');
const es2016plus = require('compat-table/data-es2016plus');
const rawVersionMap = require('../compat-table-versions.json');
const {average, toTuples} = require('./util');

// Invert map for faster lookup
const versionMap = Object
    .keys(rawVersionMap)
    .reduce(
        (acc, key) => {
            const {name, version} = rawVersionMap[key];
            acc[`${name}.${version}`] = key;
            return acc;
        },
        {}
    );

// Merge all tests together
const tests = [es5, es6, es2016plus].reduce(
    (acc, {tests}) => [...acc, ...tests], 
    []
);

const buildKey = (name, version) => versionMap[`${name}.${version}`];
const getTest = name => tests.find(test => test.name === name);

function getResultsForKey(subtests, key) {
    return subtests
        .map(({res = {}}) => res[key])
        .filter(val => typeof val !== 'undefined');
}

const buildOutput = results => ({
    support: average(results.map(val => val === false ? 0 : 1))
});

function buildExactOutput(subtests, name, version) {
    const exactKey = buildKey(name, version);
    const exactResults = getResultsForKey(subtests, exactKey);
    if (exactResults.length) {
        // Subtests cover exact browser version
        return buildOutput(exactResults);
    }
    return undefined;
}

// Get the latest version that is less than the specified version
function getLatestKey(subtests, needleName, needleVersion) {
    if (subtests.length === 0) {
        return undefined;
    }
    // Look at the first subtest results to determine which browsers the test was run on
    const possibleKeys = Object.keys(subtests[0].res);
    const [highestVersion, highestKey] = possibleKeys
        // Filter out keys for a different browser
        .filter(possibleKey => {
            // Lookup browser name from rawVersionMap
            const {
                [possibleKey]: {name} = {}
            } = rawVersionMap;
            return name === needleName;
        })
        // Find highest version we have data for
        .reduce(
          (acc, possibleKey) => {
              const [accVersion, accKey] = acc;
              const possibleVersion = parseFloat(rawVersionMap[possibleKey].version);
              if(possibleVersion > accVersion && needleVersion > accVersion) {
                  return [possibleVersion, possibleKey];
              }
              return acc;
          },
          [0, null]
        );
    // needle version is higher than the highest version we have info for
    if (highestKey) {
        return [highestKey, highestVersion];
    }
    return undefined;
}

function buildLatestOutput(subtests, name, version) {
    const [latestKey, latestVersion] = getLatestKey(subtests, name, version) || [];
    if (latestKey) {
        const latestResults = getResultsForKey(subtests, latestKey);
        if (latestResults.length) {
            console.warn(`No compat-table data for version ${version} falling back to ${latestVersion}`);
            return buildOutput(latestResults);
        }
    }
    return undefined;
}

module.exports.query = function query(name, version, feature) {
    const test = getTest(feature);
    if (!test) {
        // No test for feature
        return undefined;
    }

    const {subtests} = test;
    // Look for exact version
    const exactOutput = buildExactOutput(subtests, name, version);
    if (exactOutput) {
        // Subtests cover exact browser version
        return exactOutput;
    }

    // Find the latest version we have data for if version is greater than that value
    const latestOutput = buildLatestOutput(subtests, name, version);
    if (latestOutput) {
        return latestOutput;
    }

    return undefined;
}