var assert = require("assert");
var transpile = require("../main");
var convert = require("./convert");
var assign = require("lodash/assign");
var doTranspile = require("./do-transpile");

// converters
var es62cjs = require("../lib/es6_cjs");
var cjs2steal = require("../lib/cjs_steal");
var amd2cjs = require("../lib/amd_cjs");
var steal2amd = require("../lib/steal_amd");
var global2amd = require("../lib/global_amd");
var amd2amd = require("../lib/amd_amd");

describe("es6 - cjs", function() {
	it("should work", function() {
		return convert({
			converter: es62cjs,
			sourceFileName: "es6",
			expectedFileName: "es6_cjs"
		});
	});

	it("options argument is not required", function(){
		var res = transpile.to({
			name: "foo",
			source: "var GoogleMapReact = require('google-map-react')",
			metadata: { format: "es6" }
		}, "cjs");

		var e = "'use strict';\nvar GoogleMapReact = require('google-map-react');";
		assert.equal(res.code, e);
	});

	it("works if global.System is something else (#14)", function() {
		global.System = {};

		return convert({
			converter: es62cjs,
			sourceFileName: "es6",
			expectedFileName: "es6_cjs"
		});
	});

	it("works with babel", function() {
		return convert({
			converter: es62cjs,
			sourceFileName: "es6",
			expectedFileName: "es6_cjs_babel",
			options: {
				transpiler: "babel",
				babelOptions: {
					optional: {},
					blacklist: [],
					whitelist: []
				}
			}
		});
	});
});

describe("cjs - steal", function() {
	it("should work", function() {
		return convert({
			converter: cjs2steal,
			sourceFileName: "cjs",
			expectedFileName: "cjs_steal"
		});
	});

	it("should work with objects", function() {
		return convert({
			converter: cjs2steal,
			sourceFileName: "cjs2",
			expectedFileName: "cjs2_steal"
		});
	});

	it("should work with npm names", function() {
		return convert({
			converter: cjs2steal,
			sourceFileName: "cjs_npm",
			expectedFileName: "cjs_npm_steal"
		});
	});
});

describe("amd - cjs", function() {
	it("should work", function() {
		return convert({
			converter: amd2cjs,
			sourceFileName: "amd",
			expectedFileName: "amd_cjs"
		});
	});
});

describe("steal - amd", function() {
	it("should work", function() {
		return convert({
			converter: steal2amd,
			sourceFileName: "steal",
			expectedFileName: "steal_amd"
		});
	});

	it("should work with namedDefines", function() {
		return convert({
			converter: steal2amd,
			sourceFileName: "steal",
			expectedFileName: "steal_amd_named_defines",
			options: { namedDefines: true }
		});
	});

	it("should leave nested steals alone", function() {
		return convert({
			converter: steal2amd,
			sourceFileName: "nested_steal",
			expectedFileName: "nested_steal_amd"
		});
	});
});

describe("global - amd", function() {
	it("should work", function() {
		var load = { metadata: { format: "global", exports: "GLOBAL" } };

		return convert({
			load: load,
			converter: global2amd,
			sourceFileName: "global",
			expectedFileName: "global_amd"
		});
	});

	it("should include the export name", function() {
		var load = {
			metadata: {
				format: "global",
				deps: ["foo"],
				exports: "GLOBAL"
			}
		};

		return convert({
			load: load,
			converter: global2amd,
			sourceFileName: "global",
			expectedFileName: "global_amd_export"
		});
	});

	it("if no export is defined do not pass the exportname", function() {
		var load = {
			metadata: {
				format: "global",
				deps: []
			}
		};

		return convert({
			load: load,
			converter: global2amd,
			sourceFileName: "global",
			expectedFileName: "global_amd_noexport"
		});
	});

	it("exports: false passes the value false", function() {
		var load = {
			metadata: {
				format: "global",
				exports: false
			}
		};

		return convert({
			load: load,
			converter: global2amd,
			sourceFileName: "global",
			expectedFileName: "global_amd_exportfalse"
		});
	});

	it("works with an init function passed", function() {
		var load = {
			metadata: {
				format: "global",
				init: function(){
					return window.FOO; // eslint-disable-line
				}
			}
		};
		return convert({
			load: load,
			converter: global2amd,
			sourceFileName: "global",
			expectedFileName: "global_amd_init"
		});
	});

	it("works with 'eval': 'script'", function() {
		var load = {
			metadata: {
				format: "global",
				eval: "script"
			}
		};
		return convert({
			load: load,
			converter: global2amd,
			sourceFileName: "global",
			expectedFileName: "global_amd_eval"
		});
	});
});

