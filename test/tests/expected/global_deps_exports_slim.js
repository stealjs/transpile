[
    global,
    function (stealRequire, stealExports) {
        stealRequire('foo');
        stealRequire('bar');
        var GLOBAL = 'I don\'t like "Quotes"';
        stealExports['GLOBAL'] = GLOBAL;
    }
];