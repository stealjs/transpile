var Q = require("q");
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var transpile = require("../main");
var assign = require("lodash/assign");

var readFile = Q.denodeify(fs.readFile);
var isWindows = /^win/.test(process.platform);

module.exports = function doTranspile(args) {
	var options = args.options || {};
	var moduleFormat = args.moduleFormat;
	var sourceFileName = args.sourceFileName;
	var expectedFileName = args.expectedFileName;
	var resultModuleFormat = args.resultModuleFormat;

	var actualCode;
	var actualMap;
	var srcAddress = path.join(__dirname, "tests", sourceFileName + ".js");

	return readFile(srcAddress)
		.then(function(data) {
			return transpile.to(
				assign({}, args.load, {
					name: sourceFileName,
					address: srcAddress,
					source: data.toString(),
					metadata: { format: moduleFormat }
				}),
				resultModuleFormat,
				options
			);
		})
		.then(function(res) {
			actualCode = res.code;
			actualMap = res.map && res.map.toString();

			return readFile(
				path.join(__dirname, "tests", "expected", expectedFileName + ".js")
			);
		})
		.then(function(data) {
			var expected = data.toString();

			if (options.sourceMaps) {
				actualCode += " //# sourceMappingURL=" + expectedFileName + ".js.map";
			}

			if (isWindows) {
				expected = expected.replace(/[\n\r]/g, "");
				actualCode = actualCode.replace(/[\n]/g, "");
			}

			assert.equal(actualCode, expected, "expected equals result");

			if (options.sourceMaps) {
				return readFile(
					path.join(
						__dirname,
						"tests",
						"expected",
						expectedFileName + ".js.map"
					)
				);
			}
		})
		.then(function(expectedMap) {
			if (expectedMap) {
				assert.equal(
					actualMap,
					expectedMap.toString(),
					"expected map equals result"
				);
			}
		});
};