describe("transpile", function(){
	it("able to steal to cjs", function() {
		var res = transpile.able("steal", "cjs");
		assert.deepEqual(res, ["steal", "amd"]);
	});

	it("able to steal to amd", function() {
		var res = transpile.able("steal", "amd");
		assert.deepEqual(res, ["steal"]);
	});

	it("able to es6 to amd", function() {
		var res = transpile.able("es6", "amd");
		assert.deepEqual(res, ["es6"]);
	});

	it("to steal to cjs", function() {
		return doTranspile({
			moduleFormat: "steal",
			resultModuleFormat: "cjs",
			sourceFileName: "steal",
			expectedFileName: "steal_cjs"
		});
	});

	it("able to global to amd", function() {
		return doTranspile({
			moduleFormat: "global",
			resultModuleFormat: "amd",
			sourceFileName: "global",
			expectedFileName: "global_amd_with_format"
		});
	});

	it("able to steal to cjs with missing args", function() {
		return doTranspile({
			moduleFormat: "steal",
			resultModuleFormat: "cjs",
			sourceFileName: "steal_no_value_arg",
			expectedFileName: "steal_no_value_arg_cjs"
		});
	});
});

describe("amd - amd", function() {
	it("should work", function() {
		return convert({
			converter: amd2amd,
			sourceFileName: "amd",
			expectedFileName: "amd_amd",
			options: { namedDefines: true }
		});
	});

	it("works with transpile", function() {
		return doTranspile({
			moduleFormat: "amd",
			resultModuleFormat: "amd",
			sourceFileName: "amd",
			expectedFileName: "amd_amd",
			options: { namedDefines: true }
		});
	});

	it("should work with a normalizeMap", function() {
		var options = {
			normalizeMap: {
				'./baz': 'baz'
			},

			namedDefines: true
		};

		return convert({
			options: options,
			converter: amd2amd,
			sourceFileName: "amd_deps",
			expectedFileName: "amd_deps"
		});
	});

	it("should rename the define name if able", function() {
		return convert({
			converter: amd2amd,
			sourceFileName: "amd_named",
			expectedFileName: "amd_named_amd",
			options: { namedDefines: true },
			load: { name: "redefined" }
		});
	});

	it("should not loop until the stack is out of space", function() {
		return convert({
			converter: amd2amd,
			sourceFileName: "amd_umd_loop",
			expectedFileName: "amd_umd_loop",
			options: { namedDefines: true },
			load: { name: "redefined" }
		});
	});
});

describe("metadata.format", function(){
	it("should be detected from amd source", function() {
		return doTranspile({
			moduleFormat: undefined,
			resultModuleFormat: "amd",
			sourceFileName: "amd",
			expectedFileName: "amd_amd",
			options: { namedDefines: true }
		});
	});

	it("should be detected from steal source", function() {
		return doTranspile({
			moduleFormat: undefined,
			resultModuleFormat: "cjs",
			sourceFileName: "steal",
			expectedFileName: "steal_cjs"
		});
	});

	it("should be detected from es6 source", function() {
		return doTranspile({
			moduleFormat: undefined,
			resultModuleFormat: "cjs",
			sourceFileName: "es6",
			expectedFileName: "es6_cjs"
		});
	});
});

