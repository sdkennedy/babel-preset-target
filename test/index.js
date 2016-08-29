const test = require('tape');
const babelPresetTarget = require('../src/index');
const availablePresets = require('../presets.json');

// Plugins
const plugin1 = 'transform-es2015-arrow-functions';
// Presets
const emptyPreset = {plugins: []};
const singlePluginPreset = {plugins: [plugin1]};

test('babelPresetTarget no target support', assert => {
  assert.deepEqual(
    babelPresetTarget(undefined, {resolvePlugins: false}),
    emptyPreset,
    'default call should return empty preset'
  );

  assert.deepEqual(
    babelPresetTarget(undefined, Object.assign({resolvePlugins: false}, singlePluginPreset)),
    singlePluginPreset,
    'should return all plugins if no targets defined'
  );

  assert.end();
});

test('babelPresetTarget canIUse support', assert => {
  assert.deepEqual(
    babelPresetTarget(
      undefined,
      Object.assign(
        {
          resolvePlugins: false,
          requirements: {
            [plugin1]: {
              canIUse: ['arrow-functions']
            }
          },
          targets: [{name: 'chrome', version: 55}]
        },
        singlePluginPreset
      )
    ),
    emptyPreset,
    'should return empty preset when target supports canIUse feature'
  );

  assert.deepEqual(
    babelPresetTarget(
      undefined,
      Object.assign(
        {
          resolvePlugins: false,
          requirements: {
            [plugin1]: {
              canIUse: ['arrow-functions', 'apng']
            }
          },
          targets: [{name: 'chrome', version: 45}]
        },
        singlePluginPreset
      )
    ),
    singlePluginPreset,
    'should return preset with plugin when target supports 1 of 2 canIUse features'
  );

  assert.deepEqual(
    babelPresetTarget(
      undefined,
      Object.assign(
        {
          resolvePlugins: false,
          requirements: {
            [plugin1]: {
              canIUse: ['arrow-functions']
            }
          },
          targets: [{name: 'ie', version: 6}]
        },
        singlePluginPreset
      )
    ),
    singlePluginPreset,
    'should return preset with plugin when target doesn\'t supports canIUse feature'
  );

  assert.end();
});

test('babelPresetTarget compat-table support', assert => {
  assert.deepEqual(
    babelPresetTarget(
      undefined,
      Object.assign(
        {
          resolvePlugins: false,
          requirements: {
            [plugin1]: {
              ct: ['class']
            }
          },
          targets: [{name: 'chrome', version: 49}]
        },
        singlePluginPreset
      )
    ),
    emptyPreset,
    'should return empty preset when target supports compat-table feature'
  );

  assert.deepEqual(
    babelPresetTarget(
      undefined,
      Object.assign(
        {
          resolvePlugins: false,
          requirements: {
            [plugin1]: {
              ct: ['class']
            }
          },
          targets: [{name: 'chrome', version: Infinity}]
        },
        singlePluginPreset
      )
    ),
    emptyPreset,
    'should return empty preset when target version is larger than largest compat-table version available and that version supports feature'
  );

  assert.end();
});

function assertBasicPreset(assert, name, expected) {
  assert.deepEqual(
    babelPresetTarget(
      undefined,
      Object.assign(
        {
          resolvePlugins: false,
          presets: [name]
        }
      )
    ),
    expected,
    `should return preset with plugins defined in babel-preset-${name} when presets: ["${name}"] defined`
  );
}

test('babelPresetTarget es[2015-2017] preset support', assert => {
  assertBasicPreset(assert, 'es2015', availablePresets.es2015);
  assertBasicPreset(assert, 'es2016', availablePresets.es2016);
  assertBasicPreset(assert, 'es2017', availablePresets.es2017);
  const additionalPlugin = 'additionalPlugin';
  assert.deepEqual(
    babelPresetTarget(
      undefined,
      Object.assign(
        {
          resolvePlugins: false,
          presets: ["es2016"],
          plugins: [additionalPlugin]
        }
      )
    ),
    {
      plugins: [
        additionalPlugin,
        ...availablePresets.es2016.plugins
      ]
    },
    `should return preset with plugins defined in babel-preset-es2016 plus additional plugins`
  );
  assert.end();
});

test('babelPresetTarget supported feature with required syntax plugin', assert => {
  assert.deepEqual(
    babelPresetTarget(
      undefined,
      {
        resolvePlugins: false,
        plugins: ["transform-exponentiation-operator"],
        targets: [
          {name: "chrome", version: 52}
        ]
      }
    ),
    {plugins: ["syntax-exponentiation-operator"]},
    'should syntax plugin if transform is supported'
  );
  assert.end();
});