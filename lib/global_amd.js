var esprima = require("esprima");
var jsStringEscape = require("js-string-escape");

module.exports = function(load){
	var name = load.name;
	var metadata = load.metadata || {};

	var metaDeps = metadata.deps || [];
	var deps = ["module", "@loader", "require"].concat(metaDeps);
	var exports = "undefined";
	if(metadata.exports) {
		exports = "\"" + metadata.exports + "\"";
	} else if(metadata.exports === false) {
		exports = "false";
	}
	var preparedExportName = "";
	if(typeof metadata.exports !== "undefined") {
		preparedExportName = exports;
	} else if(metadata.init) {
		preparedExportName = true;
	}

	var execMeta = metadata.eval &&
		('{' + "'eval': '" + metadata.eval + "'" + "}");
	var source = jsStringEscape(load.source);
	var code = "define(\"" + name + "\", " + JSON.stringify(deps) +
		", function(module, loader, require) {\n" +
		"  loader.get(\"@@global-helpers\").prepareGlobal({\n" +
		"    require: require,\n" +
		"    name: module.id,\n" +
		"    deps: " + JSON.stringify(metaDeps) + ", \n" +
			(preparedExportName ? "exports: " + preparedExportName + ", \n" : "") +
			(metadata.globals ? "globals: " + JSON.stringify(metadata.globals) + "\n" : "") +
		"  });\n" +
		"  var define = loader.global.define;\n" +
        "  var require = loader.global.require;\n" +
		"  var source = \"" + source + "\";\n" +
		(metadata.init ? "  var init = " + metadata.init.toString() + ";\n" : "") +
        "  loader.global.define = undefined;\n" +
        "  loader.global.module = undefined;\n" +
        "  loader.global.exports = undefined;\n" +
        "  loader.__exec({'source': source, 'address': module.uri" +
			(execMeta ? (",'metadata': " + execMeta) : "") +
			"});\n" +
        "  loader.global.require = require;\n" +
        "  loader.global.define = define;\n" +
		"\n  return loader.get(\"@@global-helpers\").retrieveGlobal(module.id, " +
		exports + (metadata.init ? ", init" : "") + ");" +
		"\n});";

	var ast = esprima.parse(code);
	return ast;
};
