[
    'amd_jquery',
    /*amd_jquery*/
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
            factory(global);
        }(window, function (global) {
            var jQuery = {
                version: '9.9.9',
                ajax: function () {
                }
            };
            if (window.define && define.amd) {
                define('jquery', [], function () {
                    return jQuery;
                });
            }
            return jQuery;
        }));
        window.define = __defineNoConflict;
        window.__defineNoConflict = undefined;
    }
];