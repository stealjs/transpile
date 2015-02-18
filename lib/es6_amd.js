var amd_amd = require('./amd_amd');
var getCompile = require('./es6_compiler');

module.exports = function(load, options){
	var compile = getCompile(options);

	load.source = compile(load.source.toString(), {
		filename: load.address,
		modules: 'amd'
	}).js;
	return amd_amd(load, options);
};
