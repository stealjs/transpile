var KEEP_KEY = require("../traverse").KEEP_KEY;

module.exports = function(parent, key){
	if(Array.isArray(parent) && !isNaN(Number(key))) {
		parent.splice(key, 1);
		return KEEP_KEY;
	} else {
		delete parent[key];
	}
};
