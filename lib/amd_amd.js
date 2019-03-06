var getAst = require("./get_ast");
var types = require("ast-types");
var optionsNormalize = require("./options_normalize");

var b = types.builders;
var n = types.namedTypes;

/**
 * @param {Object} load
 * @param {Object} options
 *
 *   @option {Boolean} [namedDefines=false] Inserts a named define.
 */
module.exports = function transpileAmdToAmd(load, options) {
	var ast = getAst(load);
	var transformOptions = options || {};

	if (!load.name) {
		return ast;
	}

	types.visit(ast, {
		visitCallExpression: function visitCallExpression(path) {
			if (!this.isDefineExpression(path)) {
				return this.traverse(path);
			}

			var node = path.node;
			var defineArgs = node.arguments;
			var insertModuleName = transformOptions.namedDefines;

			// make sure the module is named appropiately
			if (insertModuleName) {
				var isAnonymousModule = !n.Literal.check(defineArgs[0]);
				var normalized = optionsNormalize(
					options,
					load.name,
					load.name,
					load.address
				);
				if (isAnonymousModule) {
					defineArgs.unshift(b.literal(normalized));
				} else {
					defineArgs[0] = b.literal(normalized);
				}
			}

			// define(name, dependencies?, factory?)
			// normalize the module dependencies if any
			var maybeDependencies = defineArgs[1];
			if (n.ArrayExpression.check(maybeDependencies)) {
				var normalizedArgs = maybeDependencies.elements.map(
					function eachArg(arg) {
						return b.literal(
							optionsNormalize(
								options,
								arg.value,
								load.name,
								load.address
							)
						);
					}
				);
				maybeDependencies.elements = normalizedArgs;
			}

			this.abort(path);
		},

		isDefineExpression: function isDefineExpression(path) {
			return (
				n.Identifier.check(path.node.callee) &&
				path.node.callee.name === "define"
			);
		}
	});

	return ast;
};
