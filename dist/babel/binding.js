"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var propertyNamesRegistry = new WeakMap();

function isConstructor(funcName) {
    return funcName === "constructor";
}

function isPrivate(funcName) {
    // python-style private properties
    return funcName.startsWith("__");
}

function findOrCreatePropertyNames(targetClass) {
    var propertyNames = propertyNamesRegistry.get(targetClass);

    if (propertyNames !== undefined) {
        return propertyNames;
    }

    propertyNames = Object.getOwnPropertyNames(targetClass.prototype);

    propertyNames = _lodash2.default.filter(propertyNames, function (propertyName) {
        var propertyValue = targetClass.prototype[propertyName];

        if (!_lodash2.default.isFunction(propertyValue)) {
            return false;
        }

        if (isPrivate(propertyName)) {
            return false;
        }

        if (isConstructor(propertyName)) {
            return false;
        }

        return true;
    });

    propertyNamesRegistry.set(targetClass, propertyNames);

    return propertyNames;
}

function _prebind(targetClass) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    var target = new (Function.prototype.bind.apply(targetClass, [null].concat(args)))();

    var propertyNames = findOrCreatePropertyNames(targetClass);

    _lodash2.default.forEach(propertyNames, function (propertyName) {
        var method = target[propertyName];

        var boundMethod = method.bind(target);

        target[propertyName] = boundMethod;
    });

    return target;
}

function jitbind(targetClass) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
    }

    var target = new (Function.prototype.bind.apply(targetClass, [null].concat(args)))();

    var propertyNames = findOrCreatePropertyNames(targetClass);

    var jitClass = function jitClass(target) {
        // TODO: do this with proxies under ES6
        // TODO: consider caching based on weakref of this

        // create an object, props, consisting of a getter for each
        // property name that jit-creates a bound method
        var props = {};

        _lodash2.default.reduce(propertyNames, function (_ignore, propertyName) {
            props[propertyName] = {
                get: function get() {
                    return target[propertyName].bind(target);
                }
            };
        });

        Object.defineProperties(this, props);
    };

    jitClass.name = "$jit-" + targetClass.name;

    return new jitClass(target);
}

var Factory = function () {
    function Factory() {
        _classCallCheck(this, Factory);
    }

    _createClass(Factory, [{
        key: "prebind",
        value: function prebind(targetClass) {
            for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                args[_key3 - 1] = arguments[_key3];
            }

            return _prebind.apply(undefined, [targetClass].concat(args));
        }
    }, {
        key: "JIT",
        value: function JIT(targetClass) {
            for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                args[_key4 - 1] = arguments[_key4];
            }

            return jitbind.apply(undefined, [targetClass].concat(args));
        }
    }]);

    return Factory;
}();

var factory = new Factory();

exports.default = factory;