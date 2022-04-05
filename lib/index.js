"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rules = exports.meta = void 0;

var _resolve = _interopRequireDefault(require("eslint-module-utils/resolve"));

var _moduleVisitor = _interopRequireDefault(require("eslint-module-utils/moduleVisitor"));

var _fs = _interopRequireDefault(require("fs"));

var _ExportMap = _interopRequireDefault(require("./ExportMap"));

var _importType = _interopRequireDefault(require("./core/importType"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var meta = {
  type: "suggestion",
  docs: {
    description: "Ensures that there is no resolvable path back to this module via its dependencies.",
    category: "Possible Errors",
    recommended: true,
    url: "https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md"
  }
};
exports.meta = meta;
var rules = {
  'no-cycle': {
    create: function create(context) {
      var tsconfig = JSON.parse(_fs["default"].readFileSync("".concat(process.cwd(), "/tsconfig.json")).toString('utf8') || '{}');
      var aliases = tsconfig && tsconfig.compilerOptions && tsconfig.compilerOptions.paths || {};
      var myPath = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
      if (myPath === '<text>') return {}; // can't cycle-check a non-file

      var options = context.options[0] || {};
      var maxDepth = typeof options.maxDepth === 'number' ? options.maxDepth : Infinity;

      var ignoreModule = function ignoreModule(name) {
        return options.ignoreExternal && _importType["default"].isExternalModule(name, (0, _resolve["default"])(name, context), context);
      };

      function checkSourceValue(sourceNode, importer) {
        if (ignoreModule(sourceNode.value)) {
          return; // ignore external modules
        }

        if (importer.type === 'ImportDeclaration' && ( // import type { Foo } (TS and Flow)
        importer.importKind === 'type' // import { type Foo } (Flow)
        || importer.specifiers.every(function (_ref) {
          var importKind = _ref.importKind;
          return importKind === 'type';
        }))) {
          return; // ignore type imports
        }

        var imported = _ExportMap["default"].get(sourceNode.value, context, aliases);

        if (imported == null) {
          return; // no-unresolved territory
        }

        if (imported.path === myPath) {
          return; // no-self-import territory
        }

        var untraversed = [{
          mget: function mget() {
            return imported;
          },
          route: []
        }];
        var traversed = new Set();

        function detectCycle(_ref2) {
          var mget = _ref2.mget,
              route = _ref2.route;
          var m = mget();
          if (m == null) return;
          if (traversed.has(m.path)) return;
          traversed.add(m.path);

          var _iterator = _createForOfIteratorHelper(m.imports),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var _step$value = _slicedToArray(_step.value, 2),
                  path = _step$value[0],
                  _step$value$ = _step$value[1],
                  getter = _step$value$.getter,
                  declarations = _step$value$.declarations;

              if (traversed.has(path)) continue;

              var toTraverse = _toConsumableArray(declarations).filter(function (_ref3) {
                var source = _ref3.source,
                    isOnlyImportingTypes = _ref3.isOnlyImportingTypes;
                return !ignoreModule(source.value) // Ignore only type imports
                && !isOnlyImportingTypes;
              });
              /*
                  Only report as a cycle if there are any import declarations that are considered by
                  the rule. For example:
                   a.ts:
                  import { foo } from './b' // should not be reported as a cycle
                   b.ts:
                  import type { Bar } from './a'
                  */


              if (path === myPath && toTraverse.length > 0) return true;

              if (route.length + 1 < maxDepth) {
                var _iterator2 = _createForOfIteratorHelper(toTraverse),
                    _step2;

                try {
                  for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                    var source = _step2.value.source;
                    untraversed.push({
                      mget: getter,
                      route: route.concat(source)
                    });
                  }
                } catch (err) {
                  _iterator2.e(err);
                } finally {
                  _iterator2.f();
                }
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }

        while (untraversed.length > 0) {
          var next = untraversed.shift(); // bfs!

          if (detectCycle(next)) {
            var message = next.route.length > 0 ? "Dependency cycle via ".concat(routeString(next.route)) : 'Dependency cycle detected.';
            context.report(importer, message);
            return;
          }
        }
      }

      return (0, _moduleVisitor["default"])(checkSourceValue, context.options[0]);
    }
  }
};
exports.rules = rules;