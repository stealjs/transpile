define('nested_steal', ['foo/foo'], function (foo) {
    if (foo) {
        steal('abc', function () {
        });
    }
});