describe("es6 - amd", function() {
	it("should work with bangs", function() {
		return doTranspile({
			moduleFormat: "es6",
			resultModuleFormat: "amd",
			sourceFileName: "es_with_bang",
			expectedFileName: "es_with_bang_amd",
			options: { namedDefines: true }
		});
	});

	it("should work with babel", function() {
		return doTranspile({
			moduleFormat: "es6",
			resultModuleFormat: "amd",
			sourceFileName: "es6",
			expectedFileName: "es6_amd_babel",
			options: { transpiler: "babel" }
		});
	});

	it("should work with babel-standalone included plugins", function() {
		return doTranspile({
			moduleFormat: "es6",
			resultModuleFormat: "amd",
			sourceFileName: "es6_and_decorators",
			expectedFileName: "es6_decorators_amd_babel",
			options: {
				transpiler: "babel",
				babelOptions: {
					plugins: ["transform-decorators-legacy"]
				}
			}
		});
	});

	it("stage0 is not a required preset", function() {
		return doTranspile({
			moduleFormat: "es6",
			resultModuleFormat: "amd",
			sourceFileName: "es6_and_async",
			expectedFileName: "es6_and_async",
			options: {
				transpiler: "babel",
				babelOptions: {
					presets: ["react"]
				}
			}
		});
	});

	it("should work with babel plugins NOT included in babel-standalone", function() {
		return doTranspile({
			moduleFormat: "es6",
			resultModuleFormat: "amd",
			sourceFileName: "es6",
			expectedFileName: "es6_amd_babel_and_plugin",
			options: {
				transpiler: "babel",
				babelOptions: {
					plugins: [ require("./babel-plugin") ]
				}
			}
		});
	});

	it("should work with babel presets NOT built in babel-standalone", function() {
		return doTranspile({
			moduleFormat: "es6",
			resultModuleFormat: "amd",
			sourceFileName: "es6",
			expectedFileName: "es6_amd_babel_and_plugin",
			options: {
				transpiler: "babel",
				babelOptions: {
					presets: [ require("babel-preset-steal-test") ]
				}
			}
		});
	});

	it("presets override the default ones", function() {
		return doTranspile({
			sourceFileName: "es6",
			moduleFormat: "es6",
			expectedFileName: "es6_amd_babel_loose",
			resultModuleFormat: "amd",
			options: {
				transpiler: "babel",
				babelOptions: {
					presets: [
						["es2015", { loose: true }]
					]
				}
			}
		});
	});

	it("should work with traceurOptions", function() {
		return doTranspile({
			sourceFileName: "es6",
			moduleFormat: "es6",
			expectedFileName: "es_with_traceur_options",
			resultModuleFormat: "amd",
			options: {
				traceurOptions: {
					properTailCalls: true
				}
			}
		});
	});

	it("can skip es2015 transforms with options.forceES5", function() {
		return doTranspile({
			moduleFormat: "es6",
			resultModuleFormat: "amd",
			sourceFileName: "es6_and_async",
			expectedFileName: "es6_and_async_not_es5",
			options: {
				transpiler: "babel",
				forceES5: false
			}
		});
	});

	it("does not error with ES2015 features when not transforming to ES5", function() {
		return doTranspile({
			moduleFormat: "es6",
			resultModuleFormat: "amd",
			sourceFileName: "es6_string_literals",
			expectedFileName: "es6_string_literals_not_es5",
			options: {
				transpiler: "babel",
				forceES5: false
			}
		});
	});

	it("allows sourcemaps generation to be skipped", function() {
		var es6ToAmd = require("../lib/es6_amd");

		var load = {
			source: "import foo from 'bar';",
			name: "foo"
		};

		es6ToAmd(load, {
			transpiler: "babel",
			sourceMaps: false
		});

		assert.equal(load.map, null, "should not generate sourcemaps");
	});
});

describe("normalize options", function() {
	it("steal - amd + normalizeMap", function() {
		var options = {
			normalizeMap: {
				"./baz": "baz"
			},
			namedDefines: true
		};

		return convert({
			options: options,
			converter: steal2amd,
			sourceFileName: "steal_deps",
			expectedFileName: "steal_amd_dep"
		});
	});

	it("steal - amd + normalize", function() {
		return convert({
			converter: steal2amd,
			sourceFileName: "steal_deps",
			expectedFileName: "steal_amd_normalize",
			options: {
				normalizeMap: {
					"./baz": "baz"
				},
				normalize: function(name){
					var parts = name.split("/");
					var len = parts.length;

					if (parts[len-1] === parts[len-2]) {
						parts.pop();
					}
					return parts.join("/");
				},
				namedDefines: true
			}
		});
	});

	it("es6 - cjs + normalize", function() {
		return convert({
			sourceFileName: "es_needing_normalize",
			converter: es62cjs,
			expectedFileName: "es_needing_normalize_cjs",
			options: {
				normalize: function(name) {
					if(name.lastIndexOf("/") === name.length - 1) {
						var parts = name.split("/");
						parts[parts.length - 1] =  parts[parts.length - 2];
						return parts.join("/");
					} else if( name.indexOf("!") >= 0 ) {
						return name.substr(0, name.indexOf("!") );
					}
					return name;
				}
			}
		});
	});

	it("amd - cjs + normalize", function() {
		return convert({
			sourceFileName: "amd_needing_normalize",
			converter: amd2cjs,
			expectedFileName: "amd_needing_normalize_cjs",
			options: {
				normalize: function(name){
					if(name.lastIndexOf("/") === name.length - 1) {
						var parts = name.split("/");
						parts[parts.length - 1] =  parts[parts.length - 2];
						return parts.join("/");
					} else if( name.indexOf("!") >= 0 ) {
						return name.substr(name.indexOf("!")+1);
					}
					return name;
				}
			}
		});
	});

	it("steal - cjs + normalize",function() {
		return doTranspile({
			moduleFormat: "steal",
			resultModuleFormat: "cjs",
			sourceFileName: "steal_needing_normalize",
			expectedFileName: "steal_needing_normalize_cjs",
			options: {
				normalize: function(name){
					return name+"-normalized";
				}
			}
		});
	});

	it("cjs - cjs + normalize", function() {
		return doTranspile({
			moduleFormat: "cjs",
			resultModuleFormat: "cjs",
			sourceFileName: "cjs_needing_normalize",
			expectedFileName: "cjs_needing_normalize_cjs",
			options: {
				normalize: function(name) {
					return name + "-normalized";
				}
			}
		});
	});
});

