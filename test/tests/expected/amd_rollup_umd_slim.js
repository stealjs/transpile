[
    'amd_rollup_umd',
    /*amd_rollup_umd*/
    function (stealRequire, stealExports, stealModule) {
        window.__defineNoConflict = window.define;
        window.define = function (name, deps, factory) {
            if (typeof name !== 'string') {
                factory = deps;
                deps = name;
                name = null;
            }
            if (!Array.isArray(deps)) {
                factory = deps;
                deps = null;
            }
            var factoryIsFunction = typeof factory === 'function';
            if (deps && deps[0] === 'exports' && factoryIsFunction) {
                factory(stealExports);
            } else {
                stealModule.exports = factoryIsFunction ? factory() : factory;
            }
        };
        define.amd = true;
        (function (global, factory) {
            typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : factory(global.Kefir = global.Kefir || {});
        }(this, function (exports) {
            exports.sequentally = function () {
            };
            exports.filter = function () {
            };
            exports.map = function () {
            };
        }));
        window.define = __defineNoConflict;
        window.__defineNoConflict = undefined;
    }
];