var esprima = require('esprima'),
	traverse = require('./traverse'),
	escodegen = require('escodegen'),
	comparify = require('comparify');

var toVariableName = function(moduleName){
	return "__"+moduleName.replace(/[^\w\-]/g,"_")
};

module.exports = function(load){
	
	var moduleNameToVariables = {};
	
	var output = esprima.parse(load.source.toString());
	
	traverse(output, function(obj){
		if(	comparify(obj,{
                        "type": "CallExpression",
                        "callee": {
                            "type": "Identifier",
                            "name": "require"
                        }
                    }) &&
			obj.arguments.length && obj.arguments[0].type === "Literal" ) {
			var moduleName = obj.arguments[0].value;
			var variableName = toVariableName(moduleName);
			moduleNameToVariables[moduleName] = variableName;
			obj.type = "Identifier";
			obj.name = variableName;
			delete obj.arguments;
			delete obj.callee;
		}
		else if(	
			comparify(obj, 
				{
					type: "MemberExpression",
					object: {
						type: "CallExpression",
						callee: {
							type: "Identifier",
							name: "require"
						}
					}
				}) &&
				obj.object.arguments[0].type === "Literal"
			) {
			var moduleName = obj.object.arguments[0].value;
			var variableName = toVariableName(moduleName);
			moduleNameToVariables[moduleName] = variableName;
			obj.object = {name: variableName, type: "Identifier"};
		} else if( 
			comparify(obj, 
				{
					type: "ExpressionStatement",
					"expression": {
		                "type": "AssignmentExpression",
		                "operator": "=",
		                "left": {
		                    "type": "MemberExpression",
		                    "computed": false,
		                    "object": {
		                        "type": "Identifier",
		                        "name": "module"
		                    },
		                    "property": {
		                        "type": "Identifier",
		                        "name": "exports"
		                    }
		                },
		                "right": {
		                    "type": "ObjectExpression"
	                   }
                   }
				}) 
				) {
			var objExpression = obj.expression.right;
			delete obj.expression;
			obj.type = "ReturnStatement";
			obj.argument = objExpression;
		}
	});
	var moduleNames = [],
		variableNames = [];
		
	for(var moduleName in moduleNameToVariables) {
		moduleNames.push(moduleName);
		variableNames.push(moduleNameToVariables[moduleName]);
	}
	
	
	return "steal('"+moduleNames.join("','")+"', function("+
		variableNames.join(",")+"){\n"+
		escodegen.generate(output)+
		"\n});"
};