

var edges = ["amd_cjs","cjs_amd","cjs_steal","es6_cjs","steal_amd","amd_amd"];

var graph = {},
	transpilers = {};

edges.forEach(function(edge){
	var types = edge.split("_");
	
	if(!graph[types[0]]) {
		graph[types[0]] = {};
	}
	if(!graph[types[1]]) {
		graph[types[1]] = {};
	}
	// graph.amd.cjs = graph.cjs
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

var toSelf = function(load){
	return load.source;
};
var detect = require('js-module-formats').detect;

function moduleType(source) {
	var type = detect(source);
	// tricky, since the detected type could be just `es` instead of `es6`.
	return type && type !== 'es' ? type : 'es6';
}

// transpile.to
var transpile = {
	transpilers: transpilers,
	// transpile.to("amd",load)
	to: function(load, type){
		var format = load.metadata.format || moduleType(load.source);
		var path = this.able(format, type);
		
		if(!path) {
			throw "transpile - unable to transpile "+format+" to "+type;
		}
		if(!path.length) {
			// we are transpiling to ourselves.  Check for a transpiler
			path.push(format);
		}
		
		path.push(type);
		var copy = copyLoad(load);
		
		for(var i =0; i < path.length - 1; i++) {
			var transpiler = transpilers[path[i]+"_"+path[i+1]] || toSelf;	
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