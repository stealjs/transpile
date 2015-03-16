define([
    'exports',
    'basics/amdmodule'
], function (exports, _basicsAmdmodule) {
    'use strict';
    var _interopRequire = function (obj) {
        return obj && obj.__esModule ? obj['default'] : obj;
    };
    exports.__esModule = true;
    var amdMod = _interopRequire(_basicsAmdmodule);
    exports['default'] = {
        amdModule: amdMod,
        name: 'es6Module'
    };
    var __useDefault = true;
    exports.__useDefault = __useDefault;
});