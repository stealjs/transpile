module.exports = function(options, moduleName, curModule, address){
	var opts = options || {};
	var name = (opts.normalizeMap && opts.normalizeMap[moduleName]) || moduleName;
	if(opts.normalize) {
		name = opts.normalize(name, curModule, address);
	}
	return name;
};
