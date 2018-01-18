[
    'cjs',
    /*cjs*/
    function (stealRequire, stealExports, stealModule) {
        var a = stealRequire('a'), b = stealRequire('b');
        stealExports.action = function () {
            console.log(`hello world`);
        };
    }
];