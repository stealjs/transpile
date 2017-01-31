define('global', [
    'module',
    '@loader',
    'require'
], function (module, loader, require) {
    loader.get('@@global-helpers').prepareGlobal({
        require: require,
        name: module.id,
        deps: [],
        exports: 'GLOBAL'
    });
    var define = loader.global.define;
    var require = loader.global.require;
    var source = 'var GLOBAL = "I don\'t like \\"Quotes\\"";';
    loader.global.define = undefined;
    loader.global.module = undefined;
    loader.global.exports = undefined;
    loader.__exec({
        'source': source,
        'address': module.uri
    });
    loader.global.require = require;
    loader.global.define = define;
    return loader.get('@@global-helpers').retrieveGlobal(module.id, 'GLOBAL');
});