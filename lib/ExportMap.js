"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
exports.recursivePatternCapture = recursivePatternCapture;

var _fs = _interopRequireDefault(require("fs"));

var _path = require("path");

var _doctrine = _interopRequireDefault(require("doctrine"));

var _debug = _interopRequireDefault(require("debug"));

var _eslint = require("eslint");

var _parse = _interopRequireDefault(require("eslint-module-utils/parse"));

var _visit = _interopRequireDefault(require("eslint-module-utils/visit"));

var _resolve = _interopRequireDefault(require("eslint-module-utils/resolve"));

var _ignore = _interopRequireWildcard(require("eslint-module-utils/ignore"));

var _hash = require("eslint-module-utils/hash");

var unambiguous = _interopRequireWildcard(require("eslint-module-utils/unambiguous"));

var _tsconfigLoader = require("tsconfig-paths/lib/tsconfig-loader");

var _arrayIncludes = _interopRequireDefault(require("array-includes"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var ts;
var log = (0, _debug["default"])('eslint-plugin-import:ExportMap');
var exportCache = new Map();
var tsConfigCache = new Map();

var ExportMap = /*#__PURE__*/function () {
  function ExportMap(path) {
    _classCallCheck(this, ExportMap);

    this.path = path;
    this.namespace = new Map(); // todo: restructure to key on path, value is resolver + map of names

    this.reexports = new Map();
    /**
     * star-exports
     * @type {Set} of () => ExportMap
     */

    this.dependencies = new Set();
    /**
     * dependencies of this module that are not explicitly re-exported
     * @type {Map} from path = () => ExportMap
     */

    this.imports = new Map();
    this.errors = [];
    /**
     * type {'ambiguous' | 'Module' | 'Script'}
     */

    this.parseGoal = 'ambiguous';
  }

  _createClass(ExportMap, [{
    key: "hasDefault",
    get: function get() {
      return this.get('default') != null;
    } // stronger than this.has

  }, {
    key: "size",
    get: function get() {
      var size = this.namespace.size + this.reexports.size;
      this.dependencies.forEach(function (dep) {
        var d = dep(); // CJS / ignored dependencies won't exist (#717)

        if (d == null) return;
        size += d.size;
      });
      return size;
    }
    /**
     * Note that this does not check explicitly re-exported names for existence
     * in the base namespace, but it will expand all `export * from '...'` exports
     * if not found in the explicit namespace.
     * @param  {string}  name
     * @return {Boolean} true if `name` is exported by this module.
     */

  }, {
    key: "has",
    value: function has(name) {
      if (this.namespace.has(name)) return true;
      if (this.reexports.has(name)) return true; // default exports must be explicitly re-exported (#328)

      if (name !== 'default') {
        var _iterator = _createForOfIteratorHelper(this.dependencies),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var dep = _step.value;
            var innerMap = dep(); // todo: report as unresolved?

            if (!innerMap) continue;
            if (innerMap.has(name)) return true;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      return false;
    }
    /**
     * ensure that imported name fully resolves.
     * @param  {string} name
     * @return {{ found: boolean, path: ExportMap[] }}
     */

  }, {
    key: "hasDeep",
    value: function hasDeep(name) {
      if (this.namespace.has(name)) return {
        found: true,
        path: [this]
      };

      if (this.reexports.has(name)) {
        var reexports = this.reexports.get(name);
        var imported = reexports.getImport(); // if import is ignored, return explicit 'null'

        if (imported == null) return {
          found: true,
          path: [this]
        }; // safeguard against cycles, only if name matches

        if (imported.path === this.path && reexports.local === name) {
          return {
            found: false,
            path: [this]
          };
        }

        var deep = imported.hasDeep(reexports.local);
        deep.path.unshift(this);
        return deep;
      } // default exports must be explicitly re-exported (#328)


      if (name !== 'default') {
        var _iterator2 = _createForOfIteratorHelper(this.dependencies),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var dep = _step2.value;
            var innerMap = dep();
            if (innerMap == null) return {
              found: true,
              path: [this]
            }; // todo: report as unresolved?

            if (!innerMap) continue; // safeguard against cycles

            if (innerMap.path === this.path) continue;
            var innerValue = innerMap.hasDeep(name);

            if (innerValue.found) {
              innerValue.path.unshift(this);
              return innerValue;
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }

      return {
        found: false,
        path: [this]
      };
    }
  }, {
    key: "get",
    value: function get(name) {
      if (this.namespace.has(name)) return this.namespace.get(name);

      if (this.reexports.has(name)) {
        var reexports = this.reexports.get(name);
        var imported = reexports.getImport(); // if import is ignored, return explicit 'null'

        if (imported == null) return null; // safeguard against cycles, only if name matches

        if (imported.path === this.path && reexports.local === name) return undefined;
        return imported.get(reexports.local);
      } // default exports must be explicitly re-exported (#328)


      if (name !== 'default') {
        var _iterator3 = _createForOfIteratorHelper(this.dependencies),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var dep = _step3.value;
            var innerMap = dep(); // todo: report as unresolved?

            if (!innerMap) continue; // safeguard against cycles

            if (innerMap.path === this.path) continue;
            var innerValue = innerMap.get(name);
            if (innerValue !== undefined) return innerValue;
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }

      return undefined;
    }
  }, {
    key: "forEach",
    value: function forEach(callback, thisArg) {
      var _this = this;

      this.namespace.forEach(function (v, n) {
        return callback.call(thisArg, v, n, _this);
      });
      this.reexports.forEach(function (reexports, name) {
        var reexported = reexports.getImport(); // can't look up meta for ignored re-exports (#348)

        callback.call(thisArg, reexported && reexported.get(reexports.local), name, _this);
      });
      this.dependencies.forEach(function (dep) {
        var d = dep(); // CJS / ignored dependencies won't exist (#717)

        if (d == null) return;
        d.forEach(function (v, n) {
          return n !== 'default' && callback.call(thisArg, v, n, _this);
        });
      });
    } // todo: keys, values, entries?

  }, {
    key: "reportErrors",
    value: function reportErrors(context, declaration) {
      context.report({
        node: declaration.source,
        message: "Parse errors in imported module '".concat(declaration.source.value, "': ") + "".concat(this.errors.map(function (e) {
          return "".concat(e.message, " (").concat(e.lineNumber, ":").concat(e.column, ")");
        }).join(', '))
      });
    }
  }]);

  return ExportMap;
}();
/**
 * parse docs from the first node that has leading comments
 */


exports["default"] = ExportMap;

function captureDoc(source, docStyleParsers) {
  var metadata = {}; // 'some' short-circuits on first 'true'

  for (var _len = arguments.length, nodes = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    nodes[_key - 2] = arguments[_key];
  }

  nodes.some(function (n) {
    try {
      var leadingComments; // n.leadingComments is legacy `attachComments` behavior

      if ('leadingComments' in n) {
        leadingComments = n.leadingComments;
      } else if (n.range) {
        leadingComments = source.getCommentsBefore(n);
      }

      if (!leadingComments || leadingComments.length === 0) return false;

      for (var name in docStyleParsers) {
        var doc = docStyleParsers[name](leadingComments);

        if (doc) {
          metadata.doc = doc;
        }
      }

      return true;
    } catch (err) {
      return false;
    }
  });
  return metadata;
}

var availableDocStyleParsers = {
  jsdoc: captureJsDoc,
  tomdoc: captureTomDoc
};
/**
 * parse JSDoc from leading comments
 * @param {object[]} comments
 * @return {{ doc: object }}
 */

function captureJsDoc(comments) {
  var doc; // capture XSDoc

  comments.forEach(function (comment) {
    // skip non-block comments
    if (comment.type !== 'Block') return;

    try {
      doc = _doctrine["default"].parse(comment.value, {
        unwrap: true
      });
    } catch (err) {
      /* don't care, for now? maybe add to `errors?` */
    }
  });
  return doc;
}
/**
  * parse TomDoc section from comments
  */


function captureTomDoc(comments) {
  // collect lines up to first paragraph break
  var lines = [];

  for (var i = 0; i < comments.length; i++) {
    var comment = comments[i];
    if (comment.value.match(/^\s*$/)) break;
    lines.push(comment.value.trim());
  } // return doctrine-like object


  var statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);

  if (statusMatch) {
    return {
      description: statusMatch[2],
      tags: [{
        title: statusMatch[1].toLowerCase(),
        description: statusMatch[2]
      }]
    };
  }
}

var supportedImportTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier']);

ExportMap.get = function (source, context) {
  var aliases = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var path = (0, _resolve["default"])(source, context);

  if (path == null) {
    var partsOfSource = source.split('/');
    var key = partsOfSource[0];
    var keyWithStar = "".concat(key, "/*");
    var value = aliases[key] || aliases[keyWithStar];

    if (Array.isArray(value) && value.length) {
      var resolvedSource = "".concat(process.cwd(), "/").concat(value[0].replace(/\*$/, partsOfSource.slice(1).join('/')));
      var resolvedPath = (0, _resolve["default"])(resolvedSource, context);
      if (!resolvedPath) return null;
      return ExportMap["for"](childContext(resolvedPath, context));
    }

    return null;
  }

  return ExportMap["for"](childContext(path, context));
};

ExportMap["for"] = function (context) {
  var path = context.path;
  var cacheKey = (0, _hash.hashObject)(context).digest('hex');
  var exportMap = exportCache.get(cacheKey); // return cached ignore

  if (exportMap === null) return null;

  var stats = _fs["default"].statSync(path);

  if (exportMap != null) {
    // date equality check
    if (exportMap.mtime - stats.mtime === 0) {
      return exportMap;
    } // future: check content equality?

  } // check valid extensions first


  if (!(0, _ignore.hasValidExtension)(path, context)) {
    exportCache.set(cacheKey, null);
    return null;
  } // check for and cache ignore


  if ((0, _ignore["default"])(path, context)) {
    log('ignored path due to ignore settings:', path);
    exportCache.set(cacheKey, null);
    return null;
  }

  var content = _fs["default"].readFileSync(path, {
    encoding: 'utf8'
  }); // check for and cache unambiguous modules


  if (!unambiguous.test(content)) {
    log('ignored path due to unambiguous regex:', path);
    exportCache.set(cacheKey, null);
    return null;
  }

  log('cache miss', cacheKey, 'for path', path);
  exportMap = ExportMap.parse(path, content, context); // ambiguous modules return null

  if (exportMap == null) return null;
  exportMap.mtime = stats.mtime;
  exportCache.set(cacheKey, exportMap);
  return exportMap;
};

ExportMap.parse = function (path, content, context) {
  var m = new ExportMap(path);
  var isEsModuleInteropTrue = isEsModuleInterop();
  var ast;
  var visitorKeys;

  try {
    var result = (0, _parse["default"])(path, content, context);
    ast = result.ast;
    visitorKeys = result.visitorKeys;
  } catch (err) {
    m.errors.push(err);
    return m; // can't continue
  }

  m.visitorKeys = visitorKeys;
  var hasDynamicImports = false;

  function processDynamicImport(source) {
    hasDynamicImports = true;

    if (source.type !== 'Literal') {
      return null;
    }

    var p = remotePath(source.value);

    if (p == null) {
      return null;
    }

    var importedSpecifiers = new Set();
    importedSpecifiers.add('ImportNamespaceSpecifier');
    var getter = thunkFor(p, context);
    m.imports.set(p, {
      getter: getter,
      declarations: new Set([{
        source: {
          // capturing actual node reference holds full AST in memory!
          value: source.value,
          loc: source.loc
        },
        importedSpecifiers: importedSpecifiers
      }])
    });
  }

  (0, _visit["default"])(ast, visitorKeys, {
    ImportExpression: function ImportExpression(node) {
      processDynamicImport(node.source);
    },
    CallExpression: function CallExpression(node) {
      if (node.callee.type === 'Import') {
        processDynamicImport(node.arguments[0]);
      }
    }
  });
  var unambiguouslyESM = unambiguous.isModule(ast);
  if (!unambiguouslyESM && !hasDynamicImports) return null;
  var docstyle = context.settings && context.settings['import/docstyle'] || ['jsdoc'];
  var docStyleParsers = {};
  docstyle.forEach(function (style) {
    docStyleParsers[style] = availableDocStyleParsers[style];
  }); // attempt to collect module doc

  if (ast.comments) {
    ast.comments.some(function (c) {
      if (c.type !== 'Block') return false;

      try {
        var doc = _doctrine["default"].parse(c.value, {
          unwrap: true
        });

        if (doc.tags.some(function (t) {
          return t.title === 'module';
        })) {
          m.doc = doc;
          return true;
        }
      } catch (err) {
        /* ignore */
      }

      return false;
    });
  }

  var namespaces = new Map();

  function remotePath(value) {
    var file = _resolve["default"].relative(value, path, context.settings);

    try {
      return file && _fs["default"].realpath(file);
    } catch (err) {
      return file;
    }
  }

  function resolveImport(value) {
    var rp = remotePath(value);
    if (rp == null) return null;
    return ExportMap["for"](childContext(rp, context));
  }

  function getNamespace(identifier) {
    if (!namespaces.has(identifier.name)) return;
    return function () {
      return resolveImport(namespaces.get(identifier.name));
    };
  }

  function addNamespace(object, identifier) {
    var nsfn = getNamespace(identifier);

    if (nsfn) {
      Object.defineProperty(object, 'namespace', {
        get: nsfn
      });
    }

    return object;
  }

  function processSpecifier(s, n, m) {
    var nsource = n.source && n.source.value;
    var exportMeta = {};
    var local;

    switch (s.type) {
      case 'ExportDefaultSpecifier':
        if (!nsource) return;
        local = 'default';
        break;

      case 'ExportNamespaceSpecifier':
        m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', {
          get: function get() {
            return resolveImport(nsource);
          }
        }));
        return;

      case 'ExportAllDeclaration':
        m.namespace.set(s.exported.name || s.exported.value, addNamespace(exportMeta, s.source.value));
        return;

      case 'ExportSpecifier':
        if (!n.source) {
          m.namespace.set(s.exported.name || s.exported.value, addNamespace(exportMeta, s.local));
          return;
        }

      // else falls through

      default:
        local = s.local.name;
        break;
    } // todo: JSDoc


    m.reexports.set(s.exported.name, {
      local: local,
      getImport: function getImport() {
        return resolveImport(nsource);
      }
    });
  }

  function captureDependency(_ref, isOnlyImportingTypes) {
    var source = _ref.source;
    var importedSpecifiers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Set();
    if (source == null) return null;
    var p = remotePath(source.value);
    if (p == null) return null;
    var declarationMetadata = {
      // capturing actual node reference holds full AST in memory!
      source: {
        value: source.value,
        loc: source.loc
      },
      isOnlyImportingTypes: isOnlyImportingTypes,
      importedSpecifiers: importedSpecifiers
    };
    var existing = m.imports.get(p);

    if (existing != null) {
      existing.declarations.add(declarationMetadata);
      return existing.getter;
    }

    var getter = thunkFor(p, context);
    m.imports.set(p, {
      getter: getter,
      declarations: new Set([declarationMetadata])
    });
    return getter;
  }

  var source = makeSourceCode(content, ast);

  function readTsConfig() {
    var tsConfigInfo = (0, _tsconfigLoader.tsConfigLoader)({
      cwd: context.parserOptions && context.parserOptions.tsconfigRootDir || process.cwd(),
      getEnv: function getEnv(key) {
        return process.env[key];
      }
    });

    try {
      if (tsConfigInfo.tsConfigPath !== undefined) {
        // Projects not using TypeScript won't have `typescript` installed.
        if (!ts) {
          ts = require('typescript');
        }

        var configFile = ts.readConfigFile(tsConfigInfo.tsConfigPath, ts.sys.readFile);
        return ts.parseJsonConfigFileContent(configFile.config, ts.sys, (0, _path.dirname)(tsConfigInfo.tsConfigPath));
      }
    } catch (e) {// Catch any errors
    }

    return null;
  }

  function isEsModuleInterop() {
    var cacheKey = (0, _hash.hashObject)({
      tsconfigRootDir: context.parserOptions && context.parserOptions.tsconfigRootDir
    }).digest('hex');
    var tsConfig = tsConfigCache.get(cacheKey);

    if (typeof tsConfig === 'undefined') {
      tsConfig = readTsConfig(context);
      tsConfigCache.set(cacheKey, tsConfig);
    }

    return tsConfig && tsConfig.options ? tsConfig.options.esModuleInterop : false;
  }

  ast.body.forEach(function (n) {
    if (n.type === 'ExportDefaultDeclaration') {
      var exportMeta = captureDoc(source, docStyleParsers, n);

      if (n.declaration.type === 'Identifier') {
        addNamespace(exportMeta, n.declaration);
      }

      m.namespace.set('default', exportMeta);
      return;
    }

    if (n.type === 'ExportAllDeclaration') {
      var getter = captureDependency(n, n.exportKind === 'type');
      if (getter) m.dependencies.add(getter);

      if (n.exported) {
        processSpecifier(n, n.exported, m);
      }

      return;
    } // capture namespaces in case of later export


    if (n.type === 'ImportDeclaration') {
      // import type { Foo } (TS and Flow)
      var declarationIsType = n.importKind === 'type'; // import './foo' or import {} from './foo' (both 0 specifiers) is a side effect and
      // shouldn't be considered to be just importing types

      var specifiersOnlyImportingTypes = n.specifiers.length;
      var importedSpecifiers = new Set();
      n.specifiers.forEach(function (specifier) {
        if (supportedImportTypes.has(specifier.type)) {
          importedSpecifiers.add(specifier.type);
        }

        if (specifier.type === 'ImportSpecifier') {
          importedSpecifiers.add(specifier.imported.name || specifier.imported.value);
        } // import { type Foo } (Flow)


        specifiersOnlyImportingTypes = specifiersOnlyImportingTypes && specifier.importKind === 'type';
      });
      captureDependency(n, declarationIsType || specifiersOnlyImportingTypes, importedSpecifiers);
      var ns = n.specifiers.find(function (s) {
        return s.type === 'ImportNamespaceSpecifier';
      });

      if (ns) {
        namespaces.set(ns.local.name, n.source.value);
      }

      return;
    }

    if (n.type === 'ExportNamedDeclaration') {
      // capture declaration
      if (n.declaration != null) {
        switch (n.declaration.type) {
          case 'FunctionDeclaration':
          case 'ClassDeclaration':
          case 'TypeAlias': // flowtype with babel-eslint parser

          case 'InterfaceDeclaration':
          case 'DeclareFunction':
          case 'TSDeclareFunction':
          case 'TSEnumDeclaration':
          case 'TSTypeAliasDeclaration':
          case 'TSInterfaceDeclaration':
          case 'TSAbstractClassDeclaration':
          case 'TSModuleDeclaration':
            m.namespace.set(n.declaration.id.name, captureDoc(source, docStyleParsers, n));
            break;

          case 'VariableDeclaration':
            n.declaration.declarations.forEach(function (d) {
              return recursivePatternCapture(d.id, function (id) {
                return m.namespace.set(id.name, captureDoc(source, docStyleParsers, d, n));
              });
            });
            break;
        }
      }

      n.specifiers.forEach(function (s) {
        return processSpecifier(s, n, m);
      });
    }

    var exports = ['TSExportAssignment'];

    if (isEsModuleInteropTrue) {
      exports.push('TSNamespaceExportDeclaration');
    } // This doesn't declare anything, but changes what's being exported.


    if ((0, _arrayIncludes["default"])(exports, n.type)) {
      var exportedName = n.type === 'TSNamespaceExportDeclaration' ? (n.id || n.name).name : n.expression && n.expression.name || n.expression.id && n.expression.id.name || null;
      var declTypes = ['VariableDeclaration', 'ClassDeclaration', 'TSDeclareFunction', 'TSEnumDeclaration', 'TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'TSAbstractClassDeclaration', 'TSModuleDeclaration'];
      var exportedDecls = ast.body.filter(function (_ref2) {
        var type = _ref2.type,
            id = _ref2.id,
            declarations = _ref2.declarations;
        return (0, _arrayIncludes["default"])(declTypes, type) && (id && id.name === exportedName || declarations && declarations.find(function (d) {
          return d.id.name === exportedName;
        }));
      });

      if (exportedDecls.length === 0) {
        // Export is not referencing any local declaration, must be re-exporting
        m.namespace.set('default', captureDoc(source, docStyleParsers, n));
        return;
      }

      if (isEsModuleInteropTrue // esModuleInterop is on in tsconfig
      && !m.namespace.has('default') // and default isn't added already
      ) {
        m.namespace.set('default', {}); // add default export
      }

      exportedDecls.forEach(function (decl) {
        if (decl.type === 'TSModuleDeclaration') {
          if (decl.body && decl.body.type === 'TSModuleDeclaration') {
            m.namespace.set(decl.body.id.name, captureDoc(source, docStyleParsers, decl.body));
          } else if (decl.body && decl.body.body) {
            decl.body.body.forEach(function (moduleBlockNode) {
              // Export-assignment exports all members in the namespace,
              // explicitly exported or not.
              var namespaceDecl = moduleBlockNode.type === 'ExportNamedDeclaration' ? moduleBlockNode.declaration : moduleBlockNode;

              if (!namespaceDecl) {// TypeScript can check this for us; we needn't
              } else if (namespaceDecl.type === 'VariableDeclaration') {
                namespaceDecl.declarations.forEach(function (d) {
                  return recursivePatternCapture(d.id, function (id) {
                    return m.namespace.set(id.name, captureDoc(source, docStyleParsers, decl, namespaceDecl, moduleBlockNode));
                  });
                });
              } else {
                m.namespace.set(namespaceDecl.id.name, captureDoc(source, docStyleParsers, moduleBlockNode));
              }
            });
          }
        } else {
          // Export as default
          m.namespace.set('default', captureDoc(source, docStyleParsers, decl));
        }
      });
    }
  });

  if (isEsModuleInteropTrue // esModuleInterop is on in tsconfig
  && m.namespace.size > 0 // anything is exported
  && !m.namespace.has('default') // and default isn't added already
  ) {
    m.namespace.set('default', {}); // add default export
  }

  if (unambiguouslyESM) {
    m.parseGoal = 'Module';
  }

  return m;
};
/**
 * The creation of this closure is isolated from other scopes
 * to avoid over-retention of unrelated variables, which has
 * caused memory leaks. See #1266.
 */


function thunkFor(p, context) {
  return function () {
    return ExportMap["for"](childContext(p, context));
  };
}
/**
 * Traverse a pattern/identifier node, calling 'callback'
 * for each leaf identifier.
 * @param  {node}   pattern
 * @param  {Function} callback
 * @return {void}
 */


function recursivePatternCapture(pattern, callback) {
  switch (pattern.type) {
    case 'Identifier':
      // base case
      callback(pattern);
      break;

    case 'ObjectPattern':
      pattern.properties.forEach(function (p) {
        if (p.type === 'ExperimentalRestProperty' || p.type === 'RestElement') {
          callback(p.argument);
          return;
        }

        recursivePatternCapture(p.value, callback);
      });
      break;

    case 'ArrayPattern':
      pattern.elements.forEach(function (element) {
        if (element == null) return;

        if (element.type === 'ExperimentalRestProperty' || element.type === 'RestElement') {
          callback(element.argument);
          return;
        }

        recursivePatternCapture(element, callback);
      });
      break;

    case 'AssignmentPattern':
      callback(pattern.left);
      break;
  }
}
/**
 * don't hold full context object in memory, just grab what we need.
 */


function childContext(path, context) {
  var settings = context.settings,
      parserOptions = context.parserOptions,
      parserPath = context.parserPath;
  return {
    settings: settings,
    parserOptions: parserOptions,
    parserPath: parserPath,
    path: path
  };
}
/**
 * sometimes legacy support isn't _that_ hard... right?
 */


function makeSourceCode(text, ast) {
  if (_eslint.SourceCode.length > 1) {
    // ESLint 3
    return new _eslint.SourceCode(text, ast);
  } // ESLint 4, 5


  return new _eslint.SourceCode({
    text: text,
    ast: ast
  });
}