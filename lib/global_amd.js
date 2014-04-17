var jsStringEscape = require('js-string-escape')
module.exports = function(load) {
	return "System.define('"+load.name+"','"+jsStringEscape(load.source)+"');";
};
