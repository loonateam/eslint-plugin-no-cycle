
import resolve from 'eslint-module-utils/resolve'
import moduleVisitor from 'eslint-module-utils/moduleVisitor'
import fs from 'fs';
import Exports from './ExportMap';
import importType from './core/importType';

export const meta = {
  type: "suggestion",
  docs: {
      description: "Ensures that there is no resolvable path back to this module via its dependencies.",
      category: "Possible Errors",
      recommended: true,
      url: "https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md"
  },
}

export const rules = {
  'no-cycle': {
    create(context) {
      const tsconfig = JSON.parse(fs.readFileSync(`${process.cwd()}/tsconfig.json`).toString('utf8') || '{}');
      const aliases = tsconfig && tsconfig.compilerOptions && tsconfig.compilerOptions.paths || {};

      const myPath = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
      if (myPath === '<text>') return {}; // can't cycle-check a non-file

      const options = context.options[0] || {};
      const maxDepth = typeof options.maxDepth === 'number' ? options.maxDepth : Infinity;
      const ignoreModule = (name) => options.ignoreExternal && importType.isExternalModule(
        name,
        resolve(name, context),
        context,
      );

      function checkSourceValue(sourceNode, importer) {
        if (ignoreModule(sourceNode.value)) {
          return; // ignore external modules
        }

        if (
          importer.type === 'ImportDeclaration' && (
            // import type { Foo } (TS and Flow)
            importer.importKind === 'type'
                  // import { type Foo } (Flow)
                  || importer.specifiers.every(({ importKind }) => importKind === 'type')
          )
        ) {
          return; // ignore type imports
        }

        const imported = Exports.get(sourceNode.value, context, aliases);

        if (imported == null) {
          return; // no-unresolved territory
        }

        if (imported.path === myPath) {
          return; // no-self-import territory
        }

        const untraversed = [{ mget: () => imported, route: [] }];
        const traversed = new Set();
        function detectCycle({ mget, route }) {
          const m = mget();
          if (m == null) return;
          if (traversed.has(m.path)) return;
          traversed.add(m.path);

          for (const [path, { getter, declarations }] of m.imports) {
            if (traversed.has(path)) continue;
            const toTraverse = [...declarations].filter(({ source, isOnlyImportingTypes }) => !ignoreModule(source.value)
                    // Ignore only type imports
                    && !isOnlyImportingTypes);
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
              for (const { source } of toTraverse) {
                untraversed.push({ mget: getter, route: route.concat(source) });
              }
            }
          }
        }

        while (untraversed.length > 0) {
          const next = untraversed.shift(); // bfs!
          if (detectCycle(next)) {
            const message = (next.route.length > 0
              ? `Dependency cycle via ${routeString(next.route)}`
              : 'Dependency cycle detected.');
            context.report(importer, message);
            return;
          }
        }
      }

      return moduleVisitor(checkSourceValue, context.options[0]);
    },
  }
}
