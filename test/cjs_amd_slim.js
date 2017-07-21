var Q = require("q");
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var transpile = require("../main");

var readFile = Q.denodeify(fs.readFile);

describe("cjs - amd - slim", function() {
	it("does not duplicate dependencies", function() {
		var src = path.join(__dirname, "tests", "cjs.js");

		return (
			readFile(src)
				.then(function(data) {
					return transpile.to(
						{
							metadata: {
								format: "cjs"
							},
							address: src,
							name: "cjs",
							source: data.toString()
						},
						"slim",
						{}
					);
				})
				.then(function(actual) {
					return Promise.all([
						actual.code,
						readFile(
							path.join(__dirname, "tests", "expected", "cjs_amd_slim.js")
						)
					]);
				})
				// [ actual :: String, expected :: Buffer ]
				.then(function(data) {
					assert.equal(
						data[0],
						data[1].toString(),
						"transpiled output is incorrect"
					);
				})
		);
	});
});
