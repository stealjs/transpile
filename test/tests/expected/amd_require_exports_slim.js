[
    'amd_require_exports',
    /*amd_require_exports*/
    function (stealRequire, stealExports, stealModule) {
        var beta = stealRequire('beta');
        stealExports.verb = function () {
            return beta.verb();
        };
    }
];