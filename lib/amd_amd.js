var getAst = require("./get_ast");
var traverse = require('./traverse');
var comparify = require('comparify');
var optionsNormalize = require('./options_normalize');

/**
 *
 * @param {Object} load
 * @param {Object} options
 *
 *   @option {Boolean} [namedDefines=false] Inserts a named define.
 */
module.exports = function(load, options){
	var ast = getAst(load);
	var transformOptions = options || {};

	traverse(ast, function(obj){
		if(	comparify(obj,{
					"type": "CallExpression",
					"callee": {
						"type": "Identifier",
						"name": "define"
					}
				})  ) {
			var args = obj.arguments,
				arg = args[0];

			if( transformOptions.namedDefines && arg.type !== "Literal" ) {
				args.unshift({
					type: "Literal",
					value: optionsNormalize(options, load.name, load.name, load.address)
				});
				args[0].raw = args[0].value;
				arg = args[1];
			} else if(transformOptions.namedDefines && arg.type === "Literal"  && load.name) {
				// make sure the name is right
				args[0].value = load.name;
				args[0].raw = args[0].value;
				arg = args[1];
			}

			// Perform normalization on the dependency names, if needed
			if(arg.type === "ArrayExpression") {
				var i = 0;
				var element;

				while(i < arg.elements.length) {
					element = arg.elements[i];
					element.value = optionsNormalize(options, element.value, load.name, load.address);
					element.raw = '"' + element.value + '"';
					i++;
				}
			}

			return false;
		}
	});

	return ast;
};
