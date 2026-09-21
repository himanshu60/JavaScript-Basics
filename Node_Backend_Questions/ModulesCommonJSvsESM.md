# Node.js Modules - CommonJS vs ES Modules

## 1. What is a Module?

**Definition:** A module is a single file of JavaScript with its own **private scope**. Variables declared inside it are not global — they are only visible to that file unless you explicitly export them.

**Why modules exist:** without them, every script shares one global scope, and variables silently overwrite each other.

Node supports two module systems: **CommonJS (CJS)** — the original — and **ES Modules (ESM)** — the modern JavaScript standard.

---

## 2. CommonJS (CJS)

**Definition:** Node's original module system. It uses `require()` to import and `module.exports` to export. Loading is **synchronous**.

```js
// math.js - exporting
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }

module.exports = { add, subtract };
// or individually:
exports.add = add;
exports.subtract = subtract;

// Exporting a single thing
module.exports = add;
```

```js
// app.js - importing
const { add, subtract } = require("./math");
const math = require("./math");
const fs = require("fs");              // built-in module
const express = require("express");    // from node_modules
```

### `module.exports` vs `exports`

**Definition:** `exports` is just a **reference** to `module.exports`. Reassigning `exports` breaks that link and exports nothing.

```js
// ✅ Works - modifying the object both names point to
exports.add = add;

// ❌ BROKEN - reassigns the local variable, breaking the link
exports = { add };

// ✅ Correct way to replace the whole export
module.exports = { add };
```

---

## 3. ES Modules (ESM)

**Definition:** The official JavaScript module standard, using `import` and `export`. Loading is **asynchronous**, and imports are resolved **statically** before the code runs.

```js
// math.mjs - exporting
export function add(a, b) { return a + b; }
export const PI = 3.14;

export default function multiply(a, b) { return a * b; }   // default export
```

```js
// app.mjs - importing
import multiply, { add, PI } from "./math.mjs";   // default + named
import * as math from "./math.mjs";               // everything as an object
import { add as sum } from "./math.mjs";          // renaming

// Dynamic import - returns a Promise, works anywhere
const math = await import("./math.mjs");
```

---

## 4. How to enable ES Modules in Node

**Three ways:**

```json
// 1. package.json - makes ALL .js files in the project ESM
{
  "type": "module"
}
```

```
// 2. File extension
file.mjs   → always ESM
file.cjs   → always CommonJS
```

```js
// 3. Dynamic import works in CommonJS too
const { default: fetch } = await import("node-fetch");
```

---

## 5. Full comparison

| Point | CommonJS | ES Modules |
|---|---|---|
| **Import syntax** | `require()` | `import` |
| **Export syntax** | `module.exports` | `export` / `export default` |
| **Loading** | **Synchronous** | **Asynchronous** |
| **Resolved** | At **runtime** | At **parse time** (static) |
| **Conditional import** | ✅ `if (x) require(...)` | ❌ Only via `await import()` |
| **Top-level `await`** | ❌ No | ✅ Yes |
| **Tree shaking** | ❌ Hard | ✅ Yes (static analysis) |
| **`__dirname` / `__filename`** | ✅ Available | ❌ Must be derived |
| **File extension in imports** | Optional | **Required** (`./math.js`) |
| **JSON import** | ✅ `require("./a.json")` | Needs an import attribute |
| **Can import the other type** | Only via dynamic `import()` | ✅ Can `import` CJS |
| **Default in Node** | Yes (unless `"type": "module"`) | No |
| **Browser support** | ❌ Needs a bundler | ✅ Native |

---

## 6. Key differences in practice

### a) `__dirname` does not exist in ESM

```js
// CommonJS
console.log(__dirname);

// ESM equivalent
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Node 20.11+ has a shortcut
console.log(import.meta.dirname);
```

### b) File extensions are mandatory in ESM

