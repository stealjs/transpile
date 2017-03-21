define([], function () {
    'use strict';
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError('Cannot call a class as a function');
        }
    }
    var _dec, _class;
    var MyClass = (_dec = isTestable(true), _dec(_class = function MyClass() {
        _classCallCheck(this, MyClass);
    }) || _class);
    function isTestable(value) {
        return function decorator(target) {
            target.isTestable = value;
        };
    }
});