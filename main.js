var bfs = require("./lib/bfs");
var detect = require("js-module-formats").detect;
var generate = require("./lib/generate");
var getAst = require("./lib/get_ast");
var sourceMapFileName = require("./lib/source_map_filename");
var makeFormatsGraph = require("./lib/make_transforms_formats_graph.js");

var transpilers = {
	amd_cjs: require("./lib/amd_cjs"),
	cjs_amd: require("./lib/cjs_amd"),
	cjs_steal: require("./lib/cjs_steal"),
	es6_amd: require("./lib/es6_amd"),
	es6_cjs: require("./lib/es6_cjs"),
	steal_amd: require("./lib/steal_amd"),
	amd_amd: require("./lib/amd_amd"),
	global_amd: require("./lib/global_amd"),
	cjs_cjs: require("./lib/cjs_cjs"),
	amd_slim: require("./lib/amd/slim")
};

var formatsTransformsGraph = makeFormatsGraph(Object.keys(transpilers));

var toSelf = function(load) {
	return load.ast;
};

function moduleType(source) {
	var type = detect(source);
	// tricky, since the detected type could be just `es` instead of `es6`.
	return type && type !== "es" ? type : "es6";
}

// transpile.to
var transpile = {
	transpilers: transpilers,
	to: function(load, destFormat, options) {
		var sourceFormat = load.metadata.format || moduleType(load.source);
		var path = this.able(sourceFormat, destFormat);

		if (!path) {
			throw new Error(
				`transpile - unable to transpile ${sourceFormat} to ${destFormat}`
			);
		}

		// the source format and the dest format are the same, e.g: cjs_cjs
		// Check for a transpiler
		if (!path.length) {
			path.push(sourceFormat);
		}

		path.push(destFormat);

		var copy = Object.assign({}, load);
		var normalize = options.normalize;

		var transpileOptions = options || {};
		transpileOptions.sourceMapFileName = sourceMapFileName(copy, options);

		// Create the initial AST
		if (sourceFormat !== "es6") {
			copy.ast = getAst(copy, transpileOptions.sourceMapFileName);
		}

		var sourceContent = load.source;

		for (var i = 0; i < path.length - 1; i++) {
			var transpiler = transpilers[path[i] + "_" + path[i + 1]] || toSelf;
			copy.ast = transpiler(copy, options);
			// remove the normalize option after the first pass.
			delete transpileOptions.normalize;
		}
		transpileOptions.normalize = normalize;
		return generate(copy.ast, options, sourceContent);
	},
	/**
	 * Whether it's possible to transform the source format to the dest format
	 * @param {string} from The format of the source, e.g: "es6"
	 * @parem {string} to the format of the output code, e.g: "amd"
	 * @return {?Array} The "path" of formats needed to transform
	 *                  from the source code to the dest format
	 */
	able: function(from, to) {
		var path;
		bfs(from || "es6", formatsTransformsGraph, function(cur) {
			if (cur.node === to) {
				path = cur.path;
				return false;
			}
		});
		return path;
	}
};

module.exports = transpile;
