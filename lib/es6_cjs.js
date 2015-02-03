var normalizeCJS = require('./normalize_cjs');
var getCompile = require('./es6_compiler');

module.exports = function(load, options){
	var compile = getCompile(options);

	var copy = {};
	for(var prop in load) {
		copy[prop] = load[prop];
	}
	
	var result = compile(load.source.toString(), {
		filename: load.address,
		modules: 'commonjs'
	}).js;
	if(options && (options.normalizeMap || options.normalize)) {
		copy.source = result;
		return normalizeCJS(copy, options);
	} else {
		return result;
	}
	
};
