define(function() {
	steal.import("foo").then(function(foo) {
		window.foo = foo;
	});
});
