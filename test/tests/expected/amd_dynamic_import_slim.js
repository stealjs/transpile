[
    'amd_dynamic_import',
    /*amd_dynamic_import*/
    function (stealRequire) {
        stealRequire.dynamic('foo').then(function (foo) {
            window.foo = foo;
        });
    }
];