var amd_amd = require('./amd_amd');
var getCompile = require('./es6_compiler');
var extend = require("lodash/object/extend");

module.exports = function(load, options){
	var compile = getCompile(options);
	var opts = extend({}, options, {
		filename: load.address,
		modules: 'amd'
	});

	load.source = compile(load.source.toString(), opts).js;
	return amd_amd(load, options);
};
