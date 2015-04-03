var path = require("path");

module.exports = sourceMapFileName;

function sourceMapFileName(load, options){
	var baseURL = options.baseURL || process.cwd();
	var address = load.address.replace("file:", "");
	var sourcePath = path.relative(baseURL, address);
	return sourcePath;
}