```js
require("./math");        // ✅ CJS resolves this automatically
import "./math";          // ❌ ERR_MODULE_NOT_FOUND
import "./math.js";       // ✅ must include the extension
```

### c) Top-level `await` works only in ESM

```js
// ESM - allowed at the top level of the file
const data = await fetch("https://api.com").then((r) => r.json());

// CJS - must be wrapped in an async IIFE
(async () => {
  const data = await fetch("https://api.com");
})();
```

### d) Conditional loading

```js
// CJS - require can be called anywhere, conditionally
if (process.env.NODE_ENV === "development") {
  const devTools = require("./dev-tools");
}

// ESM - import is static and hoisted; use dynamic import instead
if (process.env.NODE_ENV === "development") {
  const devTools = await import("./dev-tools.js");
}
```

### e) Mixing the two

```js
// ESM importing CommonJS - works (named exports may be limited)
import express from "express";      // ✅ CJS default export

// CommonJS importing ESM - only dynamically
const esmModule = await import("./module.mjs");   // ✅
const esmModule = require("./module.mjs");        // ❌ ERR_REQUIRE_ESM
```

> The `ERR_REQUIRE_ESM` error is one of the most common Node errors — it means a package went ESM-only and your project is still CommonJS.

---

## 7. Module caching

**Definition:** Node **caches** a module after its first load. Requiring it again returns the **same object** — the file is not executed a second time. This is what makes the singleton pattern work.

```js
// counter.js
let count = 0;
module.exports = {
  increment: () => ++count,
  get: () => count,
};

// a.js
const counter = require("./counter");
counter.increment();

// b.js
const counter = require("./counter");
console.log(counter.get());     // 1 - the SAME instance, not a fresh one
```

```js
// Inspecting and clearing the cache
console.log(require.cache);
delete require.cache[require.resolve("./module")];   // force a re-load
```

**A practical use — a database connection singleton:**

```js
// db.js - connect only once, reuse everywhere
let connection = null;

module.exports = async function getConnection() {
  if (!connection) connection = await createConnection();
  return connection;
};
```

---

## 8. Module resolution — how `require` finds a file

**Definition:** The algorithm Node follows to turn `require("x")` into an actual file path.

```js
require("fs")              // 1. Is it a core module? → use it
require("./utils")         // 2. Relative path → ./utils.js, ./utils.json,
                           //    ./utils.node, ./utils/index.js
require("express")         // 3. node_modules lookup, walking UP the tree:
                           //    ./node_modules/express
                           //    ../node_modules/express
                           //    ../../node_modules/express ... until root
```

**The module wrapper:** Node wraps every CommonJS file in a function, which is why `module`, `exports`, `__dirname`, `__filename` and `require` exist without being declared:

```js
(function (exports, require, module, __filename, __dirname) {
  // your file's code goes here
});
```

This wrapper is also what gives every module its **private scope**.

---

## 9. Which should you use?

**Use ES Modules for new projects:**
- It is the official JavaScript standard
- Tree shaking produces smaller bundles
- Top-level `await`
- The same syntax works in the browser and in Node
- Most modern packages are moving to ESM-only

**CommonJS is still fine when:**
- You are maintaining an existing CJS codebase
- A dependency you need is CJS-only
- You need conditional `require()` in many places

```json
// A modern package.json supporting both
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

---

## Key points

- A module has its own **private scope**; nothing leaks to global.
- **CommonJS**: `require`/`module.exports`, synchronous, runtime-resolved, has `__dirname`.
- **ESM**: `import`/`export`, asynchronous, statically analysed, supports top-level `await` and tree shaking.
- `exports.x = y` works, but `exports = {...}` silently breaks the export.
- ESM requires **file extensions** in relative imports.
- Modules are **cached** — repeated `require` returns the same instance (the singleton pattern).
- ESM can import CJS; CJS can only load ESM through dynamic `import()`.
- Use **ESM for new projects**.
