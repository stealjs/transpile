var _ = Object.create(null);

_.each = function() {};
_.clone = function() {};

if (
  typeof define == "function" &&
  typeof define.amd == "object" &&
  define.amd
) {
  define(function() {
    return _;
  });
} else if (freeModule) {
  // Export for Node.js.
  (freeModule.exports = _)._ = _;
  // Export for CommonJS support.
  freeExports._ = _;
}
