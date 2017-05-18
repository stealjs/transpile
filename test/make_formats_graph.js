var assert = require("assert");
var makeFormatsGraph = require("../lib/make_transforms_formats_graph.js");

describe("makeFormatsGraph", function() {
	it("one transform", function() {
		assert.deepEqual(makeFormatsGraph(["amd_cjs"]), {
			amd: { cjs: {} },
			cjs: {}
		});
	});

	it("two (independent) transforms", function() {
		assert.deepEqual(makeFormatsGraph(["amd_cjs", "es6_steal"]), {
			amd: { cjs: {} },
			es6: { steal: {} },
			steal: {},
			cjs: {}
		});
	});

	it("two linked transforms", function() {
		assert.deepEqual(makeFormatsGraph(["amd_cjs", "cjs_steal"]), {
			amd: { cjs: {} },
			cjs: { steal: {} },
			steal: {}
		});
	});

	it("two transforms from the same source", function() {
		assert.deepEqual(makeFormatsGraph(["amd_cjs", "amd_steal"]), {
			amd: { cjs: {}, steal: {} },
			cjs: {},
			steal: {}
		});
	});

	it("two cyclic transforms", function() {
		assert.deepEqual(makeFormatsGraph(["amd_cjs", "cjs_amd"]), {
			amd: { cjs: {} },
			cjs: { amd: { cjs: {} } }
		});
	});

	it("self to self transform", function() {
		assert.deepEqual(makeFormatsGraph(["amd_cjs", "cjs_cjs"]), {
			amd: { cjs: {} },
			cjs: { cjs: {} }
		});
	});

	it("prevent nested duplicated format nodes", function() {
		assert.deepEqual(makeFormatsGraph(["cjs_amd", "cjs_steal", "cjs_cjs"]), {
			"amd": {},
			"cjs": {
				"amd": {},
				"cjs": {},
				"steal": {}
			},
			"steal": {}
		});
	});
});
