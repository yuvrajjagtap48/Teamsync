import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generatorModule from "@babel/generator";
import * as t from "@babel/types";

const traverse = traverseModule.default;
const generate = generatorModule.default;

function toJSXTagName(node) {
  if (t.isStringLiteral(node)) return t.jsxIdentifier(node.value);
  if (t.isIdentifier(node)) return t.jsxIdentifier(node.name);
  if (t.isMemberExpression(node)) {
    return t.jsxMemberExpression(toJSXTagName(node.object), toJSXTagName(node.property));
  }
  return null;
}

function toJSXChild(node) {
  if (t.isStringLiteral(node)) return t.jsxText(node.value);
  if (t.isJSXElement(node) || t.isJSXFragment(node) || t.isJSXText(node)) return node;
  return t.jsxExpressionContainer(node);
}

function convertJsxRuntimeCall(node) {
  const [typeArg, propsArg, keyArg] = node.arguments;
  const tagName = toJSXTagName(typeArg);
  if (!tagName || !propsArg || !t.isObjectExpression(propsArg)) return null;

  const attrs = [];
  const children = [];

  for (const prop of propsArg.properties) {
    if (t.isSpreadElement(prop)) {
      attrs.push(t.jsxSpreadAttribute(prop.argument));
      continue;
    }

    if (!t.isObjectProperty(prop)) continue;

    const keyName = t.isIdentifier(prop.key)
      ? prop.key.name
      : t.isStringLiteral(prop.key)
        ? prop.key.value
        : null;

    if (!keyName) continue;

    if (keyName === "children") {
      if (t.isArrayExpression(prop.value)) {
        for (const child of prop.value.elements) {
          if (!child) continue;
          children.push(toJSXChild(child));
        }
      } else {
        children.push(toJSXChild(prop.value));
      }
      continue;
    }

    if (t.isStringLiteral(prop.value)) {
      attrs.push(t.jsxAttribute(t.jsxIdentifier(keyName), t.stringLiteral(prop.value.value)));
    } else if (t.isJSXElement(prop.value) || t.isJSXFragment(prop.value)) {
      attrs.push(
        t.jsxAttribute(t.jsxIdentifier(keyName), t.jsxExpressionContainer(prop.value)),
      );
    } else {
      attrs.push(
        t.jsxAttribute(t.jsxIdentifier(keyName), t.jsxExpressionContainer(prop.value)),
      );
    }
  }

  if (keyArg && !attrs.some((a) => t.isJSXAttribute(a) && a.name.name === "key")) {
    attrs.push(t.jsxAttribute(t.jsxIdentifier("key"), t.jsxExpressionContainer(keyArg)));
  }

  const opening = t.jsxOpeningElement(tagName, attrs, children.length === 0);
  const closing = children.length === 0 ? null : t.jsxClosingElement(tagName);
  return t.jsxElement(opening, closing, children, false);
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  if (!code.includes("react/jsx-runtime")) return false;

  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  let jsxAliases = new Set();

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value !== "react/jsx-runtime") return;
      for (const specifier of path.node.specifiers) {
        if (t.isImportSpecifier(specifier)) jsxAliases.add(specifier.local.name);
      }
      path.remove();
    },
  });

  if (jsxAliases.size === 0) return false;

  let changed = false;

  traverse(ast, {
    CallExpression(path) {
      if (!t.isIdentifier(path.node.callee)) return;
      if (!jsxAliases.has(path.node.callee.name)) return;

      const replacement = convertJsxRuntimeCall(path.node);
      if (!replacement) return;

      path.replaceWith(replacement);
      changed = true;
    },
  });

  if (!changed) return false;

  const output = generate(ast, { retainLines: false }).code;
  fs.writeFileSync(filePath, `${output}\n`, "utf8");
  return true;
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && /\.(js|jsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const root = path.resolve(process.cwd(), "src");
const files = walk(root);
let converted = 0;

for (const file of files) {
  if (processFile(file)) converted += 1;
}

console.log(`Converted ${converted} file(s).`);
