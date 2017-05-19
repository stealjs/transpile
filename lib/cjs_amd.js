"format cjs";
var esprima = require("esprima"),
	optionsNormalize = require("./options_normalize"),
	getAst = require("./get_ast"),
	types = require("ast-types"),
	n = types.namedTypes;

var dirnameExp = /__dirname/;
var globalExp = /global/;

module.exports = function(load, options){
	var ast = getAst(load);

	var source = load.source;
	var cjsOptions = {
		hasDirname: dirnameExp.test(source),
		hasGlobal: globalExp.test(source)
	};
	cjsOptions.needsFunctionWrapper = cjsOptions.hasDirname ||
		cjsOptions.hasGlobal;

	if (options && (options.normalizeMap || options.normalize)) {
		normalizeModuleIdentifiers(ast, load, options);
	}

	var normalizedName;
	if(options.namedDefines) {
		normalizedName = optionsNormalize(options, load.name, load.name, load.address);
	}
	ast = defineInsert(normalizedName, ast.body, cjsOptions);

	return ast;
};

/**
 * Traverses the AST (CJS) and normalizes the module identifiers
 */
function normalizeModuleIdentifiers(ast, load, options) {
	types.visit(ast, {
		visitCallExpression: function(path) {
			var node = path.node;

			if (this.isRequireExpression(node)) {
				var arg = path.getValueProperty("arguments")[0];

				if (n.Literal.check(arg)) {
					var identifier = types.getFieldValue(arg, "value");
					var normalized = optionsNormalize(options, identifier,
						load.name, load.address);

					arg.value = normalized;
					arg.raw = `"${normalized}"`;
				}

				return false;
			}

			this.traverse(path);
		},

		isRequireExpression(node) {
			return n.Identifier.check(node.callee) &&
				node.callee.name === "require";
		}
	});
}


function defineInsert(name, body, options) {
	// Add in the function wrapper.
	var wrapper = defineWrapper(options);
	var code = makeDefineFunctionCode(name, wrapper);

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

function makeDefineFunctionCode(name, body) {
	return name ?
		`define('${name}', function(require, exports, module) { ${body} });` :
		`define(function(require, exports, module) { ${body} })`;
}

function defineWrapper(options) {
	// Add in the function wrapper.
	var wrapper = "";
	if(options.needsFunctionWrapper) {
		wrapper += "(function(";
		if(options.hasGlobal) {
			wrapper += "global";
		}
		if(options.hasGlobal && options.hasDirname) {
			wrapper += ", ";
		}
		if(options.hasDirname) {
			wrapper += "__dirname";
		}
		wrapper += "){\n";
		wrapper += "})(";

		if(options.hasGlobal) {
			wrapper += "function() { return this; }()";
		}
		if(options.hasGlobal && options.hasDirname) {
			wrapper += ", ";
		}
		if(options.hasDirname) {
			wrapper += '"/"';
		}
		wrapper += ");";
	}

	return wrapper;
}
