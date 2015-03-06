"format cjs";
var esprima = require('esprima'),
	traverse = require('./traverse'),
	escodegen = require('escodegen'),
	comparify = require('comparify'),
	optionsNormalize = require('./options_normalize');

module.exports = function(load, options){
	var source = load.source;

	// If we need to normalize then we must use esprima.
	if(options && (options.normalizeMap || options.normalize)) {
		var output = esprima.parse(source.toString());

		traverse(output, function(obj){
			if(comparify(obj, {
				"type": "CallExpression",
				"callee": {
					"type": "Identifier",
					"name": "require"
				}
			})) {
				var arg = obj.arguments[0];
				if(arg.type === "Literal") {
					var val = arg.value;
					arg.value = optionsNormalize(options, val, load.name, load.address);
					arg.raw = '"'+arg.value+'"';
				}

				return false;
			}
		});

		source = escodegen.generate(output);
	}
	var out = "define(";
	if(options.namedDefines) {
		var normalizedName = optionsNormalize(options, load.name, load.name, load.address);
		out += "'"+normalizedName+"', ";
	}
	out += "function(require, exports, module) {\n"+source+"\n});";

	return out;

};
