var babel = require("babel-standalone");
var assign = require("lodash/assign");

function getBabelPlugins(userDefinedPlugins, options) {
	var plugins = userDefinedPlugins || [];
	var transformModulesPlugin = "transform-es2015-modules-amd";

	// we must include the transform modules plugin when the ES2015 preset
	// is not used due to options.forceES5 being false
	if (options.forceES5 === false && !plugins.includes(transformModulesPlugin)) {
		plugins.push(transformModulesPlugin);
	}

	return plugins;
}

function getBabelPresets(userDefinedPresets, modules, options) {
	var presets;
	var es2015Preset = ["es2015", {loose: false, modules: modules}];

	// presets are applied from last to first
	if(userDefinedPresets && userDefinedPresets.length) {
		presets = options.forceES5 !== false
			? [es2015Preset].concat(userDefinedPresets)
			: userDefinedPresets
	} else {
		presets = options.forceES5 !== false
			? ["react", "stage-0", es2015Preset]
			: ["react"]
	}

	return presets;
}

module.exports = function(source, compileOptions, options){
	var opts = assign({}, options.babelOptions, {
		sourceMap: compileOptions.sourceMaps || false
	});

	opts.presets = getBabelPresets(opts.presets, compileOptions.modules, options);
	opts.plugins = getBabelPlugins(opts.plugins, options);

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
