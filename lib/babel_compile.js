var babel = require("babel-core");
var assign = require('object.assign');

var mapFormat = {
	'commonjs': 'common',
	'amd': 'amd'
};

module.exports = function(source, compileOptions, options){
	var opts = assign({
		modules: mapFormat[compileOptions.modules],
		sourceMap: compileOptions.sourceMaps || false
	}, options.babelOptions);
	if(opts.sourceMap) {
		opts.sourceMapName = options.sourceMapFileName;
		opts.sourceFileName = options.sourceMapFileName;
	}

	var result = babel.transform(source, opts);
	return result;
};
