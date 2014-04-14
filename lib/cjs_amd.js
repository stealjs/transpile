module.exports = function(load){
	return "define('"+load.name+"', function(require, exports, module) {"
		+load.source+
		"});";
};