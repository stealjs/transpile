var babel = require("babel-standalone");
var assign = require("lodash/assign");

module.exports = function(source, compileOptions, options){
	var opts = assign({}, options.babelOptions, {
		sourceMap: compileOptions.sourceMaps || false
	});

	// presets are applied from last to first
	var presets;
	var required = ["es2015", {loose: false, modules: compileOptions.modules}];

	if(opts.presets && opts.presets.length) {
		presets = [required].concat(opts.presets);
	} else {
		presets = [
			"react",
			"stage-0",
			required
		];
	}

	opts.presets = presets;
	opts.plugins = opts.plugins || [];

	// Remove Babel 5 options
	delete opts.optional;
	delete opts.whitelist;
	delete opts.blacklist;

	if(opts.sourceMap) {
		opts.sourceMapTarget = options.sourceMapFileName;
		opts.sourceFileName = options.sourceMapFileName;
	}

	return babel.transform(source, opts);
};
