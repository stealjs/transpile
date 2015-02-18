
var compilerMap = {
	'traceur': './clean_traceur_compile',
	'babel': './babel_compile'
};

module.exports = function(options){
	var compilerName = (options && options.transpiler) || 'traceur';
	var moduleName = compilerMap[compilerName];

	return require(moduleName);
};