describe("transpile options", function() {
	it("es6 - cjs + normalize",function() {
		var options = {
			transpile: function() {
				return {
					code: 'require("foo")'
				};
			}
		};

		return convert({
			options: options,
			converter: es62cjs,
			sourceFileName: "es_needing_normalize",
			expectedFileName: "es_self_transpile"
		});
	});
});

describe("Source Maps", function() {
	var normal = { sourceMaps: true };
	var content = { sourceMaps: true, sourceMapsContent: true };

	[normal, content].forEach(function(opts) {
		opts.baseURL = __dirname + "/tests";
		opts.sourceRoot = "../";
	});

	describe("External file", function() {
		it("steal - amd works", function() {
			return doTranspile({
				options: normal,
				moduleFormat: "steal",
				resultModuleFormat: "amd",
				sourceFileName: "steal",
				expectedFileName: "steal_amd_sm"
			});
		});

		it("steal - cjs works", function() {
			return doTranspile({
				options: normal,
				moduleFormat: "steal",
				resultModuleFormat: "cjs",
				sourceFileName: "steal",
				expectedFileName: "steal_cjs_sm"
			});
		});

		it("cjs - amd works", function() {
			return doTranspile({
				options: normal,
				moduleFormat: "cjs",
				resultModuleFormat: "amd",
				sourceFileName: "cjs",
				expectedFileName: "cjs_amd_sm"
			});
		});

		it("amd - cjs works", function() {
			return doTranspile({
				options: normal,
				moduleFormat: "amd",
				resultModuleFormat: "cjs",
				sourceFileName: "amd",
				expectedFileName: "amd_cjs_sm"
			});
		});

		it("amd - amd works", function() {
			return doTranspile({
				options: normal,
				moduleFormat: "amd",
				resultModuleFormat: "amd",
				sourceFileName: "amd",
				expectedFileName: "amd_amd_sm"
			});
		});

		it("es6(traceur) - amd works", function() {
			return doTranspile({
				options: normal,
				moduleFormat: "es6",
				resultModuleFormat: "amd",
				sourceFileName: "es6",
				expectedFileName: "es6_amd_sm"
			});
		});

		it("es6(babel) - amd works", function() {
			var opts = assign({ transpiler: "babel" }, normal);

			return doTranspile({
				options: opts,
				moduleFormat: "es6",
				resultModuleFormat: "amd",
				sourceFileName: "es6",
				expectedFileName: "es62_amd_sm"
			});
		});

		it("es6(traceur) - cjs works", function() {
			return doTranspile({
				options: normal,
				moduleFormat: "es6",
				resultModuleFormat: "cjs",
				sourceFileName: "es6",
				expectedFileName: "es6_cjs_sm"
			});
		});

		it("es6(babel) - cjs works", function() {
			var opts = assign({ transpiler: "babel" }, normal);

			return doTranspile({
				options: opts,
				moduleFormat: "es6",
				resultModuleFormat: "cjs",
				sourceFileName: "es6",
				expectedFileName: "es62_cjs_sm"
			});
		});
	});

	describe("Content included", function() {
		it("steal - amd works", function() {
			doTranspile({
				options: content,
				moduleFormat: "steal",
				resultModuleFormat: "amd",
				sourceFileName: "steal",
				expectedFileName: "steal_amd_cont_sm"
			});
		});

		it("steal - cjs works", function() {
			return doTranspile({
				options: content,
				moduleFormat: "steal",
				resultModuleFormat: "cjs",
				sourceFileName: "steal",
				expectedFileName: "steal_cjs_cont_sm"
			});
		});

		it("amd - cjs works", function() {
			return doTranspile({
				options: content,
				moduleFormat: "amd",
				resultModuleFormat: "cjs",
				sourceFileName: "amd",
				expectedFileName: "amd_cjs_cont_sm"
			});
		});

		it("es6(traceur) - amd works", function() {
			return doTranspile({
				options: content,
				moduleFormat: "es6",
				resultModuleFormat: "amd",
				sourceFileName: "es6",
				expectedFileName: "es6_amd_cont_sm"
			});
		});

		it("es6(babel) - amd works", function() {
			var opts = assign({ transpiler: "babel" }, content);

			return doTranspile({
				options: opts,
				moduleFormat: "es6",
				resultModuleFormat: "amd",
				sourceFileName: "es6",
				expectedFileName: "es62_amd_cont_sm"
			});
		});
	});
});
