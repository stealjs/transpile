var esprima = require("esprima");
var jsStringEscape = require('js-string-escape');

module.exports = function(load){
	var name = load.name;
	var metadata = load.metadata || {};

	var metaDeps = metadata.deps || [];
	var deps = ["module", "@loader"].concat(metaDeps);

	var code = "define(\"" + name + "\", " + JSON.stringify(deps) +
		", function(__module, __loader) {\n" +
		"  __loader.get(\"@@global-helpers\").prepareGlobal(__module.id, []);\n" +
		"  (function() {\n" +
		"    " + load.source +
		"\n  }).call(__loader.global);" +
		"\n  return __loader.get(\"@@global-helpers\").retrieveGlobal(__module.id, false);" +
		"\n});";

	var ast = esprima.parse(code);
	return ast;
};
