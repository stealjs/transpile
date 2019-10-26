var acorn = require("acorn");
var assert = require("assert");
var coffee = require("coffee-script");
var sourceMapToAst = require("../lib/sourcemap_to_ast");

describe("sourceMapToAst", function() {
	it("works", function() {
		var compiled = coffee.compile("x =\n 1", { sourceMap: true });
		var ast = acorn.parse(compiled.js, { locations: true });

		assert.equal(
			compiled.js,
			"(function() {\n" +
			"  var x;\n\n" +
			"  x = 1;\n\n" + // line 4 and columns 2 to 7
			"}).call(this);\n"
		);

		var func = ast.body[0].expression.callee.object;
		var funcBody = func.body.body;
		var assignment = funcBody[1].expression;

		assert.deepEqual(assignment.loc.start, { line: 4, column: 2 });
		assert.deepEqual(assignment.loc.end, { line: 4, column: 7 });

		sourceMapToAst(ast, compiled.v3SourceMap);

		assert.deepEqual(assignment.loc.start, { line: 1, column: 0 });
		assert.deepEqual(assignment.right.loc.start, {
			line: 2,
			column: 1
		});
	});
});
