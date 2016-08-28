"use strict";

module.exports.bind = function (fn) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return fn.bind.apply(fn, [null].concat(args));
};
module.exports.average = function (arr) {
  return arr.reduce(function (acc, val) {
    return acc + val;
  }, 0) / arr.length;
};
module.exports.toTuples = function (obj) {
  return Object.keys(obj).map(function (key) {
    return [key, obj[key]];
  });
};
module.exports.identity = function (arg) {
  return arg;
};