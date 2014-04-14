

var edges = ["amd_cjs","cjs_amd","cjs_steal","es6_cjs","steal_amd"];

var graph = {},
	transpilers = {};

edges.forEach(function(edge){
	var types = edge.split("_");
	
	if(!graph[types[0]]) {
		graph[types[0]] = {};
	}
	if(!graph[types[1]]) {
		graph[types[0]] = {};
	}
	
	graph[types[0]][types[1]] = graph[types[1]];
	transpilers[edge] = require("./lib/"+edge)
	
});

var bfs = require("./lib/bfs");
	
var copyLoad = function(load){
	var copy = {};
	for(var prop in load){
		copy[prop] = load[prop];
	}
	return copy;
};
// transpile.to
var transpile = {
	transpilers: transpilers,
	// transpile.to("amd",load)
	to: function(load, type){
		var format = load.metadata.format || "es6";
		var path = this.able(load.metadata.format || "es6", type);
		
		if(!path) {
			throw "transpile - unable to transpile "+format+" to "+type;
		}
		path.push(type);
		var copy = copyLoad(load);
		
		for(var i =0; i < path.length - 1; i++) {
			var transpiler = transpilers[path[i]+"_"+path[i+1]];	
			copy.source = transpiler(copy);
			
		}
		return copy.source;
	},
	able: function(from, to) {
		var path;
		bfs(from || "es6", graph, function(cur){
			if(cur.node === to) {
				path = cur.path;
			}
		});
		return path;
	}
};

module.exports = transpile;