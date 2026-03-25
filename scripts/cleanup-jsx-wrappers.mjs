import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generatorModule from "@babel/generator";
import * as t from "@babel/types";

const traverse = traverseModule.default;
const generate = generatorModule.default;

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && /\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function cleanupFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  if (!code.includes("{<")) return false;

  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  let changed = false;

  traverse(ast, {
    JSXExpressionContainer(path) {
      const expression = path.node.expression;
      const parent = path.parentPath;
      if (!parent) return;

      const inChildrenArray = parent.isJSXElement() || parent.isJSXFragment();
      if (!inChildrenArray) return;

      if (t.isJSXElement(expression) || t.isJSXFragment(expression) || t.isJSXText(expression)) {
        path.replaceWith(expression);
        changed = true;
      }
    },
  });

  if (!changed) return false;

  const output = generate(ast, { retainLines: false }).code;
  fs.writeFileSync(filePath, `${output}\n`, "utf8");
  return true;
}

const files = walk(path.resolve(process.cwd(), "src"));
let count = 0;
for (const file of files) {
  if (cleanupFile(file)) count += 1;
}

console.log(`Cleaned wrappers in ${count} file(s).`);
