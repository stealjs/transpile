define('global', [
    'module',
    '@loader'
], function (__module, __loader) {
    __loader.get('@@global-helpers').prepareGlobal(__module.id, []);
    (function () {
        var GLOBAL = 'I don\'t like "Quotes"';
    }.call(__loader.global));
    return __loader.get('@@global-helpers').retrieveGlobal(__module.id, false);
});