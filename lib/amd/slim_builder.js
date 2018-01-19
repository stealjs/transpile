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
	return includes(["require", "exports", "module"], word);
}

module.exports = {
	slimWrapperTemplate: function slimWrapperTemplate(name) {
		return estemplate.compile(
			`[%= moduleId % /*${name}*/, function(%= params %) { %= body % }]`,
			{ attachComment: true }
		);
	},

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
	 * AST template of the shim used in UMD-like modules
	 * Each helper returns the full AST being Program at the root of the tree.
	 */
	amdDefineShim: {
		start: estemplate.compile(`
			window.__defineNoConflict = window.define;
			window.define = function(name, deps, factory) {
				if (typeof name !== "string") {
					factory = deps;
					deps = name;
					name = null;
				}

				if (!Array.isArray(deps)) {
					factory = deps;
					deps = null;
				}

				var factoryIsFunction = (typeof factory === "function");

				if (deps && deps[0] === "exports" && factoryIsFunction) {
					factory(stealExports);
				} else {
					stealModule.exports = factoryIsFunction ? factory() : factory;
				}
			};
			define.amd = true;
		`),

		end: estemplate.compile(`
			window.define = __defineNoConflict;
			window.__defineNoConflict = undefined;
		`)
	},

	makeAst: function(defineArguments) {
		var id = defineArguments.id;
		var name = defineArguments.name;
		var factory = defineArguments.factory;
		var dependencies = defineArguments.dependencies;

		var body = this.makeFunctionBody(
			dependencies,
			factory,
			defineArguments.name
		);
		var params = this.makeFunctionParams(dependencies, factory);

		return this.slimWrapperTemplate(name)({
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
		var name = defineArguments.name;
		var factory = defineArguments.factory;
		var dependencies = defineArguments.dependencies;

		var params = this.slimFunctionParams[3];
		var body = this.makeFunctionBody(
			dependencies,
			factory,
			defineArguments.name
		);

		return this.slimWrapperTemplate(name)({
			params: params,
			moduleId: b.literal(id),
			body: this.transformCjsRequiresAndExports(body)
		});
	},

	/**
	 * Returns the slim node AST from an UMD-like module with a nested define
	 * @param {string} moduleId - The module's id
	 * @param {Object} programBody - The AST top level body array
	 * @return {Object} The slim node AST
	 */
	makeAstFromNestedDefine: function(moduleId, moduleName, programBody) {
		return this.slimWrapperTemplate(moduleName)({
			moduleId: b.literal(moduleId),
			params: this.slimFunctionParams[3],
			body: concat(
				this.amdDefineShim.start({}).body,
				programBody,
				this.amdDefineShim.end({}).body
			)
		});
	},

	makeFunctionBody: function(dependencies, factory, moduleName) {
		var beforeRequires = [];
		var depIds = this.getDependenciesIds(dependencies);

		var moduleRequires = this.makeStealRequires(
			depIds,
			this.getFactoryParamsNames(factory)
		);

		// sets module.id if "module" is a dependency
		// e.g: define(["module"], fn)
		if (includes(depIds, "module")) {
			beforeRequires = estemplate.compile("module.id = <%= name %>;")({
				name: b.literal(moduleName)
			}).body;
		}

		var body = this.transformDynamicImports(this.getBlockBody(factory));

		// if the factory function has a explicit return,
		// transform it into `stealModule.exports = returnArgument`
		var returnStatementIndex = this.getIndexOfReturnStatement(body);
		if (returnStatementIndex !== -1) {
			body[returnStatementIndex] = this.makeStealModuleExports(
				body[returnStatementIndex].argument
			);
		}

		return concat(beforeRequires, moduleRequires, body);
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

			visitIdentifier: function(path) {
				var node = path.node;

				if (
					includes(keys(this.replacements), node.name) &&
					!this.isMemberExpressionProperty(path)
				) {
					node.name = this.replacements[node.name].name;
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
			},

			/**
			 * Whether the node is the "property" of a member expression
			 *
			 * e.g: foo.bar
			 *		foo -> is the "object" part of the member expression
			 *		bar -> is the "property".
			 *
			 * This function returns `true` when passed the path wrapper of
			 * the "bar" node.
			 */
			isMemberExpressionProperty: function(path) {
				var parent = path.parent.node;

				return (
					n.MemberExpression.check(parent) && parent.property === path.node
				);
			}
		});

		return cloned;
	}
};
