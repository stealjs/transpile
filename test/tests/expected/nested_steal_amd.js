define('nested_steal', ['foo'], function (foo) {
    if (foo) {
        steal('abc', function () {
        });
    }
});