var convert = require("./convert");
var globalToSlim = require("../lib/global/slim");

describe("global -> slim", function() {
	it("works", function() {
		return convert({
			converter: globalToSlim,
			sourceFileName: "global",
			expectedFileName: "global_slim"
		});
	});

	it("turns `meta.deps` into `stealRequire` calls", function() {
		return convert({
			converter: globalToSlim,
			sourceFileName: "global",
			expectedFileName: "global_deps_slim",
			load: {
				metadata: {
					format: "global",
					deps: ["foo", "bar"]
				}
			},
			options: {
				normalize: function(name) {
					return { foo: 1, bar: 2 }[name];
				}
			}
		});
	});

	it("turns `meta.exports` into `stealModule.exports`", function() {
		return convert({
			converter: globalToSlim,
			sourceFileName: "global",
			expectedFileName: "global_exports_slim",
			load: {
				metadata: {
					format: "global",
					exports: "GLOBAL"
				}
			}
		});
	});

	it("works when both `meta.deps` and `meta.exports` set", function() {
		return convert({
			converter: globalToSlim,
			sourceFileName: "global",
			expectedFileName: "global_deps_exports_slim",
			load: {
				metadata: {
					format: "global",
					deps: ["foo", "bar"],
					exports: "GLOBAL"
				}
			}
		});
	});
});
