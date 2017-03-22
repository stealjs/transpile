define([
    'exports',
    'basics/amdmodule'
], function (exports, _amdmodule) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.__useDefault = undefined;
    var _amdmodule2 = _interopRequireDefault(_amdmodule);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
    window.foo = 'default';
    exports.default = {
        amdModule: _amdmodule2.default,
        name: 'es6Module'
    };
    var __useDefault = exports.__useDefault = true;
});