var comparify = require('comparify');

function isStrictMode(obj){
	return comparify(obj, {
		"type": "ExpressionStatement",
		"directive": "use strict"
	});
}

module.exports = isStrictMode;
