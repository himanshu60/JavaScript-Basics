# Hoisting in JavaScript

## 1. What is Hoisting?

**Definition:** Hoisting is JavaScript's behaviour of moving **declarations** to the top of their scope during the compilation phase, before any code runs. Only the declaration moves — **not** the assigned value.

**In simple words:** Before running your code, JavaScript scans it and notes down every variable and function name. So the names already exist when execution starts, even if their values do not.

**Why it happens:** JavaScript runs in two phases.

| Phase | What happens |
|---|---|
| **1. Creation (compilation)** | Scope is set up; declarations are registered in memory |
| **2. Execution** | Code runs line by line; assignments happen |

---

## 2. Hoisting with `var`

**Definition:** A `var` declaration is hoisted **and** automatically initialised with `undefined`. So reading it before its line gives `undefined` rather than an error.

```js
console.log(x);   // undefined  ← not an error
var x = 10;
console.log(x);   // 10
```

**What JavaScript actually does:**

```js
var x;            // ← declaration hoisted, initialised as undefined
console.log(x);   // undefined
x = 10;           // ← assignment stays where you wrote it
console.log(x);   // 10
```

---

## 3. Hoisting with `let` and `const` — the TDZ

**Definition:** `let` and `const` **are** hoisted, but they are **not** initialised. From the start of the scope until their declaration line, they sit in the **Temporal Dead Zone (TDZ)** — they exist but cannot be accessed.

```js
console.log(a);   // ReferenceError: Cannot access 'a' before initialization
let a = 10;

console.log(b);   // ReferenceError
const b = 20;
```

> The common claim that "`let` and `const` are not hoisted" is **wrong**. They are hoisted — that is exactly why you get a specific `ReferenceError` about initialisation rather than a generic "b is not defined".

**Proof they are hoisted:**

```js
let x = "outer";
{
  console.log(x);   // ReferenceError - NOT "outer"
  let x = "inner";  // this declaration was hoisted into the block,
}                   // shadowing the outer x for the whole block
```

If `let` were not hoisted, the first log would find the outer `x`.

---

## 4. Function hoisting

**Definition:** A **function declaration** is hoisted completely, body included, so you can call it before it appears. A **function expression** only hoists the variable, following `var`/`let` rules.

```js
sayHi();                       // "Hi!" ← works
function sayHi() {
  console.log("Hi!");
}

sayBye();                      // TypeError: sayBye is not a function
var sayBye = function () {     // only "var sayBye" was hoisted, as undefined
  console.log("Bye!");
};

sayHello();                    // ReferenceError (TDZ)
const sayHello = () => {};     // arrow functions are expressions too
```

**Note the different errors** — that distinction is a favourite interview question:

| Code | Error | Why |
|---|---|---|
| `sayBye()` with `var sayBye = fn` | **TypeError** | `sayBye` exists but is `undefined`, and `undefined()` is not a function |
| `sayHello()` with `const sayHello = fn` | **ReferenceError** | The name is in the TDZ and cannot be touched at all |

---

## 5. Order of precedence

**Definition:** When a function and a variable share a name, the **function declaration wins** during hoisting — but a later assignment still overwrites it at runtime.

```js
console.log(typeof foo);   // "function" ← function declaration wins

var foo = "I am a string";
function foo() {}

console.log(typeof foo);   // "string"  ← the assignment ran
```

---

## 6. Hoisting is per scope, not global

**Definition:** Declarations hoist to the top of their **own** scope — a function scope for `var`, a block scope for `let`/`const`.

```js
function example() {
  console.log(x);   // undefined - hoisted within THIS function only
  var x = 5;
}
console.log(x);     // ReferenceError - x never existed out here
```

```js
// var is NOT block-scoped - it escapes the if
if (true) {
  var leaked = "I escape";
  let contained = "I stay";
}
console.log(leaked);     // "I escape"
console.log(contained);  // ReferenceError
```

---

## 7. Classes are hoisted but unusable

```js
const p = new Person();   // ReferenceError - classes sit in the TDZ too
class Person {}
```

---

## 8. Summary table

| Declaration | Hoisted? | Initialised on hoist | Access before declaration |
|---|---|---|---|
| `var` | ✅ | `undefined` | `undefined` |
| `let` | ✅ | ❌ (TDZ) | **ReferenceError** |
| `const` | ✅ | ❌ (TDZ) | **ReferenceError** |
| Function declaration | ✅ | Fully, with body | **Works** |
| Function expression | Follows its variable | — | TypeError or ReferenceError |
| Arrow function | Follows its variable | — | TypeError or ReferenceError |
| `class` | ✅ | ❌ (TDZ) | **ReferenceError** |

---

## 9. How to avoid hoisting bugs entirely

1. Use **`const` by default**, `let` when you must reassign, and **never `var`**
2. Declare variables at the **top** of their scope
3. Define functions before you use them, for readability
4. Turn on ESLint's `no-use-before-define`

The TDZ exists specifically to catch these mistakes. With `var`, a typo silently gives `undefined` and the real error surfaces far away. With `let`, it fails immediately on the offending line.

```js
// var hides the bug
var total;
console.log(total * 2);   // NaN ← where did this come from?
total = 10;

// let exposes it
console.log(sum * 2);     // ReferenceError on this exact line
let sum = 10;
```

---

## Key points

- Hoisting moves **declarations**, never assignments.
- `var` hoists and becomes `undefined`; `let`/`const`/`class` hoist into the **TDZ**.
- "`let` is not hoisted" is a myth — it is hoisted but uninitialised.
- **Function declarations** hoist fully and can be called early; function expressions cannot.
- Calling a hoisted `var` function expression gives a **TypeError**; a `const` one gives a **ReferenceError**.
- Hoisting applies to the **current scope** only.
- Use `const`/`let` and declare at the top to make hoisting irrelevant.

**Related:** [IIFE-And-TDZ.md](IIFE-And-TDZ.md) · [LetConstVar.md](LetConstVar.md) · [Lexical scope.md](Lexical%20scope.md)
