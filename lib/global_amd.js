var jsStringEscape = require('js-string-escape')
module.exports = function(load) {
	var options = {};
	
	options.address = load.name;
	
	if(load.metadata){
		options.metadata = load.metadata;
	}
	
	return "System.define('"+load.name+"','"+jsStringEscape(load.source)+"',"+JSON.stringify(options)+");";
};
