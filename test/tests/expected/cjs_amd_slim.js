[
    'cjs',
    function (stealRequire, stealExports, stealModule) {
        stealExports.action = function () {
            console.log(`hello world`);
        };
        var a = stealRequire('a'), b = stealRequire('b');
    }
];