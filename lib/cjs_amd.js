"format cjs";
var esprima = require("esprima"),
	optionsNormalize = require("./options_normalize"),
	getAst = require("./get_ast"),
	types = require("ast-types"),
	n = types.namedTypes;

var dirnameExp = /__dirname/;
var globalExp = /global/;

module.exports = function(load, options) {
	var ast = getAst(load);

	var source = load.source;
	var cjsOptions = {
		hasDirname: dirnameExp.test(source),
		hasGlobal: globalExp.test(source),
		duplicateCjsDependencies: options.duplicateCjsDependencies
	};
	cjsOptions.needsFunctionWrapper =
		cjsOptions.hasDirname || cjsOptions.hasGlobal;

	if (options && (options.normalizeMap || options.normalize)) {
		normalizeModuleIdentifiers(ast, load, options);
	}

	var normalizedName;
	if (options.namedDefines) {
		normalizedName = optionsNormalize(
			options,
			load.name,
			load.name,
			load.address
		);
	}
	ast = defineInsert(normalizedName, ast.body, cjsOptions);

	return ast;
};

/**
 * Given an ast, calls the visitor with the first argument of each `require` call
 * @param {Object} ast - The ast to walk
 * @param {Function} cb - The visitor function called on each match
 */
function visitRequireArgument(ast, cb) {
	types.visit(ast, {
		visitCallExpression: function(path) {
			if (this.isRequireExpression(path.node)) {
				var arg = path.getValueProperty("arguments")[0];

				if (n.Literal.check(arg)) {
					cb(arg);
				}
			}

			this.traverse(path);
		},

		isRequireExpression(node) {
			return n.Identifier.check(node.callee) && node.callee.name === "require";
		}
	});
}

/**
 * Traverses the AST (CJS) and normalizes the module identifiers
 */
function normalizeModuleIdentifiers(ast, load, options) {
	visitRequireArgument(ast, function(argument) {
		var normalized = optionsNormalize(
			options,
			argument.value,
			load.name,
			load.address
		);

		argument.value = normalized;
		argument.raw = `"${normalized}"`;
	});
}

/**
 * Given an AST, returns the module identifiers passed to `require` calls
 * @param {Object} ast - The ast to walk
 * @return {Array.<String>} The module identifiers
 */
function collectDependenciesIds(ast) {
	var ids = [];

	visitRequireArgument(ast, function(argument) {
		ids.push(argument.value);
	});

	return ids;
}

function defineInsert(name, body, options) {
	// Add in the function wrapper.
	var wrapper = defineWrapper(options);

	var code = makeDefineFunctionCode(
		name,
		options.duplicateCjsDependencies ? collectDependenciesIds(body) : [],
		wrapper
	);

	var ast = esprima.parse(code);
	var astBody = body || [];

	var innerFunctions = 0;
	var expectedFunctions = options.needsFunctionWrapper ? 2 : 1;

	types.visit(ast, {
		visitFunctionExpression: function(path) {
			if (this.isModuleFactory()) {
				var functionBody = path.getValueProperty("body").body;

				astBody.forEach(function(part) {
					functionBody.push(part);
				});

				// stop traversing the tree
				this.abort();
			}

			// keep traversing the tree
			this.traverse(path);
		},

		isModuleFactory: function() {
			innerFunctions += 1;
			return innerFunctions === expectedFunctions;
		}
	});

	return ast;
}

function makeDefineFunctionCode(name, cjsDeps, body) {
	var deps = "";

	if (cjsDeps.length) {
		deps = ["require", "exports", "module"]
			.concat(cjsDeps)
			.map(function(x) {
				return `"${x}"`;
			})
			.join(", ")
	}

	var defineArgs = [
		name ? `"${name}"` : null,
		deps ? `[ ${deps} ]` : null,
		`function(require, exports, module) { ${body} }`
	];

	return `define(${defineArgs.filter(isTruthy).join(", ")});`;
}

function isTruthy(x) {
	return Boolean(x);
}

function defineWrapper(options) {
	// Add in the function wrapper.
	var wrapper = "";
	if (options.needsFunctionWrapper) {
		wrapper += "(function(";
		if (options.hasGlobal) {
			wrapper += "global, ";
		}
		if (options.hasDirname) {
			wrapper += "__dirname, ";
		}
		wrapper += "require, exports, module";
		wrapper += "){\n";
		wrapper += "})(";

		if (options.hasGlobal) {
			wrapper += "function() { return this; }(), ";
		}
		if (options.hasDirname) {
			wrapper += '"/", ';
		}
		wrapper += "require, exports, module";
		wrapper += ");";
	}

	return wrapper;
}
