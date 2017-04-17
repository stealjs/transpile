var Q = require("q");
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var assign = require("object.assign");
var generate = require("../lib/generate");

var readFile = Q.denodeify(fs.readFile);
var isWindows = /^win/.test(process.platform);

module.exports = function convert(args) {
	var converter = args.converter;
	var options = args.options || {};
	var sourceFileName = args.sourceFileName;
	var expectedFileName = args.expectedFileName;

	var actual;
	var srcAddress = path.join(__dirname, "tests", sourceFileName + ".js");

	return readFile(srcAddress)
		.then(function(data) {
			var load = assign({}, {
				address: srcAddress,
				name: sourceFileName,
				source: data.toString()
			}, args.load);

			return generate(converter(load, options)).code;
		})
		.then(function(res) {
			actual = res;
			return readFile(path.join(__dirname, "tests", "expected",
				expectedFileName + ".js"));
		})
		.then(function(data) {
			var expected = data.toString();

			if (isWindows) {
				actual = actual.replace(/[\n]/g, "");
				expected = expected.replace(/[\n\r]/g, "");
			}

			assert.equal(actual, expected.toString(), "expected equals result");
		});
};
