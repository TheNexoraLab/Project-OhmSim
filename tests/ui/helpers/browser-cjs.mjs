import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Test-only bundler for the already-installed React/TypeScript packages. No app
// route, global diagnostic bridge, copied hook implementation or new dependency.
export function browserBundle(entry, root, { stockZeroFixture = false } = {}) {
  const req = createRequire(path.join(root, "package.json"));
  const ts = req("typescript");
  const modules = new Map();
  function add(filename) {
    filename = fs.realpathSync(filename);
    if (modules.has(filename)) return;
    const record = { source: "", dependencies: {} };
    modules.set(filename, record);
    let source = fs.readFileSync(filename, "utf8");
    if (/\.tsx?$/.test(filename)) {
      source = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText;
    }
    // Select production React without traversing development-only dependencies.
    source = source.replaceAll("process.env.NODE_ENV", '"production"');
    source = source.replace(/require\(['"]\.\/cjs\/([^'"]+)\.development\.js['"]\)/g,
      'require("./cjs/$1.production.js")');
    if (stockZeroFixture && filename.endsWith(`${path.sep}catalog-service.ts`)) {
      source += `\nconst originalLookup = exports.getProductByIdSync;
        exports.getProductByIdSync = id => id === "stock-zero-test"
          ? { ...originalLookup("6"), id, stock: 0 }
          : originalLookup(id);`;
    }
    record.source = source;
    const localReq = createRequire(filename);
    for (const match of source.matchAll(/require\(["']([^"']+)["']\)/g)) {
      const name = match[1];
      let resolved;
      if (name.startsWith("@/")) {
        const base = path.join(root, name.slice(2));
        resolved = [base, `${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file));
        if (!resolved) throw new Error(`Cannot resolve ${name} in ${filename}`);
      } else {
        resolved = localReq.resolve(name);
      }
      record.dependencies[name] = fs.realpathSync(resolved);
      add(resolved);
    }
  }
  add(entry);
  const factories = [...modules].map(([id, { source, dependencies }]) =>
    `${JSON.stringify(id)}: [function(require,module,exports){\n${source}\n},${JSON.stringify(dependencies)}]`);
  return `(() => {
    const modules = {${factories.join(",\n")}}, cache = {};
    function load(id) {
      if (cache[id]) return cache[id].exports;
      const module = {exports: {}}; cache[id] = module;
      const [factory, dependencies] = modules[id];
      factory(name => load(dependencies[name]), module, module.exports);
      return module.exports;
    }
    load(${JSON.stringify(fs.realpathSync(entry))});
  })();`;
}
