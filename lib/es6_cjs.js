var compile = require('./clean_traceur_compile');


module.exports = function(load){
	return compile(load.source.toString(), {
		filename: load.address,
		modules: 'commonjs'
	}).js;
};
