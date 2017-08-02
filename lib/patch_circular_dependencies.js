var types = require("ast-types");
var first = require("lodash/first");
var last = require("lodash/last");
var concat = require("lodash/concat");
var estemplate = require("estemplate");

var n = types.namedTypes;

module.exports = function(ast) {
	var variableNames = collectVariableNames(ast);

	appendToDefineFactory(
		ast,
		concat(variableNames.map(patchHelperCallTemplate), patchHelperTemplate())
	);

	return ast;
};

/**
 * Collects the identifiers of Babel generated import assignments
 *
 * E.g, given the AST of the code below:
 *
 *	var _bar2 = _interopRequireDefault('bar');
 *	var _foo2 = _interopRequireDefault('foo');
 *
 * this function will return an array with the AST nodes of the _bar2 and
 * _foo2 identifiers.
 *
 * @param {Object} ast - The code's AST
 * @return {Array.<Object>} A list of identifiers (AST nodes)
 */
function collectVariableNames(ast) {
	var names = [];

	types.visit(ast, {
		visitVariableDeclarator: function(path) {
			var node = path.node;

			if (this.isBabelRequireInteropCall(node.init)) {
				names.push(node.id);
			}

			this.traverse(path);
		},

		isBabelRequireInteropCall: function(node) {
			return (
				n.CallExpression.check(node) &&
				node.callee.name === "_interopRequireDefault"
			);
		}
	});

	return names;
}

/**
 * Appends the given node to the `define` factory function body
 *
 * MUTATES THE AST
 *
 * @param {Object} ast - The AMD module AST
 * @param {Array.<Object>} nodes - The AST nodes to be appended
 */
function appendToDefineFactory(ast, nodes) {
	types.visit(ast, {
		visitCallExpression: function(path) {
			var node = path.node;

			if (this.isDefineIdentifier(node.callee)) {
				var factory = last(node.arguments);
				factory.body.body = concat(factory.body.body, nodes);
				this.abort();
			}

			this.traverse(path);
		},

		isDefineIdentifier: function(node) {
			return n.Identifier.check(node) && node.name === "define";
		}
	});
}

function patchHelperCallTemplate(identifier) {
	return first(
		estemplate.compile("_patchCircularDependency(%= name %)")({
			name: identifier
		}).body
	);
}

function patchHelperTemplate() {
	return first(
		estemplate.compile(`
		function _patchCircularDependency(obj) {
		  var defaultExport;
		  Object.defineProperty(obj.default, "default", {
			set: function(value) {
			  if (obj.default.__esModule) {
				obj.default = value;
			  }
			  defaultExport = value;
			},
			get: function() {
			  return defaultExport;
			}
		  });
		}
	`)({}).body
	);
}
