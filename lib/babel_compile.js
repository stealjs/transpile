var babel = require("babel-core");
var assign = require('object.assign');

var transforms = {
    amd: 'transform-es2015-modules-amd',
    commonjs: 'transform-es2015-modules-commonjs'
}

module.exports = function( source, compileOptions, options ) {

	var opts = assign({}, {
		presets: [
			'es2015'
		],
		plugins: [
			transforms[compileOptions.modules]
		]
	}, options.babelOptions, {
		sourceMap: compileOptions.sourceMaps || false,
	});

	if (opts.sourceMap) {
		opts.sourceMapTarget = opts.sourceFileName = compileOptions.filename;
	}

	var result = babel.transform(source, opts);

	return result;
};
