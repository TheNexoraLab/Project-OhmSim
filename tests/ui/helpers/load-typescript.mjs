import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Test adapter for actual installed TS modules and @/ imports. No copied logic.
export function createLoader(root) {
  const req = createRequire(path.join(root, "package.json"));
  const ts = req("typescript");
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = createRequire(filename);
    function resolve(name) {
      if (!name.startsWith("@/") && !name.startsWith(".")) return localRequire(name);
      const base = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      const target = [base, base + ".ts", base + ".tsx", base + ".js"].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
      if (!target) throw new Error("Cannot resolve " + name);
      return load(target);
    }
    new Function("require", "module", "exports", code)(resolve, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return relative => load(path.join(root, relative));
};
