
var types = require("ast-types");
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

	// handle UMD-like modules where `define` is nested  and there is a
	// check for the `define.amd` property
	if (hasNestedDefine(currentAst) && hasDefineAmdReference(currentAst)) {
		slimAst = slimBuilder.makeAstFromNestedDefine(
			load.uniqueId || load.name,
			load.name,
			currentAst.body
		);
	} else {
		slimAst = makeAstFromTopLevelDefine(load, options, currentAst);
	}

	if (!slimAst) {
		throw new Error(
			[
				`Unable to transpile ${load.name} to slim format`,
				"Could not find AMD's `define` function call"
			].join("\n")
		);
	}

	return slimAst;
};

/**
 * Whether there is a non top level `define` function call in the AST
 * @param {Object} ast - The AST to be checked
 * @return {boolean}
 */
function hasNestedDefine(ast) {
	var result = false;

	types.visit(ast, {
		visitCallExpression: function(path) {
			if (this.isDefineExpression(path)) {
				result = true;
				this.abort();
			}

			this.traverse(path);
		},

		// whether a non top level `define(` is call in the AST
		isDefineExpression: function(path) {
			return (
				n.Identifier.check(path.node.callee) &&
				path.node.callee.name === "define" &&
				!n.Program.check(path.parent.parent.node)
			);
		}
	});

	return result;
}

/**
 * Whether there is a `define.amd` member expression on the AST
 * @param {Object} ast - The AST to be checked
 * @return {boolean}
 */
function hasDefineAmdReference(ast) {
	var result = false;

	types.visit(ast, {
		visitMemberExpression: function(path) {
			if (this.isDefineAmd(path.node)) {
				result = true;
				this.abort();
			}

			this.traverse(path);
		},

		isDefineAmd: function(node) {
			return (
				n.Identifier.check(node.object) &&
				node.object.name === "define" &&
				n.Identifier.check(node.property) &&
				node.property.name === "amd"
			);
		}
	});

	return result;
}

/**
 * Return the slim version of the provided AST
 */
function makeAstFromTopLevelDefine(load, options, ast) {
	var slimAst;

	types.visit(ast, {
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
				args.name = load.name;

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
			var keywords = ["require", "exports", "module"];
			var intersection = require("lodash/intersection");
			var deps = slimBuilder.getDependenciesIds(dependenciesNode);

			return !!intersection(deps, keywords).length;
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
			result.isCjsWrapper =
				n.ArrayExpression.check(result.dependencies) &&
				result.dependencies.elements.length
					? this.usesCjsRequireExports(result.dependencies)
					: this.isCjsSimplifiedWrapper(result.factory);

			return result;
		}
	});

	return slimAst;
}

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
		return assign(element, {
			value: optionsNormalize(
				options,
				element.value,
				load.name,
				load.address
			)
		});
	});

	return clone;
}

