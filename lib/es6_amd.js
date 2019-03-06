var getAst = require("./get_ast");
var amdToAmd = require("./amd_amd");
var getCompile = require("./es6_compiler");

module.exports = function(load, options) {
	var compile = getCompile(options);

	var result = compile(
		load.source.toString(),
		{
			filename: options.sourceMapFileName || load.address,
			modules: "amd",
			sourceMaps: options.sourceMaps !== false
		},
		options
	);

	load.source = result.code;
	load.map = result.map;
	load.ast = getAst(load, options.sourceMapFileName);

	return amdToAmd(load, options);
};
