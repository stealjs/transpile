var esprima = require('esprima'),
	traverse = require('./traverse'),
	escodegen = require('escodegen'),
	comparify = require('comparify'),
	optionsNormalize = require('./options_normalize');

/**
 * 
 * @param {Object} load
 * @param {Object} options 
 * 
 *   @option {Boolean} [namedDefines=false] Inserts a named define.
 */
module.exports = function(load, options){
	options = options || {};
	var moduleNameToVariables = {};
	
	var output = esprima.parse(load.source.toString());
	
	traverse(output, function(obj){
		if(	comparify(obj,{
					"type": "CallExpression",
					"callee": {
						"type": "Identifier",
						"name": "define"
					}
				})  ) {
			var args = obj.arguments, 
				arg = args[0];
				
			if( options.namedDefines && arg.type !== "Literal" ) {
				args.unshift({
					type: "Literal",
					value: load.name,
					raw: "\""+load.name+"\""
				});
				arg = args[1];
			}

			// Perform normalization on the dependency names, if needed
			if(arg.type === "ArrayExpression") {
				var i = 0, element, val;
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
	
	return escodegen.generate(output);
};
