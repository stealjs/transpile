var types = require("ast-types");
var getAst = require("../get_ast");
var assign = require("lodash/assign");
var isEmpty = require("lodash/isEmpty");
var isEqual = require("lodash/isEqual");
var cloneDeep = require("lodash/cloneDeep");
var slimBuilder = require("./slim_builder");
var optionsNormalize = require("../options_normalize");

var n = types.namedTypes;

module.exports = function(load, options) {
	var slimAst;
	var currentAst = getAst(load);

	// handle jQuery-like IIFE/amd modules
	if (isIifeAst(currentAst)) {
		return slimBuilder.makeAstFromIife(
			load.uniqueId || load.name,
			currentAst.body[0]
		);
	}

	types.visit(currentAst, {
		visitCallExpression: function(path) {
			if (this.isAmd(path)) {
				var args = this.getAmdDefineArguments(
					path.getValueProperty("arguments")
				);

				if (needsNormalize(args.dependencies, options)) {
					args.dependencies = normalizeDependencies(
						load,
						options,
						args.dependencies
					);
				}

				args.id = load.uniqueId || load.name || args.id;

				slimAst = args.isCjsWrapper
					? slimBuilder.makeAstFromCjsWrapper(args)
					: slimBuilder.makeAst(args);

				this.abort();
			}

			this.traverse(path);
		},

		// checks if `define` is invoked at the top-level.
		isAmd: function(path) {
			return (
				this.isDefineExpression(path.node) &&
				n.Program.check(path.parent.parent.node) &&
				n.ExpressionStatement.check(path.parent.node)
			);
		},

		// whether a `define(` call is found in the AST
		isDefineExpression: function(node) {
			return n.Identifier.check(node.callee) && node.callee.name === "define";
		},

		isNamed: function(defineArguments) {
			return n.Literal.check(defineArguments[0]);
		},

		isAnonymous: function(defineArguments) {
			return !n.Literal.check(defineArguments[0]);
		},

		// define(function() {});
		isAnonymousWithNoDeps: function(defineArguments) {
			return (
				this.isAnonymous(defineArguments) &&
				n.FunctionExpression.check(defineArguments[0]) &&
				isEmpty(defineArguments[0].params)
			);
		},

		// define("foo", function() {});
		isNamedWithNoDeps: function(defineArguments) {
			return (
				this.isNamed(defineArguments) &&
				n.FunctionExpression.check(defineArguments[1]) &&
				isEmpty(defineArguments[1].params)
			);
		},

		// define(["foo"], function(foo) {});
		isAnonymousWithDeps: function(defineArguments) {
			return (
				this.isAnonymous(defineArguments) &&
				n.ArrayExpression.check(defineArguments[0]) &&
				n.FunctionExpression.check(defineArguments[1])
			);
		},

		// define("foo", ["bar"], function(bar) {});
		isNamedWithDeps: function(defineArguments) {
			return (
				this.isNamed(defineArguments) &&
				n.ArrayExpression.check(defineArguments[1]) &&
				n.FunctionExpression.check(defineArguments[2])
			);
		},

		// define({ foo: "bar" });
		isObjectShorthand: function(defineArguments) {
			return (
				defineArguments.length === 1 &&
				n.ObjectExpression.check(defineArguments[0])
			);
		},

		// define(name?, function(require) {});
		// define(name?, function(require, exports) {})
		// define(name?, function(require, exports, module) {})
		isCjsSimplifiedWrapper: function(defineArguments) {
			var hasAmdDeps =
				this.isNamedWithDeps(defineArguments) ||
				this.isAnonymousWithDeps(defineArguments);

			if (hasAmdDeps) return false;

			var factory = this.isNamed(defineArguments)
				? defineArguments[1]
				: defineArguments[0];

			var params = slimBuilder.getFactoryParamsNames(factory);

			return (
				isEqual(params, ["require"]) ||
				isEqual(params, ["require", "exports"]) ||
				isEqual(params, ["require", "exports", "module"])
			);
		},

		/**
		 * The AMD define arguments AST nodes as an object
		 * @typedef {Object} DefineArguments
		 * @property {?string} id - The module if of the module being defined
		 * @property {Array.<string>} dependencies - Array of modules ids dependencies
		 * @property {!Function} factory - Module's factory function
		 * @property {boolean} isCjsWrapper - Whether factory function is AMD's
		 *                     simplified CommonJS wrapping.
		 */

		/**
		 * Returns an object with the arguments of the define function
		 * @param {Array} args The AST node of the `define` call arguments
		 * @return {DefineArguments} An object with AMD's define function arguments
		 */
		getAmdDefineArguments: function(args) {
			var result = { id: null, factory: null, dependencies: [] };

			if (this.isAnonymousWithNoDeps(args)) {
				result.factory = args[0];
			} else if (this.isNamedWithNoDeps(args)) {
				assign(result, { id: args[0], factory: args[1] });
			} else if (this.isAnonymousWithDeps(args)) {
				assign(result, { dependencies: args[0], factory: args[1] });
			} else if (this.isNamedWithDeps(args)) {
				assign(result, {
					id: args[0],
					dependencies: args[1],
					factory: args[2]
				});
			} else if (this.isObjectShorthand(args)) {
				result.factory = slimBuilder.makeFactoryFromObject(args[0]);
			} else if (this.isCjsSimplifiedWrapper(args)) {
				assign(result, {
					isCjsWrapper: true,
					id: this.isNamed(args) ? args[0] : null,
					factory: this.isNamed(args) ? args[1] : args[0]
				});
			}

			return result;
		}
	});

	if (!slimAst) {
		throw new Error(`Unable to transpile ${load.name}`);
	}

	return slimAst;
};

/**
 * Whether the AST matches a top-level immediately invoked function expression
 * @param {Object} ast - The load's ast property
 * @return {boolean} - `true` if the ast matches a top level IIFE, `false` otherwise.
 */
function isIifeAst(ast) {
	return (
		ast.body.length === 1 &&
		n.ExpressionStatement.check(ast.body[0]) &&
		n.CallExpression.check(ast.body[0].expression) &&
		n.FunctionExpression.check(ast.body[0].expression.callee)
	);
}

function needsNormalize(dependencies, options) {
	var hasDependencies =
		dependencies.length ||
		(dependencies.elements && dependencies.elements.length);

	// the module has dependencies and a custom normalize function/map was passed in.
	return (
		hasDependencies &&
		!!(options && (options.normalizeMap || options.normalize))
	);
}

function normalizeDependencies(load, options, dependencies) {
	var clone = cloneDeep(dependencies);

	clone.elements = clone.elements.map(function(element) {
		element.name = optionsNormalize(
			options,
			element.value,
			load.name,
			load.address
		);
		return element;
	});

	return clone;
}
