var esprima = require('esprima'),
	traverse = require('./traverse'),
	escodegen = require('escodegen'),
	comparify = require('comparify');

module.exports = function(load){
	
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
			var args = obj.arguments;
			if(args[0].type !== "Literal") {
				args.unshift({type: "Literal", value: load.name, raw: "\""+load.name+"\""});
			}
			return false;
		}
	});
	
	return escodegen.generate(output);
};