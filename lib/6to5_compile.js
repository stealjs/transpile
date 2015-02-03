var to5 = require("6to5");

var mapFormat = {
	'commonjs': 'common',
	'amd': 'amd'
};

module.exports = function(source, options){
	var result = to5.transform(source, {
		modules: mapFormat[options.modules]
	});
	return {
		js: result.code
	};
};
