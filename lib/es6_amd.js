var amd_amd = require('./amd_amd');
var compile = require('./clean_traceur_compile');

module.exports = function(load, options){
	load.source = compile(load.source.toString(), {
		filename: load.address,
		modules: 'amd'
	}).js;
	return amd_amd(load, options);
};
