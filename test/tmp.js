// this loads traceur to make sure lib/clean_traceur_compile
var traceur = require('traceur');

var es62cjs = 		require("../lib/es6_cjs"),
	cjs2steal = 	require("../lib/cjs_steal"),
	amd2cjs = 		require("../lib/amd_cjs"),
	steal2amd =		require("../lib/steal_amd"),
	global2amd =	require("../lib/global_amd"),
	amd2amd = 		require("../lib/amd_amd"),
	cjs2amd =			require("../lib/cjs_amd"),
	fs = require("fs"),
	assert = require("assert"),
	transpile = require("../main");

var convert = function(moduleName, converter, result, options, done){
	if(typeof options === "function") {
		done = options;
		options = {};
	}

	fs.readFile(__dirname+"/tests/"+moduleName+".js", function(err, data){
		if(err) {
			assert.fail(err, null, "reading "+__dirname+"/tests/"+file+" failed");
		}
		var res = converter({source: ""+data, address: __dirname+"/tests/"+moduleName+".js", name: moduleName}, options);
		assert.ok(res, "got back a value");
		
		fs.readFile(__dirname+"/tests/expected/"+result, function(err, resultData){
			if(err) {
				assert.fail(err, null, "reading "+__dirname+"/tests/expected/"+result+" failed");
			}
			assert.equal(""+res,""+resultData,"expected equals result");
			done()
		});
	});
};

var doTranspile = function(moduleName, format, result, resultFormat, done){
	fs.readFile(__dirname+"/tests/"+moduleName+".js", function(err, data){
		if(err) {
			assert.fail(err, null, "reading "+__dirname+"/tests/"+file+" failed");
		}
		var res = transpile.to({
			source: ""+data, 
			address: __dirname+"/tests/"+moduleName+".js", 
			name: moduleName, 
			metadata: {format: format}
		}, resultFormat);
		assert.ok(res, "got back a value");
		
		fs.readFile(__dirname+"/tests/expected/"+result, function(err, resultData){
			if(err) {
				assert.fail(err, null, "reading "+__dirname+"/tests/expected/"+result+" failed");
			}
			console.log("=====\nexpected:\n", ""+resultData,"\n=====\nresult:\n", ""+res);
			assert.equal(""+res,""+resultData,"expected equals result");
			done()
		});
	});
};


doTranspile("steal_no_value_arg","steal","steal_no_value_arg_cjs.js","cjs", function(e){
	if(e){
		throw e;
	}
});