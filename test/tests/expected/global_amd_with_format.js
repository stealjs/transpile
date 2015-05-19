System.register('global', [], false, function (__require, __exports, __module) {
    System.get('@@global-helpers').prepareGlobal(__module.id, []);
    (function () {
        var GLOBAL = 'I don\'t like "Quotes"';
    }.call(System.global));
    return System.get('@@global-helpers').retrieveGlobal(__module.id, false);
});