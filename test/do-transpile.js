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
			actualMap = res.map && res.map.toString().trim();

			return readFile(
				path.join(__dirname, "tests", "expected", expectedFileName + ".js")
			);
		})
		.then(function(data) {
			var expected = data.toString().trim();

			if (options.sourceMaps) {
				actualCode += " //# sourceMappingURL=" + expectedFileName + ".js.map";
			}

			if (isWindows) {
				expected = expected.replace(/[\r\n]/g, "");
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
                expectedMap = expectedMap.toString().trim();
                if (isWindows) {
                    expectedMap = expectedMap.replace(/(\\n)/g, "");
                    actualMap = actualMap.replace(/(\\r\\n|\\n)/g, "");
                }
				assert.equal(
					actualMap,
					expectedMap,
					"expected map equals result"
				);
			}
		});
};
