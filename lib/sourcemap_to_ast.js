// https://github.com/tarruda/sourcemap-to-ast
var SourceMapConsumer = require("source-map").SourceMapConsumer;
var traverse = require("estraverse").traverse;

module.exports = function sourceMapToAst(ast, _map) {
	var map = new SourceMapConsumer(_map);

	traverse(ast, {
		enter: function(node) {
			if (!(node.type && node.loc)) return;

			var origStart = map.originalPositionFor(node.loc.start);

			if (!origStart.line) {
				delete node.loc;
				return;
			}

			var origEnd = map.originalPositionFor(node.loc.end);

			if (
				origEnd.line &&
				(origEnd.line < origStart.line ||
					origEnd.column < origStart.column)
			) {
				origEnd.line = null;
			}

			node.loc = {
				start: {
					line: origStart.line,
					column: origStart.column
				},
				end: origEnd.line && {
					line: origEnd.line,
					column: origEnd.column
				},
				source: origStart.source,
				name: origStart.name
			};
		}
	});

	return ast;
};
