'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var Module = require('module');
var path = require('path');

var relativeModules = {};

module.exports = function resolve(loc) {
  var relative = arguments.length <= 1 || arguments[1] === undefined ? process.cwd() : arguments[1];

  // we're in the browser, probably
  if ((typeof Module === 'undefined' ? 'undefined' : _typeof(Module)) === 'object') {
    return null;
  }

  var relativeMod = relativeModules[relative];

  if (!relativeMod) {
    relativeMod = new Module();

    // We need to define an id and filename on our "fake" relative` module so that
    // Node knows what "." means in the case of us trying to resolve a plugin
    // such as "./myPlugins/somePlugin.js". If we don't specify id and filename here,
    // Node presumes "." is process.cwd(), not our relative path.
    // Since this fake module is never "loaded", we don't have to worry about mutating
    // any global Node module cache state here.
    var filename = path.join(relative, '.babelrc');
    relativeMod.id = filename;
    relativeMod.filename = filename;

    relativeMod.paths = Module._nodeModulePaths(relative);
    relativeModules[relative] = relativeMod;
  }

  try {
    return Module._resolveFilename(loc, relativeMod);
  } catch (err) {
    return null;
  }
};