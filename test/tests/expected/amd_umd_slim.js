[
    'amd_umd',
    /*amd_umd*/
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
        var _ = Object.create(null);
        _.each = function () {
        };
        _.clone = function () {
        };
        if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
            define(function () {
                return _;
            });
        } else if (freeModule) {
            (freeModule.exports = _)._ = _;
            freeExports._ = _;
        }
        window.define = __defineNoConflict;
        window.__defineNoConflict = undefined;
    }
];