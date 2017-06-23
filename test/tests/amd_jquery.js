(function(global, factory) {
	factory(global);
})(window, function(global) {
	var jQuery = {
		version: "9.9.9",
		ajax: function() {}
	};

	if (window.define && define.amd) {
		define("jquery", [], function() {
			return jQuery;
		});
	}

	return jQuery;
});
