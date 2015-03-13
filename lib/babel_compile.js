var babel = require("babel-core");
var extend = require("lodash/object/extend");

var mapFormat = {
	'commonjs': 'common',
	'amd': 'amd'
};

module.exports = function(source, options){
	var opts = extend({}, {
		modules: mapFormat[options.modules]
	}, options.babelOptions);
	var result = babel.transform(source, opts);
	return {
		js: result.code
	};
};
