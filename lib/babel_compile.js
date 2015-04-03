var babel = require("babel-core");

var mapFormat = {
	'commonjs': 'common',
	'amd': 'amd'
};

module.exports = function(source, compileOptions, options){
	var opts = {
		modules: mapFormat[compileOptions.modules],
		sourceMap: compileOptions.sourceMaps || false
	};
	if(opts.sourceMap) {
		opts.sourceMapName = options.sourceMapFileName;
		opts.sourceFileName = options.sourceMapFileName;
	}

	var result = babel.transform(source, opts);
	return result;
};
