
var compilerMap = {
	'traceur': './clean_traceur_compile',
	'6to5': './6to5_compile'
};

module.exports = function(options){
	var compilerName = (options && options.compiler) || 'traceur';
	var moduleName = compilerMap[compilerName];

	return require(moduleName);
};
