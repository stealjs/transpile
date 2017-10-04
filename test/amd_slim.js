var convert = require("./convert");
var amdToSlim = require("../lib/amd/slim");

describe("amd - slim", function() {
	it("anonymous and deps free", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_anon_nodeps",
			expectedFileName: "amd_nodeps_slim"
		});
	});

	it("named and deps free", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_named_nodeps",
			expectedFileName: "amd_nodeps_slim",
			load: { name: "amd_anon_nodeps" } // use an existing module id
		});
	});

	it("anonymous with deps", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd",
			expectedFileName: "amd_deps_slim"
		});
	});

	it("named with deps", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_named_deps",
			expectedFileName: "amd_named_deps_slim"
		});
	});

	it("object define shorthand", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_object",
			expectedFileName: "amd_object_slim"
		});
	});

	it("amd simplified cjs wrapper", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_cjs_wrapper",
			expectedFileName: "amd_cjs_wrapper_slim",
			load: { name: "amd_cjs_wrapper" }
		});
	});

	it("named amd simplified cjs wrapper", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_named_cjs_wrapper",
			expectedFileName: "amd_cjs_wrapper_slim",
			load: { name: "amd_cjs_wrapper" }
		});
	});

	it("transforms dynamic imports", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_dynamic_import",
			expectedFileName: "amd_dynamic_import_slim"
		});
	});

	it("transpile module.exports correctly", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_cjs_module",
			expectedFileName: "amd_cjs_module_slim"
		});
	});

	it("transpiles jquery-like IIFE/AMD", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_jquery",
			expectedFileName: "amd_jquery_slim"
		});
	});

	it("transpiles modules using CJS-like require and exports", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_require_exports",
			expectedFileName: "amd_require_exports_slim"
		});
	});

	it("transpiles amd modules created by babel from ESM", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_babel",
			expectedFileName: "amd_babel_slim"
		});
	});

	it("dependencies needing normalize", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_needing_normalize",
			expectedFileName: "amd_needing_normalize_slim",
			options: {
				normalize: function(name) {
					var requiresPluginName = name.indexOf("!") != -1;
					var endsWithSlash = name[name.length - 1] === "/";

					// duplicates the final part of module identifier
					// foo/bar/ -> foo/bar/bar
					if (endsWithSlash) {
						var parts = name.split("/");
						parts[parts.length - 1] = parts[parts.length - 2];
						return parts.join("/");

					// returns everything after the exclamation mark as the
					// normalized module identifier
					} else if (requiresPluginName) {
						return name.substr(name.indexOf("!") + 1);
					}

					return name;
				}
			}
		});
	});

	it("transpiles UMD modules", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_umd",
			expectedFileName: "amd_umd_slim"
		});
	});

	it("sets module.id when 'module' is a dependency", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_module_member_expression",
			expectedFileName: "amd_module_member_expression_slim"
		});
	});

	it("replaces 'module' identifiers with 'stealModule'", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_module_identifier",
			expectedFileName: "amd_module_identifier_slim"
		});
	});

	it("transpiles UMD modules with 'export' dependency", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_rollup_umd",
			expectedFileName: "amd_rollup_umd_slim"
		});
	});
});
