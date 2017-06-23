[
    'amd_jquery',
    function (stealRequire, stealExports, stealModule) {
        window.__defineNoConflict = window.define;
        window.define = function () {
            var factory = arguments[arguments.length - 1];
            stealModule.exports = typeof factory === 'function' ? factory() : factory;
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