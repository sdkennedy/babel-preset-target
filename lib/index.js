'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var fs = require('fs');
var path = require('path');
var availablePresets = require('../presets.json');
var defaultRequirements = require('../plugin-requirements.json');
var pluginsTransformSyntax = require('../plugins-transform-syntax.json');
var canIUse = require('./caniuse');
var compatTable = require('./compat-table');

var _require = require('./util');

var $ = _require.bind;
var average = _require.average;
var identity = _require.identity;

var resolve = require('./resolve');

var supportedPlugins = Object.keys(defaultRequirements);

function getSupportFromQuery(query, name, version, features) {
  var results = features.map($(query, name, version)).filter(function (x) {
    return (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object';
  });
  if (results.length === 0) {
    return undefined;
  }
  // For now hard code 100% support requirement
  return average(results.map(function (_ref) {
    var support = _ref.support;
    return support;
  })) < 1;
}

// Determines if target requires plugin
function targetRequiresPlugin(requirements, plugin, target) {
  var requirement = requirements[plugin];
  if (!requirement) {
    // if requirement isn't defined assume we need the plugin
    return true;
  }

  var name = target.name;
  var version = target.version;
  // Check support in compatTable

  if (requirement.ct) {
    var ctResult = getSupportFromQuery(compatTable.query, name, version, requirement.ct);
    if (typeof ctResult !== 'undefined') {
      return ctResult;
    }
  }

  // Check support in canIUse
  if (requirement.canIUse) {
    var canIUseResult = getSupportFromQuery(canIUse.query, name, version, requirement.canIUse);
    if (typeof canIUseResult !== 'undefined') {
      return canIUseResult;
    }
  }
  return true;
}

// Determines if any of the targets require the plugin
function targetsRequirePlugin(requirements, targets, plugin) {
  if (targets.length === 0) {
    // If no targets are defined default to including plugin
    return true;
  }

  return Boolean(targets.find($(targetRequiresPlugin, requirements, plugin)));
}

function getPresetPlugins() {
  var plugins = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
  var subPresets = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  return subPresets.reduce(function (acc, presetKey) {
    var preset = typeof presetKey === 'string' ? availablePresets[presetKey] : preset;
    if (preset) {
      return [].concat(_toConsumableArray(acc), _toConsumableArray(getPresetPlugins(preset.plugins, preset.presets)));
    }
    return acc;
  }, plugins);
}

function requirePlugin(plugin) {
  if (typeof plugin === 'string') {
    var moduleId = 'babel-plugin-' + plugin;
    // By default resolve plugin from project direct otherwise fallback to babel-preset-target node_modules
    try {
      return require(resolve(moduleId));
    } catch (err) {
      return require(moduleId);
    }
  } else {
    return plugin;
  }
}

module.exports = function preset(context) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var _options$targets = options.targets;
  var targets = _options$targets === undefined ? [] : _options$targets;
  var _options$presets = options.presets;
  var presets = _options$presets === undefined ? [] : _options$presets;
  var _options$plugins = options.plugins;
  var plugins = _options$plugins === undefined ? [] : _options$plugins;
  var _options$requirements = options.requirements;
  var requirements = _options$requirements === undefined ? defaultRequirements : _options$requirements;
  var _options$resolvePlugi = options.resolvePlugins;
  var resolvePlugins = _options$resolvePlugi === undefined ? true : _options$resolvePlugi;

  var allPlugins = getPresetPlugins(plugins, presets);
  return {
    plugins: allPlugins.reduce(function (acc, plugin) {
      if (targetsRequirePlugin(requirements, targets, plugin)) {
        // Plugin is required
        return [].concat(_toConsumableArray(acc), [plugin]);
      } else if (pluginsTransformSyntax[plugin]) {
        // Plugin is not required but we should still include the syntax parsing plugin
        return [].concat(_toConsumableArray(acc), _toConsumableArray(pluginsTransformSyntax[plugin]));
      }
      return acc;
    }, []).map(resolvePlugins ? requirePlugin : identity)
  };
};