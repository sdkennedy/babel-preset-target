const fs = require('fs');
const path = require('path');
const availablePresets = require('../presets.json');
const defaultRequirements = require('../plugin-requirements.json');
const pluginsTransformSyntax = require('../plugins-transform-syntax.json');
const canIUse = require('./caniuse');
const compatTable = require('./compat-table');
const {bind: $, average, identity} = require('./util');
const resolve = require('./resolve');

const supportedPlugins = Object.keys(defaultRequirements);

function getSupportFromQuery(query, name, version, features) {
  const results = features
    .map($(query, name, version))
    .filter(x => typeof x === 'object');
  if (results.length === 0) {
    return undefined;
  }
  // For now hard code 100% support requirement
  return average(results.map(({support}) => support)) < 1;
}

// Determines if target requires plugin
function targetRequiresPlugin(requirements, plugin, target) {
  const requirement = requirements[plugin];
  if (!requirement) {
    // if requirement isn't defined assume we need the plugin
    return true;
  }

  const {name, version} = target;
  // Check support in compatTable
  if (requirement.ct) {
    const ctResult = getSupportFromQuery(compatTable.query, name, version, requirement.ct);
    if (typeof ctResult !== 'undefined') {
      return ctResult;
    }
  }

  // Check support in canIUse
  if (requirement.canIUse) {
    const canIUseResult = getSupportFromQuery(canIUse.query, name, version, requirement.canIUse);
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

  return Boolean(
    targets.find(
      $(targetRequiresPlugin, requirements, plugin)
    )
  );
}

function getPresetPlugins(plugins = [], subPresets = []) {
  return subPresets.reduce(
    (acc, presetKey) => {
      const preset = typeof presetKey === 'string' ? availablePresets[presetKey] : preset;
      if (preset) {
        return [...acc, ...getPresetPlugins(preset.plugins, preset.presets)];
      }
      return acc;
    },
    plugins
  );
}

function requirePlugin(plugin) {
  if (typeof plugin === 'string') {
    const moduleId = `babel-plugin-${plugin}`; 
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

module.exports = function preset(context, options = {}) {
  const {
    targets = [],
    presets = [],
    plugins = [],
    requirements = defaultRequirements,
    resolvePlugins = true
  } = options;
  const allPlugins = getPresetPlugins(plugins, presets);
  return {
    plugins: allPlugins
      .reduce((acc, plugin) => {
        if (targetsRequirePlugin(requirements, targets, plugin)) {
          // Plugin is required
          return [...acc, plugin];
        } else if (pluginsTransformSyntax[plugin]) {
          // Plugin is not required but we should still include the syntax parsing plugin
          return [...acc, ...pluginsTransformSyntax[plugin]];
        }
        return acc;
      }, [])
      .map(resolvePlugins ? requirePlugin : identity)
  };
};
