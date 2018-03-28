var babel = require("babel-standalone");
var assign = require("lodash/assign");
var toEstree = require("babel-to-estree").toEstree;

module.exports = function(source, compileOptions, options){
	var opts = assign({}, options.babelOptions, {
		sourceMap: compileOptions.sourceMaps || false
	});
	var format = compileOptions.modules;

	// presets are applied from last to first
	var defaultPresets = [
		"react",
		"stage-0",
		["es2015", {loose: false, modules: format}]
	];

	// user defined presets will override the default ones.
	if(empty(opts.presets) && empty(opts.plugins)) {
		opts.presets = defaultPresets.concat(opts.presets || []);
		opts.plugins = opts.plugins || [];
	} else {
		opts.presets = opts.presets || [];
		opts.plugins = opts.plugins || [];

		var formatPlugin;
		if(format === "commonjs") {
			formatPlugin = "transform-es2015-modules-commonjs";
		} else if(format === "amd") {
			formatPlugin = "transform-es2015-modules-amd";
		}
		if(formatPlugin && opts.plugins.indexOf(formatPlugin) === -1) {
			opts.plugins.push(formatPlugin);
		}
	}

	// Remove Babel 5 options
	delete opts.optional;
	delete opts.whitelist;
	delete opts.blacklist;

	if(opts.sourceMap) {
		opts.sourceMapTarget = options.sourceMapFileName;
		opts.sourceFileName = options.sourceMapFileName;
		opts.sourceRoot = options.sourceRoot;
	}

	var result = babel.transform(source, opts);
	toEstree(result.ast, source);
	return result;
};

function empty(arr) {
	return !arr || !arr.length;
}
