var babel = require("babel-core");
var assign = require('object.assign');

var mapPlugin = {
	'commonjs': 'transform-es2015-modules-commonjs',
	'amd': 'transform-es2015-modules-amd'
};

module.exports = function(source, compileOptions, options){
	var opts = assign({}, options.babelOptions, {
		sourceMap: compileOptions.sourceMaps || false
	});

	opts.presets = opts.presets || [
		"es2015-no-commonjs",
		"react",
		"stage-0"
	];
	opts.plugins = opts.plugins || [];
	opts.plugins.push(mapPlugin[compileOptions.modules]);

	if(opts.sourceMap) {
		opts.sourceMapTarget = options.sourceMapFileName;
		opts.sourceFileName = options.sourceMapFileName;
	}

	var result = babel.transform(source, opts);
	return result;
};
