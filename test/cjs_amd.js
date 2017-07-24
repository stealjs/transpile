var convert = require("./convert");
var cjsToAmd = require("../lib/cjs_amd");

describe("cjs - amd", function() {
	it("should work with relative dependencies", function() {
		var options = {
			normalizeMap: {
				"./b": "b"
			}
		};

		return convert({
			options: options,
			converter: cjsToAmd,
			sourceFileName: "cjs_deps",
			expectedFileName: "cjs_deps"
		});
	});

	it("should be able to add named defines", function() {
		var options = {
			normalizeMap: {
				"./b": "b"
			},
			namedDefines: true
		};

		return convert({
			options: options,
			converter: cjsToAmd,
			sourceFileName: "cjs_deps",
			expectedFileName: "cjs_deps_named_defines"
		});
	});

	it("converts a module that uses global", function() {
		return convert({
			converter: cjsToAmd,
			sourceFileName: "cjs_global",
			expectedFileName: "cjs_global"
		});
	});

	it("converts a module that uses global without dot operator", function() {
		return convert({
			converter: cjsToAmd,
			sourceFileName: "cjs_global_without_dot",
			expectedFileName: "cjs_global_without_dot"
		});
	});

	it("converts a module that uses __dirname", function() {
		return convert({
			converter: cjsToAmd,
			sourceFileName: "cjs_dirname",
			expectedFileName: "cjs_dirname"
		});
	});

	it("converts a module that uses global and __dirname", function() {
		return convert({
			converter: cjsToAmd,
			sourceFileName: "cjs_global_dirname",
			expectedFileName: "cjs_global_dirname"
		});
	});

	it("duplicate dependencies if flag set (anonymous)", function() {
		return convert({
			converter: cjsToAmd,
			sourceFileName: "cjs_deps",
			expectedFileName: "cjs_duplicated_deps",
			options: { duplicateCjsDependencies: true }
		});
	});

	it("duplicate dependencies if flag set (named)", function() {
		return convert({
			converter: cjsToAmd,
			sourceFileName: "cjs_deps",
			expectedFileName: "cjs_duplicated_deps_named_defines",
			options: {
				namedDefines: true,
				duplicateCjsDependencies: true
			}
		});
	});
});
