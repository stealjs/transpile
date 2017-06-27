[
    global,
    function (stealRequire, stealExports, stealModule) {
        stealRequire('foo');
        stealRequire('bar');
        var GLOBAL = 'I don\'t like "Quotes"';
        stealModule.exports = window['GLOBAL'];
    }
];