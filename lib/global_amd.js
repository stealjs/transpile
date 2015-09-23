var esprima = require("esprima");
var jsStringEscape = require("js-string-escape");

module.exports = function(load){
	var name = load.name;
	var metadata = load.metadata || {};

	var metaDeps = metadata.deps || [];
	var deps = ["module", "@loader"].concat(metaDeps);
	var exports = "false";
	if(metadata.exports) {
		exports = "\"" + metadata.exports + "\"";
	}

	var source = jsStringEscape(load.source);
	var code = "define(\"" + name + "\", " + JSON.stringify(deps) +
		", function(module, loader) {\n" +
		"  loader.get(\"@@global-helpers\").prepareGlobal(module.id, []);\n" +
		"  var define = loader.global.define;\n" +
        "  var require = loader.global.require;\n" +
		"  var source = \"" + source + "\";\n" +
        "  loader.global.define = undefined;\n" +
        "  loader.global.module = undefined;\n" +
        "  loader.global.exports = undefined;\n" +
        "  loader.__exec({'source': source, 'address': module.uri});\n" +
        "  loader.global.require = require;\n" +
        "  loader.global.define = define;\n" +
		"\n  return loader.get(\"@@global-helpers\").retrieveGlobal(module.id, " +
		exports + ");" +
		"\n});";

	var ast = esprima.parse(code);
	return ast;
};
