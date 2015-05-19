var esprima = require("esprima");
var jsStringEscape = require('js-string-escape');

module.exports = function(load){
	var name = load.name;
	var metadata = load.metadata || {};

	var deps = metadata.deps || [];

	var code = "System.register(\"" + name + "\", " + JSON.stringify(deps) +
		", false, function(__require, " +
		"__exports, __module) {\n" +
		"  System.get(\"@@global-helpers\").prepareGlobal(__module.id, []);\n" +
		"  (function() {\n" +
		"    " + load.source +
		"\n  }).call(System.global);" +
		"\n  return System.get(\"@@global-helpers\").retrieveGlobal(__module.id, false);" +
		"\n});";

	var ast = esprima.parse(code);
	return ast;
};
