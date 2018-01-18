[
    'amd_cjs_wrapper',
    /*amd_cjs_wrapper*/
    function (stealRequire, stealExports, stealModule) {
        var a = stealRequire('a'), b = stealRequire('b');
        stealExports.action = function () {
            console.log('hello world');
        };
    }
];