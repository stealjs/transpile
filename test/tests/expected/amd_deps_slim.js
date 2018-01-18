[
    'amd',
    /*amd*/
    function (stealRequire, stealExports, stealModule) {
        var es6 = stealRequire('basics/es6module');
        stealModule.exports = {
            name: 'module',
            es6module: es6
        };
    }
];