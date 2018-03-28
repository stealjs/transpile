define([], function () {
    'use strict';
    var _dec, _class;
    let MyClass = (_dec = isTestable(true), _dec(_class = class MyClass {
    }) || _class);
    function isTestable(value) {
        return function decorator(target) {
            target.isTestable = value;
        };
    }
});