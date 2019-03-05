var Q = require("q");
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var assign = require("lodash/assign");
var generate = require("../lib/generate");
var defaults = require("lodash/defaults");

var readFile = Q.denodeify(fs.readFile);
var isWindows = /^win/.test(process.platform);

module.exports = function convert(args) {
	var converter = args.converter;
	var sourceFileName = args.sourceFileName;
	var expectedFileName = args.expectedFileName;
	var options = defaults(args.options || {}, { forceES5: true });

	var srcAddress = path.join(__dirname, "tests", sourceFileName + ".js");

	return readFile(srcAddress)
		.then(function(data) {
			var load = assign(
				{},
				{
					address: srcAddress,
					name: sourceFileName,
					source: data.toString()
				},
				args.load
			);

			return generate(converter(load, options)).code;
		})
		.then(function(actual) {
			return Promise.all([
				actual,
				readFile(
					path.join(__dirname, "tests", "expected", expectedFileName + ".js")
				)
			]);
		})
		.then(function(data) {
			var actual = data[0];
			var expected = data[1].toString();

			if (isWindows) {
				actual = actual.replace(/[\n]/g, "");
				expected = expected.replace(/[\n\r]/g, "");
			}

			assert.equal(actual, expected.toString(), "expected equals result");
		});
};
