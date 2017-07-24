define([
    'require',
    'exports',
    'module',
    'a',
    './b',
    'c-c'
], function (require, exports, module) {
    var a = require('a'), b = require('./b'), c = require('c-c');
    exports.action = function () {
    };
});