define([
    'module',
    'dep'
], function (module, dep) {
    'use strict';
    let name = 'John';
    let time = 'today';
    module.exports = `Hello ${ name }, how are you ${ time }?`;
});