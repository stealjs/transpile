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
    exports.default = {
        amdModule: _amdmodule2.default,
        name: 'es6Module'
    };
    var __useDefault = exports.__useDefault = true;
    _patchCircularDependency(_amdmodule2);
    function _patchCircularDependency(obj) {
        var defaultExport;
        Object.defineProperty(obj.default, 'default', {
            configurable: true,
            set: function (value) {
                if (obj.default.__esModule) {
                    obj.default = value;
                }
                defaultExport = value;
            },
            get: function () {
                return defaultExport;
            }
        });
    }
});