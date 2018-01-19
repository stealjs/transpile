[
    'amd_module_identifier',
    /*amd_module_identifier*/
    function (stealRequire, stealExports, stealModule) {
        stealModule.id = 'amd_module_identifier';
        var doSomething = function id(x) {
            return x;
        };
        stealModule.exports = doSomething(stealModule);
    }
];