var esprima = require('esprima'),
	traverse = require('./traverse'),
	escodegen = require('escodegen'),
	comparify = require('comparify'),
	optionsNormalize = require('./options_normalize');

module.exports = function(load, options){
	
	var moduleNameToVariables = {};
	
	var output = esprima.parse(load.source.toString());
	
	traverse(output, function(obj){
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
	
	return escodegen.generate(output);
};
