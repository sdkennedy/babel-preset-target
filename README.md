# babel-preset-target

> Babel preset that allows for target environments to be specified along with plugins and presets. If all environments have native support for a given plugin, it will be skipped.

## Install

```sh
$ npm install --save-dev babel-preset-target
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "presets": [
    ["target", {
      "presets": ["es2015"],
      "targets": [
        {"name": "chrome", "version": 52}
      ]
    }]
  ]
}
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  presets: [
    ["target", {
      presets: ["es2015"],
      targets: [
        {name: "chrome", version: 52}
      ]
    }]
  ]
});
```

## Options

* `presets` - Allows for specific offical presets to be defined. Only plugins within the preset that are necessary will be included.
  * Can be array of any of `["es2015", "es2016", "es2017"]`
  * Currently doesn't support es2015 options
* `plugins` - Array of any plugins to be conditionally added
* `targets` - Array of enviroment targets. If all targets support a given plugin then the plugin will be skipped.
  * Each target looks like: `{name: 'chrome', version: 52}`
  * If no targets are defined, all plugins are included.
  * If no feature support information is available for a version, we will fallback to the previous available version and throw a warning.
  
### Supported targets
| name    | versions                      | notes |
| ------- | ----------------------------- | ------------------------ |
| ie      | 10 - 11                       |                          |
| edge    | 12 - 14                       |                          |
| firefox | 4, 6, 7, 10, 13, 16-18, 23-50 |                          |
| chrome  | 19, 30, 31, 33 - 52           |                          |
| safari  | 5 - 10                        |                          |
| opera   | 12.16                         |                          |
| phantom | 2                             |                          |
| node    | 0.12, 4 - 6                   | requires --harmony flag  |
| iojs    | 3.3                           |                          |
| android | 40 - 44, 50, 51               |                          |
| ios     | 7 - 9                         |                          |

### Example Options
```
{
  presets: [
    ["target", {
      presets: ["es2015"],
      targets: [
        {name: "chrome", version: 52}
      ]
    }]
  ]
}
{
  presets: [
    ["target", {
      plugins: ["transform-es2015-arrow-functions"],
      targets: [
        {name: "node", version: 6}
      ]
    }]
  ]
}
```
