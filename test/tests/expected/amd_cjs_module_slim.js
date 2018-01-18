[
    'amd_cjs_module',
    /*amd_cjs_module*/
    function (stealRequire, stealExports, stealModule) {
        var a = stealRequire('a'), b = stealRequire('b');
        stealModule.exports = {
            action: function () {
                console.log('hello world');
            }
        };
    }
];