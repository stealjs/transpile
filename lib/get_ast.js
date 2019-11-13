var esprima = require("esprima");
var sourceMapToAst = require("./sourcemap_to_ast");

module.exports = getAst;

/**
 * Get the ast for a load or create one if it doesn't exist.
 */
function getAst(load, sourceMapFileName){
	if(load.ast) {
		return load.ast;
	}

	var fileName = sourceMapFileName || load.map && load.map.file;

	load.ast = esprima.parse(load.source.toString(), {
		loc: true,
		source: fileName || load.address
	});

	if(load.map) {
		sourceMapToAst(load.ast, load.map);
	}

	return load.ast;
}
