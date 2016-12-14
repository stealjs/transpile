var babel = require("babel-core");
var assign = require('object.assign');

module.exports = function(source, compileOptions, options){
	var opts = assign({}, options.babelOptions, {
		sourceMap: compileOptions.sourceMaps || false
	});

	opts.presets = opts.presets || [
		require("babel-preset-es2015").buildPreset({},{"loose": false, "modules": compileOptions.modules}),
		require("babel-preset-react"),
		require("babel-preset-stage-0")
	];
	opts.plugins = opts.plugins || [];

	// Remove Babel 5 options
	delete opts.optional;
	delete opts.whitelist;
	delete opts.blacklist;

	if(opts.sourceMap) {
		opts.sourceMapTarget = options.sourceMapFileName;
		opts.sourceFileName = options.sourceMapFileName;
	}

	var result = babel.transform(source, opts);
	return result;
};
