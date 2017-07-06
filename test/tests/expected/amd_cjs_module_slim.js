[
    'amd_cjs_module',
    function (stealRequire, stealExports, stealModule) {
        stealModule.exports = {
            action: function () {
                console.log('hello world');
            }
        };
        var a = stealRequire('a'), b = stealRequire('b');
    }
];