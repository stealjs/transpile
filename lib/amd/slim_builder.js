var types = require("ast-types");
var keys = require("lodash/keys");
var concat = require("lodash/concat");
var estemplate = require("estemplate");
var compact = require("lodash/compact");
var includes = require("lodash/includes");
var cloneDeep = require("lodash/cloneDeep");

var b = types.builders;
var n = types.namedTypes;

/**
 * Whether the literal passed is a CJS keyword
 * @param {string} word - The literal to be checked
 * @return {boolean} `true` if a keyword, `false` otherwise
 */
function isCjsKeyword(word) {
	return includes(["require", "exports", "moduke"], word);
}

module.exports = {
	slimWrapperTemplate: estemplate.compile(
		"[%= moduleId %, function(%= params %) { %= body % }]"
	),

	slimFunctionParams: {
		1: [b.identifier("stealRequire")],
		2: [b.identifier("stealRequire"), b.identifier("stealExports")],
		3: [
			b.identifier("stealRequire"),
			b.identifier("stealExports"),
			b.identifier("stealModule")
		]
	},

	/**
	 * AST template of the shim used in jQuery-like IIFE/amd modules
	 * @return {Function} Returns the full AST tree, being Program the root node.
	 */
	amdIifeShimStart: estemplate.compile(`
		window.__defineNoConflict = window.define;
		window.define = function() {
			var factory = arguments[arguments.length - 1];

			stealModule.exports = (typeof factory === "function") ?
				factory() : factory;
		};
		define.amd = true;
	`),

	/**
	 * AST template of the end part of the shim used in jQuery-like IIFE/amd
	 * @return {Function} Returns the full AST tree, being Program the root node.
	 */
	amdIifeShimEnd: estemplate.compile(`
		window.define = __defineNoConflict;
		window.__defineNoConflict = undefined;
	`),

	makeAst: function(defineArguments) {
		var id = defineArguments.id;
		var factory = defineArguments.factory;
		var dependencies = defineArguments.dependencies;

		var body = this.makeFunctionBody(dependencies, factory);
		var params = this.makeFunctionParams(dependencies, factory);

		return this.slimWrapperTemplate({
			body: body,
			params: params,
			moduleId: b.literal(id)
		});
	},

	/**
	 * Returns the slim AST version of the CJS wrapper node
	 * @param {Object} defineArguments - The AST node of the `define` function arguments
	 * @return {Object} - The slim AST
	 */
	makeAstFromCjsWrapper: function(defineArguments) {
		var id = defineArguments.id;
		var factory = defineArguments.factory;
		var dependencies = defineArguments.dependencies;

		var params = this.makeFunctionParamsFromCjs(factory);
		var body = this.makeFunctionBody(dependencies, factory);

		return this.slimWrapperTemplate({
			params: params,
			moduleId: b.literal(id),
			body: this.transformCjsRequiresAndExports(body)
		});
	},

	/**
	 * Returns the slim node AST from an immediately invoked function expression
	 * @param {string} moduleId - The module's id
	 * @param {Object} expressionStatement - The IIFE top level node
	 * @return {Object} The slim node AST
	 */
	makeAstFromIife: function(moduleId, expressionStatement) {
		return this.slimWrapperTemplate({
			moduleId: b.literal(moduleId),
			params: this.slimFunctionParams[3],
			body: concat(
				this.amdIifeShimStart({}).body,
				expressionStatement,
				this.amdIifeShimEnd({}).body
			)
		});
	},

	makeFunctionBody: function(dependencies, factory) {
		var moduleRequires = this.makeStealRequires(
			this.getDependenciesIds(dependencies),
			this.getFactoryParamsNames(factory)
		);

		var body = this.transformDynamicImports(this.getBlockBody(factory));

		// if the factory function has a explicit return,
		// transform it into `stealModule.exports = returnArgument`
		var returnStatementIndex = this.getIndexOfReturnStatement(body);
		if (returnStatementIndex !== -1) {
			body[returnStatementIndex] = this.makeStealModuleExports(
				body[returnStatementIndex].argument
			);
		}

		return moduleRequires.concat(body);
	},

	makeFunctionParams: function(dependencies, factory) {
		var params = [];
		var body = this.getBlockBody(factory);
		var hasReturnStatement = this.getIndexOfReturnStatement(body) !== -1;

		if (hasReturnStatement) {
			params = this.slimFunctionParams[3];
		} else if (dependencies) {
			params = this.slimFunctionParams[1];
		}

		return params;
	},

	makeFunctionParamsFromCjs: function(factory) {
		var factoryParams = factory.params;
		return this.slimFunctionParams[factoryParams.length];
	},

	makeStealRequires: function(ids, vars) {
		return compact(
			ids.map(function(id, index) {
				// do not create bindings for `require`, `exports` or `module`.
				if (isCjsKeyword(id)) return null;

				var requireHasNoBinding = vars[index] == null;
				if (requireHasNoBinding) {
					// stealRequire(${id});
					return b.expressionStatement(
						b.callExpression(b.identifier("stealRequire"), [b.literal(id)])
					);
				} else {
					// var ${vars[index]} = stealRequire(${id})
					return b.variableDeclaration("var", [
						b.variableDeclarator(
							b.identifier(vars[index]),
							b.callExpression(b.identifier("stealRequire"), [b.literal(id)])
						)
					]);
				}
			})
		);
	},

	/**
	 * Returns the AST version of `stealModule.exports = ...;`
	 * @param {Object} rightHandSide - The AST node on the right hand side of
	 *				   the assignment expression
	 * @return {Object} The AST representation of `stealModule.exports = ...`
	 */
	makeStealModuleExports: function(rightHandSide) {
		return b.expressionStatement(
			b.assignmentExpression(
				"=",
				b.memberExpression(
					b.identifier("stealModule"),
					b.identifier("exports"),
					false
				),
				rightHandSide
			)
		);
	},

	makeFactoryFromObject: function(objectExpression) {
		return b.functionDeclaration(
			b.identifier("f"),
			[],
			b.blockStatement([b.returnStatement(objectExpression)])
		);
	},

	// FunctionExpression (body) -> BlockStatement (body) : Array
	getBlockBody: function(factory) {
		return factory.body.body;
	},

	getDependenciesIds: function(dependencies) {
		return (dependencies.elements || []).map(function(element) {
			return element.value;
		});
	},

	getFactoryParamsNames: function(factory) {
		return factory.params.map(function(param) {
			return param.name;
		});
	},

	getIndexOfReturnStatement: function(blockBody) {
		var index = -1;
		var len = blockBody.length;

		for (var i = 0; i < len; i += 1) {
			var node = blockBody[i];

			if (n.ReturnStatement.check(node)) {
				index = i;
				break;
			}
		}

		return index;
	},

	/**
	 * Transforms dynamic imports found in BlockStatement body
	 * @param {Array} blockBody BlockStatement.body
	 * @return {Array} the mutated BlockStatement body
	 */
	transformDynamicImports: function(blockBody) {
		var cloned = cloneDeep(blockBody);

		types.visit(cloned, {
			visitCallExpression: function(path) {
				var callee = path.getValueProperty("callee");

				if (this.isDynamicImport(callee)) {
					callee.object = b.identifier("stealRequire");
					callee.property = b.identifier("dynamic");

					this.abort();
				}

				this.traverse(path);
			},

			// returns true for "steal.import" or "System.import"
			isDynamicImport: function(node) {
				var memberObject = node.object;
				var memberProperty = node.property;

				return (
					n.Identifier.check(memberObject) &&
					(memberObject.name === "steal" || memberObject.name === "System") &&
					n.Identifier.check(memberProperty) &&
					memberProperty.name === "import"
				);
			}
		});

		return cloned;
	},

	/**
	 * Find and replace CJS keywords with slim loader versions
	 * @param {Array} blockBody BlockStatement.body
	 * @return {Array} the mutated BlockStatement body
	 */
	transformCjsRequiresAndExports: function(blockBody) {
		var cloned = cloneDeep(blockBody);

		types.visit(cloned, {
			// require(moduleId)
			// Object.defineProperty(exports || module, {})
			// Object.defineProperties(exports || module, {})
			visitCallExpression: function(path) {
				var node = path.node;

				if (this.isRequireExpression(node)) {
					node.callee = this.replacements["require"];
				} else if (this.isObjectDefine(node)) {
					var name = node.arguments[0].name;

					if (includes(["exports", "module"], name)) {
						node.arguments[0] = this.replacements[name];
					}
				}

				this.traverse(path);
			},

			// module.exports
			// exports.[property]
			visitMemberExpression: function(path) {
				var node = path.node;
				var memberObject = node.object;

				if (includes(keys(this.replacements), memberObject.name)) {
					node.object = this.replacements[memberObject.name];
				}

				this.traverse(path);
			},

			replacements: {
				require: b.identifier("stealRequire"),
				module: b.identifier("stealModule"),
				exports: b.identifier("stealExports")
			},

			/**
			 * Matches `Object.defineProperty` or `Object.defineProperties`
			 * @param {Object} node - A CallExpression AST node
			 * @return {boolean} `true` if the call matches, `false` otherwise
			 */
			isObjectDefine: function(node) {
				return (
					n.MemberExpression.check(node.callee) &&
					node.callee.object.name === "Object" &&
					(node.callee.property.name === "defineProperty" ||
						node.callee.property.name === "defineProperties")
				);
			},

			isRequireExpression: function(node) {
				return (
					n.Identifier.check(node.callee) && node.callee.name === "require"
				);
			}
		});

		return cloned;
	}
};
