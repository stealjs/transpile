var blank = require("./utils/blank-object");
var getAst = require("./get_ast");
var isRequire = require("./utils/is-require");
var isStrictMode = require("./utils/is-strict-mode");
var pluck = require("./utils/pluck-node");
var traverse = require('./traverse');

function makeEmpty(obj) {
	blank(obj);
	obj.type = "EmptyStatement";
}

module.exports = function(load, options){
	var ast = getAst(load);
	var strictMode = false;
	var imports = [];

	traverse(ast, function(obj, key, parent){
		// Detect strict mode
		if(isStrictMode(obj)) {
			strictMode = true;
			return pluck(parent, key);
		}

		if(obj.type === "VariableDeclaration") {
			var toRemove = [];
			obj.declarations.forEach(function(child, i){
				var init = child.init;
				if(isRequire(init)) {
					var importIdentifier = "_" + child.id.name + "1";
					//toRemove.push(i);
					child.init = {
						type: "Identifier",
						name: importIdentifier
					};
					imports.push([init.arguments[0].value, importIdentifier]);
				}
			});
			for(var i = toRemove.length - 1; i >= 0; i--) {
				obj.declarations.splice(i, 1);
			}
			if(obj.declarations.length === 0) {
				makeEmpty(obj);
			}
		}

		if(isRequire(obj)) {
			imports.push([obj.arguments[0].value]);
			makeEmpty(obj);
		}
	});

	debugger;

	for(var i = imports.length - 1; i >= 0; i--) {
		var info = imports[i];
		var specifier = info[0];
		var identifier = info[1];

		var node;
		// Default import
		if(identifier !== undefined) {
			node = {
				"type": "ImportDeclaration",
				"specifiers": [
					{
						"type": "ImportDefaultSpecifier",
						"local": {
							"type": "Identifier",
							"name": identifier
						}
					}
				],
				"source": {
					"type": "Literal",
					"value": specifier,
					"raw": "\"" + specifier +"\"",
				}
			};
		}
		// side-effect import
		else {
			node = {
				"type": "ImportDeclaration",
				"specifiers": [],
				"source": {
					"type": "Literal",
					"value": specifier,
					"raw": "\"" + specifier +"\"",
				}
			};
		}

		ast.body.unshift(node);
	}

	return ast;
};
