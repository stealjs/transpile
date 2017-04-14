var traverse = require('./traverse');
var comparify = require('comparify');
var optionsNormalize = require('./options_normalize');
var getAst = require("./get_ast");

module.exports = function(load, options){
	var ast = getAst(load);

	traverse(ast, function(obj){
		if(	comparify(obj,{
					"type": "CallExpression",
					"callee": {
						"type": "Identifier",
						"name": "require"
					}
				})  ) {
			var args = obj.arguments,
				arg;

			if( args.length === 1 && args[0].type === "Literal" ) {
				arg = args[0];
				arg.value = optionsNormalize(options, arg.value, load.name, load.address);
				arg.raw = '"' + arg.value + '"';

			}

			return false;
		}
	});

	return ast;
};
