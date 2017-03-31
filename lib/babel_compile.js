var babel = require("babel-standalone");
var assign = require('object.assign');

module.exports = function(source, compileOptions, options){
	var opts = assign({}, options.babelOptions, {
		sourceMap: compileOptions.sourceMaps || false
	});

	// presets are applied from last to first
	var defaultPresets = [
		"react",
		"stage-0",
		["es2015", {loose: false, modules: compileOptions.modules}]
	];

	// user defined presets will override the default ones.
	opts.presets = defaultPresets.concat(opts.presets || []);
	opts.plugins = opts.plugins || [];

	// register plugins not bundled in babel-standalone
	if (opts.customPlugins) {
		Object.keys(opts.customPlugins).forEach(function(name) {
			babel.registerPlugin(name, opts.customPlugins[name]);
		});

		delete opts.customPlugins;
	}

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
