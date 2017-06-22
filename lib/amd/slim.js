var types = require("ast-types");
var take = require("lodash/take");
var getAst = require("../get_ast");
var assign = require("lodash/assign");
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

		/**
		 * Whether CJS require/exports are required by `define`
		 * See https://github.com/amdjs/amdjs-api/blob/master/AMD.md#using-require-and-exports
		 * @param {Object} dependenciesNode - The AST node of the `define` dependencies array
		 * @return {boolean} `true` if CJS keywords used, `false` otherwise.
		 */
		usesCjsRequireExports: function(dependenciesNode) {
			var deps = slimBuilder.getDependenciesIds(dependenciesNode);

			return (
				isEqual(take(deps, 3), ["require", "exports", "module"]) ||
				isEqual(take(deps, 2), ["require", "exports"]) ||
				isEqual(take(deps, 1), ["require"])
			);
		},

		/**
		 * Whether the factory matches the simplified CJS wrapper
		 * See https://github.com/amdjs/amdjs-api/blob/master/AMD.md#simplified-commonjs-wrapping-
		 * @param {Object} factoryNode - The ast node of the `define` factory function
		 * @return {boolean} `true` if matches, `false` otherwise
		 */
		isCjsSimplifiedWrapper: function(factoryNode) {
			var params = slimBuilder.getFactoryParamsNames(factoryNode);

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
		 * @param {Array} args - The AST node of the `define` call arguments
		 * @return {DefineArguments} An object with AMD's define function arguments
		 */
		getAmdDefineArguments: function(args) {
			var result = { id: null, factory: null, dependencies: [] };

			switch (args.length) {
				// define(factory);
				case 1:
					result.factory = getFactory(args[0]);
					break;

				// define(id || dependencies, factory);
				case 2:
					if (this.isNamed(args)) {
						assign(result, {
							id: args[0],
							factory: getFactory(args[1])
						});
					} else {
						assign(result, {
							dependencies: args[0],
							factory: getFactory(args[1])
						});
					}
					break;

				// define(id, dependencies, factory);
				case 3:
					assign(result, {
						id: args[0],
						dependencies: args[1],
						factory: getFactory(args[2])
					});
					break;

				default:
					throw new Error("Invalid `define` function signature");
			}

			// set the `isCjsWrapper` flag
			result.isCjsWrapper = n.ArrayExpression.check(result.dependencies) &&
				result.dependencies.elements.length
				? this.usesCjsRequireExports(result.dependencies)
				: this.isCjsSimplifiedWrapper(result.factory);

			return result;
		}
	});

	if (!slimAst) {
		throw new Error(`Unable to transpile ${load.name}`);
	}

	return slimAst;
};

/**
 * Normalizes the factory function if the object shorthand was used
 * @param {Object} arg - The AST node of the argument where the
 *						"factory" function should be found.
 * @return {Object} The AST node of the factory function.
 */
function getFactory(arg) {
	return n.ObjectExpression.check(arg)
		? slimBuilder.makeFactoryFromObject(arg)
		: arg;
}

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
