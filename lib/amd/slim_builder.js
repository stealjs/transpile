var types = require("ast-types");
var keys = require("lodash/keys");
var estemplate = require("estemplate");
var includes = require("lodash/includes");
var cloneDeep = require("lodash/cloneDeep");

var b = types.builders;
var n = types.namedTypes;

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

	makeAstFromCjsWrapper: function(defineArguments) {
		var id = defineArguments.id;
		var factory = defineArguments.factory;

		var params = this.makeFunctionParamsFromCjs(factory);
		var body = this.transformDynamicImports(this.getBlockBody(factory));

		return this.slimWrapperTemplate({
			params: params,
			moduleId: b.literal(id),
			body: this.transformCjsRequiresAndExports(body)
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
				body[returnStatementIndex]
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
		return ids.map(function(id, index) {
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
		});
	},

	makeStealModuleExports: function(returnStatement) {
		return b.expressionStatement(
			b.assignmentExpression(
				"=",
				b.memberExpression(
					b.identifier("stealModule"),
					b.identifier("exports"),
					false
				),
				returnStatement.argument
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
		var that = this;
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
			visitCallExpression: function(path) {
				var node = path.node;

				if (this.isRequireExpression(node)) {
					node.callee = this.replacements["require"];
				}

				this.traverse(path);
			},

			visitMemberExpression: function(path) {
				var node = path.node;
				var memberObject = node.object;

				// the left side is either "module.", "exports." or "require."
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

			isRequireExpression: function(node) {
				return (
					n.Identifier.check(node.callee) && node.callee.name === "require"
				);
			}
		});

		return cloned;
	}
};
