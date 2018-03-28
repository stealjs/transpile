define(['react'], function (_react) {
    'use strict';
    var _react2 = _interopRequireDefault(_react);
    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { default: obj };
    }
    class App extends _react2.default.Component {
        async fn() {
            await Promise.resolve();
        }
    }
    App.greetie = 'Matthew';
});