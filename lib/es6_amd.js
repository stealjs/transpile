var traceur = require("traceur"),
	amd_amd = require('./amd_amd');


module.exports = function(load){
	load.source = traceur.compile(load.source.toString(), {
		filename: load.address,
		modules: 'amd',
		name: load.name
	}).js;
	return amd_amd(load);
};
