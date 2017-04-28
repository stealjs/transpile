var comparify = require('comparify');

function isRequire(obj){
	return comparify(obj, {
		"type": "CallExpression",
		"callee": {
			"type": "Identifier",
			"name": "require"
		}
	});
}

module.exports = isRequire;
