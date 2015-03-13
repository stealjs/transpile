var normalizeCJS = require('./normalize_cjs');
var getCompile = require('./es6_compiler');
var extend = require("lodash/object/extend");

module.exports = function(load, options){
	var compile = getCompile(options);

	var copy = {};
	for(var prop in load) {
		copy[prop] = load[prop];
	}
	
	var opts = extend({}, options, {
		filename: load.address,
		modules: 'commonjs'
	});
	var result = compile(load.source.toString(), opts).js;
	if(options && (options.normalizeMap || options.normalize)) {
		copy.source = result;
		return normalizeCJS(copy, options);
	} else {
		return result;
	}
	
};
