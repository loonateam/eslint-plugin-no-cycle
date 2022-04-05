"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getContextPackagePath = getContextPackagePath;
exports.getFilePackageName = getFilePackageName;
exports.getFilePackagePath = getFilePackagePath;

var _path = require("path");

var _pkgUp = _interopRequireDefault(require("eslint-module-utils/pkgUp"));

var _readPkgUp2 = _interopRequireDefault(require("eslint-module-utils/readPkgUp"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getContextPackagePath(context) {
  return getFilePackagePath(context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename());
}

function getFilePackagePath(filePath) {
  var fp = (0, _pkgUp["default"])({
    cwd: filePath
  });
  return (0, _path.dirname)(fp);
}

function getFilePackageName(filePath) {
  var _readPkgUp = (0, _readPkgUp2["default"])({
    cwd: filePath,
    normalize: false
  }),
      pkg = _readPkgUp.pkg,
      path = _readPkgUp.path;

  if (pkg) {
    // recursion in case of intermediate esm package.json without name found
    return pkg.name || getFilePackageName((0, _path.dirname)((0, _path.dirname)(path)));
  }

  return null;
}