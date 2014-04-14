"use strict";
var __moduleName = "test/tests/es6";
var amdMod = require('basics/amdmodule').default;
var $__default = {
  amdModule: amdMod,
  name: "es6Module"
};
var __useDefault = true;
module.exports = {
  get default() {
    return $__default;
  },
  get __useDefault() {
    return __useDefault;
  },
  __esModule: true
};
