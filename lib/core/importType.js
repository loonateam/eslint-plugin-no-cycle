"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = resolveImportType;
exports.isAbsolute = isAbsolute;
exports.isBuiltIn = isBuiltIn;
exports.isExternalModule = isExternalModule;
exports.isExternalModuleMain = isExternalModuleMain;
exports.isScoped = isScoped;
exports.isScopedMain = isScopedMain;

var _path = require("path");

var _isCoreModule = _interopRequireDefault(require("is-core-module"));

var _resolve = _interopRequireDefault(require("eslint-module-utils/resolve"));

var _packagePath = require("./packagePath");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function baseModule(name) {
  if (isScoped(name)) {
    var _name$split = name.split('/'),
        _name$split2 = _slicedToArray(_name$split, 2),
        scope = _name$split2[0],
        _pkg = _name$split2[1];

    return "".concat(scope, "/").concat(_pkg);
  }

  var _name$split3 = name.split('/'),
      _name$split4 = _slicedToArray(_name$split3, 1),
      pkg = _name$split4[0];

  return pkg;
}

function isInternalRegexMatch(name, settings) {
  var internalScope = settings && settings['import/internal-regex'];
  return internalScope && new RegExp(internalScope).test(name);
}

function isAbsolute(name) {
  return typeof name === 'string' && (0, _path.isAbsolute)(name);
} // path is defined only when a resolver resolves to a non-standard path


function isBuiltIn(name, settings, path) {
  if (path || !name) return false;
  var base = baseModule(name);
  var extras = settings && settings['import/core-modules'] || [];
  return (0, _isCoreModule["default"])(base) || extras.indexOf(base) > -1;
}

function isExternalModule(name, path, context) {
  if (arguments.length < 3) {
    throw new TypeError('isExternalModule: name, path, and context are all required');
  }

  return (isModule(name) || isScoped(name)) && typeTest(name, context, path) === 'external';
}

function isExternalModuleMain(name, path, context) {
  if (arguments.length < 3) {
    throw new TypeError('isExternalModule: name, path, and context are all required');
  }

  return isModuleMain(name) && typeTest(name, context, path) === 'external';
}

var moduleRegExp = /^\w/;

function isModule(name) {
  return name && moduleRegExp.test(name);
}

var moduleMainRegExp = /^[\w]((?!\/).)*$/;

function isModuleMain(name) {
  return name && moduleMainRegExp.test(name);
}

var scopedRegExp = /^@[^/]+\/?[^/]+/;

function isScoped(name) {
  return name && scopedRegExp.test(name);
}

var scopedMainRegExp = /^@[^/]+\/?[^/]+$/;

function isScopedMain(name) {
  return name && scopedMainRegExp.test(name);
}

function isRelativeToParent(name) {
  return /^\.\.$|^\.\.[\\/]/.test(name);
}

var indexFiles = ['.', './', './index', './index.js'];

function isIndex(name) {
  return indexFiles.indexOf(name) !== -1;
}

function isRelativeToSibling(name) {
  return /^\.[\\/]/.test(name);
}

function isExternalPath(path, context) {
  if (!path) {
    return false;
  }

  var settings = context.settings;
  var packagePath = (0, _packagePath.getContextPackagePath)(context);

  if ((0, _path.relative)(packagePath, path).startsWith('..')) {
    return true;
  }

  var folders = settings && settings['import/external-module-folders'] || ['node_modules'];
  return folders.some(function (folder) {
    var folderPath = (0, _path.resolve)(packagePath, folder);
    var relativePath = (0, _path.relative)(folderPath, path);
    return !relativePath.startsWith('..');
  });
}

function isInternalPath(path, context) {
  if (!path) {
    return false;
  }

  var packagePath = (0, _packagePath.getContextPackagePath)(context);
  return !(0, _path.relative)(packagePath, path).startsWith('../');
}

function isExternalLookingName(name) {
  return isModule(name) || isScoped(name);
}

function typeTest(name, context, path) {
  var settings = context.settings;

  if (isInternalRegexMatch(name, settings)) {
    return 'internal';
  }

  if (isAbsolute(name, settings, path)) {
    return 'absolute';
  }

  if (isBuiltIn(name, settings, path)) {
    return 'builtin';
  }

  if (isRelativeToParent(name, settings, path)) {
    return 'parent';
  }

  if (isIndex(name, settings, path)) {
    return 'index';
  }

  if (isRelativeToSibling(name, settings, path)) {
    return 'sibling';
  }

  if (isExternalPath(path, context)) {
    return 'external';
  }

  if (isInternalPath(path, context)) {
    return 'internal';
  }

  if (isExternalLookingName(name)) {
    return 'external';
  }

  return 'unknown';
}

function resolveImportType(name, context) {
  return typeTest(name, context, (0, _resolve["default"])(name, context));
}