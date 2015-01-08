var traceur = require("traceur");

var globalNames = ["System"];

var globals = {};
globalNames.forEach(function(name){
	globals[name] = global[name];
});

module.exports = function(load){
	var saved = {};
	
	globalNames.forEach(function(name){
		saved[name] = global[name];
		global[name] = globals[name];
	});
	
	var result = traceur.compile(load.source.toString(), {
		filename: load.address,
		modules: 'commonjs'
	}).js;
	
	globalNames.forEach(function(name){
		global[name] = saved[name];
	});
	
	return result;
};
