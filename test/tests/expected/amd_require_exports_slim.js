[
    'amd_require_exports',
    function (stealRequire, stealExports, stealModule) {
        stealExports.verb = function () {
            return beta.verb();
        };
        var beta = stealRequire('beta');
    }
];