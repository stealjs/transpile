define(function (require, exports, module) {
    (function (global, require, exports, module) {
        var foo = getFromGlobal(global, 'foo');
        function getFromGlobal(global, prop) {
            return global[prop];
        }
    }(function () {
        return this;
    }(), require, exports, module));
});