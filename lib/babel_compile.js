var babel = require("babel-core");
var assign = require('object.assign');

var mapPlugin = {
	'commonjs': 'babel-plugin-transform-es2015-modules-commonjs',
	'amd': 'babel-plugin-transform-es2015-modules-amd'
};

module.exports = function(source, compileOptions, options){
	var opts = assign({}, options.babelOptions, {
		sourceMap: compileOptions.sourceMaps || false
	});

	opts.presets = opts.presets || [
		require("babel-preset-es2015-no-commonjs"),
		require("babel-preset-react"),
		require("babel-preset-stage-0")
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
