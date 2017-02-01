'use strict';
function $__interopRequire(id) {
    id = require(id);
    return id && id.__esModule && id || { default: id };
}
Object.defineProperties(module.exports, {
    __esModule: { value: true },
    default: {
        enumerable: true,
        get: function () {
            return $__default;
        }
    },
    __useDefault: {
        enumerable: true,
        get: function () {
            return __useDefault;
        }
    }
});
var amdMod = $__interopRequire('basics/amdmodule').default;
var $__default = {
    amdModule: amdMod,
    name: 'es6Module'
};
var __useDefault = true;