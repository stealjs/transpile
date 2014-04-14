var es62cjs = 		require("../lib/es6_cjs"),
	cjs2steal = 	require("../lib/cjs_steal"),
	amd2cjs = 		require("../lib/amd_cjs"),
	fs = require("fs"),
	assert = require("assert");

var convert = function(file, converter, result, done){
	fs.readFile(__dirname+"/tests/"+file, function(err, data){
		if(err) {
			assert.fail(err, null, "reading "+__dirname+"/tests/"+file+" failed");
		}
		var res = converter({source: ""+data, address: __dirname+"/tests/"+file});
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

describe('es6 - cjs', function(){
    it('should work', function(done){
		convert("es6.js",es62cjs,"es6_cjs.js", done)
    });
});

describe('cjs - steal', function(){
    it('should work', function(done){
		convert("cjs.js",cjs2steal,"cjs_steal.js", done)
    });
    it('should work with objects', function(done){
		convert("cjs2.js",cjs2steal,"cjs2_steal.js", done)
    });
});

describe('amd - cjs', function(){
    it('should work', function(done){
		convert("amd.js",amd2cjs,"amd_cjs.js", done)
    });
});