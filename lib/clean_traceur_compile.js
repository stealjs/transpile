// traceur needs a version of System.  It's possible that it's already
// been required and System overwritten/lost.
// This make sure traceur is entirely reloaded.

var traceurPath = require.resolve("traceur");

var search = "/node_modules/traceur/";
var index = traceurPath.indexOf(search);
var path = traceurPath.substr(0,index+search.length );

for(var name in require.cache) {
	if( name.indexOf(path) === 0 ) {
		delete require.cache[name];
	}
}


var globalNames = ["System"];

var oldGlobals = {};
globalNames.forEach(function(name){
	oldGlobals[name] = global[name];
});

var traceur = require('traceur');

var globals = {};
globalNames.forEach(function(name){
	globals[name] = global[name];
});

globalNames.forEach(function(name){
	global[name] = oldGlobals[name];
});

module.exports = function(){
	var saved = {};
	
	globalNames.forEach(function(name){
		saved[name] = global[name];
		global[name] = globals[name];
	});
	
	var result = traceur.compile.apply(traceur, arguments);
	
	globalNames.forEach(function(name){
		global[name] = saved[name];
	});
	
	return result;
};
