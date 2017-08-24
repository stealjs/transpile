[
    'amd_umd',
    function (stealRequire, stealExports, stealModule) {
        window.__defineNoConflict = window.define;
        window.define = function () {
            var factory = arguments[arguments.length - 1];
            stealModule.exports = typeof factory === 'function' ? factory() : factory;
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