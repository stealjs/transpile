[
    'amd_named_deps',
    /*amd_named_deps*/
    function (stealRequire, stealExports, stealModule) {
        var bar = stealRequire('bar');
        stealModule.exports = bar;
    }
];