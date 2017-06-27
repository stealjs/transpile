var types = require("ast-types");
var getAst = require("../get_ast");
var concat = require("lodash/concat");
var defaultTo = require("lodash/defaultTo");
var compile = require("estemplate").compile;
var optionsNormalize = require("../options_normalize");

module.exports = function(load, options) {
	var moduleId = load.uniqueId || load.name;
	var metadata = defaultTo(load.metadata, {});

	var requires = defaultTo(metadata.deps, [])
		.map(makeNormalizer(load, options))
		.map(toStealRequire);

	var _exports = metadata.exports ? toStealExports(metadata.exports) : [];

	return compile(
		`[${moduleId}, function(stealRequire, stealExports, stealModule) { %= body % }]`
	)({
		body: concat(requires, getAst(load).body, _exports)
	});
};

/**
 * Turns the module id into a `stealRequire` call node
 * @param {string} moduleId - The dependency identifier
 * @return {Object} The AST node for the stealRequire expression
 */
function toStealRequire(moduleId) {
	return compile(`stealRequire(%= moduleId %);`)({
		moduleId: types.builders.literal(moduleId)
	}).body[0];
}

/**
 * Turns the property name into a `stealExports` assignment node
 * @property {string} property - The property name to be exported
 * @return {Object} The AST node of the `stealExports` expression
 */
function toStealExports(property) {
	return compile(`stealModule.exports = window["${property}"];`)({}).body[0];
}

/**
 * Returns a `normalize` function given the `load` and `options`
 */
function makeNormalizer(load, options) {
	if (options && (options.normalizeMap || options.normalize)) {
		return function(name) {
			return optionsNormalize(options, name, load.name, load.address);
		};
	} else {
		return function(name) {
			return name;
		};
	}
}
