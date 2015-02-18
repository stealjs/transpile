var babel = require("babel-core");

var mapFormat = {
	'commonjs': 'common',
	'amd': 'amd'
};

module.exports = function(source, options){
	var result = babel.transform(source, {
		modules: mapFormat[options.modules]
	});
	return {
		js: result.code
	};
};
