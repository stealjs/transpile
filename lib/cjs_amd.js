"format cjs";
var esprima = require('esprima'),
	traverse = require('./traverse'),
	escodegen = require('escodegen'),
	comparify = require('comparify'),
	optionsNormalize = require('./options_normalize'),
	getAst = require("./get_ast"),
	estraverse = require("estraverse");

module.exports = function(load, options){
	var ast = getAst(load);

	// If we need to normalize then we must use esprima.
	if(options && (options.normalizeMap || options.normalize)) {
		traverse(ast, function(obj){
			if(comparify(obj, {
				"type": "CallExpression",
				"callee": {
					"type": "Identifier",
					"name": "require"
				}
			})) {
				var arg = obj.arguments[0];
				if(arg.type === "Literal") {
					var val = arg.value;
					arg.value = optionsNormalize(options, val, load.name, load.address);
					arg.raw = '"'+arg.value+'"';
				}

				return false;
			}
		});
	}
	var normalizedName;
	if(options.namedDefines) {
		normalizedName = optionsNormalize(options, load.name, load.name, load.address);
	}
	var ast = defineInsert(normalizedName, ast.body);

	return ast;
};


function defineInsert(name, body) {
	var named = name ? ("'" + name + "', ") : "";
	var code = "define(" + named +
		"function(require, exports, module) {\n" +
		"\n});";

	var ast = esprima.parse(code);
	body = body || [];

	var isFunction;
	estraverse.traverse(ast, {
		enter: function(node) {
			if(node.type === "FunctionExpression") {
				isFunction = true;
			}
			if(isFunction && node.type === "BlockStatement") {
				body.forEach(function(part){
					node.body.push(part);
				});
				this.break();
			}
		}
	});

	return ast;
}
