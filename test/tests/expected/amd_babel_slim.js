[
    'amd_babel',
    /*amd_babel*/
    function (stealRequire, stealExports, stealModule) {
        var _jquery = stealRequire('jquery');
        'use strict';
        Object.defineProperty(stealExports, '__esModule', { value: true });
        stealExports.default = function (selector) {
            (0, _jquery2.default)(selector).hide();
        };
        var _jquery2 = _interopRequireDefault(_jquery);
        function _interopRequireDefault(obj) {
            return obj && obj.__esModule ? obj : { default: obj };
        }
    }
];