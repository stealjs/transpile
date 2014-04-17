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
						"name": "steal"
					}
				})  ) {
			var args = obj.arguments,
				arg,
				moduleNames = [];
			var i = 0;
			while( i < args.length) {
				arg = args[i];
				if(arg.type == "Literal") {
					moduleNames.push(arg);
					args.splice(i, 1);
				} else {
					i++;
				}
			}
			obj.callee.name = "define";
			args.unshift({type: "Literal", value: load.name, raw: "\""+load.name+"\""},
						{type: "ArrayExpression", elements: moduleNames});
			return false;
		}
	});
	
	return escodegen.generate(output);
};