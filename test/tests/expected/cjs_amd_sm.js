define([
    'require',
    'exports',
    'module',
    'a',
    'b'
], function (require, exports, module) {
    var a = require('a'), b = require('b');
    exports.action = function () {
        console.log(`hello world`);
        return import('./a.js');
    };
}); //# sourceMappingURL=cjs_amd_sm.js.map
