var recast = require("recast");
var omit = require("lodash/omit");
var amdToAmd = require("./amd_amd");
var isString = require("lodash/isString");
var getCompile = require("./es6_compiler");
var patchCircularDependencies = require("./patch_circular_dependencies");

module.exports = function(load, options) {
	var compile = getCompile(options);

	var result = compile(
		load.source.toString(),
		{
			filename: options.sourceMapFileName || load.address,
			modules: "amd",
			sourceMaps: true
		},
		options
	);

	var recastAst = recast.parse(result.code);

	// transform the ast before code/sourcemap generation
	if (load.circular && options.patchCircularDependencies) {
		recastAst = patchCircularDependencies(recastAst);
	}
	load.ast = recastAst;
	recastAst = amdToAmd(load, options);

	// generate the code/sourcemap from the updated ast
	var printOptions = {};
	var sourceMaps = options && options.sourceMaps;

	if (sourceMaps) {
		printOptions.sourceMapRoot = options.sourceRoot || null;
		printOptions.inputSourceMap = isString(result.map)
			? JSON.parse(result.map)
			: result.map;
	}

	var output = recast.print(recastAst, printOptions);
	load.source = output.code;

	// recast sourcemap includes "sourcesContent",
	// remove it if BuildOptions.sourceMapsContent is falsy
	if (sourceMaps) {
		var sourceMapsContent = options && options.sourceMapsContent;
		load.map = sourceMapsContent
			? output.map
			: omit(output.map, ["sourcesContent"]);
	}

	return load.ast;
};
