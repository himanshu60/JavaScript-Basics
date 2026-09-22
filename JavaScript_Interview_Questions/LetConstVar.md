# var vs let vs const

## 1. The three declarations

**Definition of `var`:** The original way to declare a variable. It is **function-scoped**, can be re-declared and re-assigned, and is hoisted as `undefined`.

**Definition of `let`:** Introduced in ES6. It is **block-scoped**, can be re-assigned but not re-declared in the same scope, and sits in the TDZ until its declaration.

**Definition of `const`:** Also ES6 and block-scoped, but the binding **cannot be re-assigned**, and it must be initialised at declaration.

```js
var a = 1;
let b = 2;
const c = 3;
```

---

## 2. Scope — the main difference

**Definition of Function scope:** The variable is visible everywhere inside the function that declares it, regardless of blocks.
**Definition of Block scope:** The variable is visible only inside the nearest `{ }` — an `if`, a `for`, or any block.

```js
function test() {
  if (true) {
    var functionScoped = "I escape the block";
    let blockScoped = "I stay inside";
    const alsoBlockScoped = "me too";
  }

  console.log(functionScoped);   // "I escape the block"
  console.log(blockScoped);      // ❌ ReferenceError
}
```

**Why this matters — the loop problem:**

```js
// ❌ var - ONE shared variable, all callbacks see the final value
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);     // 3, 3, 3
}

// ✅ let - a NEW binding per iteration
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);     // 0, 1, 2
}
```

This is the single most quoted reason to stop using `var`.

---

## 3. Hoisting and the TDZ

**Definition:** All three are hoisted. `var` is initialised with `undefined`; `let` and `const` are **not initialised** and sit in the **Temporal Dead Zone** until their declaration line.

```js
console.log(x);   // undefined      ← var is usable, just empty
var x = 1;

console.log(y);   // ReferenceError ← let is in the TDZ
let y = 2;

console.log(z);   // ReferenceError
const z = 3;
```

> The TDZ is a feature, not a limitation. It turns a silent `undefined` bug into an immediate error on the exact line that caused it.

---

## 4. Re-declaration and re-assignment

```js
// var - both allowed (this is how bugs hide)
var a = 1;
var a = 2;        // ✅ no error - silently overwrites
a = 3;            // ✅

// let - re-assign yes, re-declare no
let b = 1;
let b = 2;        // ❌ SyntaxError: Identifier 'b' has already been declared
b = 3;            // ✅

// const - neither
const c = 1;
c = 2;            // ❌ TypeError: Assignment to constant variable
const c = 3;      // ❌ SyntaxError
const d;          // ❌ SyntaxError - must be initialised
```

**The `var` re-declaration problem in practice:**

```js
var userName = "Amit";
// ...200 lines later, in the same function...
var userName = "temp";     // silently destroyed the original, no warning
```

---

## 5. `const` does NOT mean immutable

**Definition:** `const` prevents **re-assigning the variable**. It does **not** freeze the object the variable points to.

```js
const user = { name: "Amit" };
user.name = "Priya";       // ✅ ALLOWED - changing contents
user.age = 25;             // ✅ ALLOWED - adding a property
console.log(user);         // { name: "Priya", age: 25 }

user = { name: "New" };    // ❌ TypeError - re-assigning the variable
```

```js
const nums = [1, 2, 3];
nums.push(4);              // ✅ [1, 2, 3, 4]
nums = [5];                // ❌ TypeError
```

**To actually make it immutable, use `Object.freeze`:**

```js
const config = Object.freeze({ apiUrl: "https://api.com" });
config.apiUrl = "hacked";        // silently ignored (throws in strict mode)
```

Note `Object.freeze` is **shallow** — nested objects can still be changed.

**This is the most common `const` misunderstanding in interviews.** `const` describes the **binding**, not the value.

---

## 6. Global object attachment

**Definition:** A top-level `var` becomes a property of the global object. `let` and `const` do not.

```js
var a = 1;
let b = 2;

console.log(window.a);    // 1          ← pollutes the global object
console.log(window.b);    // undefined  ← safely scoped
```

This is another way `var` causes accidental collisions between scripts.

---

## 7. Full comparison

| Feature | `var` | `let` | `const` |
|---|---|---|---|
| **Scope** | Function | Block | Block |
| Hoisted | ✅ | ✅ | ✅ |
| Initialised on hoist | `undefined` | ❌ TDZ | ❌ TDZ |
| Access before declaration | `undefined` | ReferenceError | ReferenceError |
| Re-declare in same scope | ✅ | ❌ | ❌ |
| Re-assign | ✅ | ✅ | ❌ |
| Must initialise | ❌ | ❌ | ✅ |
| Adds to `window` | ✅ | ❌ | ❌ |
| Object contents mutable | ✅ | ✅ | ✅ (still mutable!) |

---

## 8. Which should you use?

**The rule almost every team follows:**

1. **`const` by default** — most variables never need re-assigning
2. **`let`** only when you genuinely re-assign (counters, loop variables, accumulators)
3. **Never `var`**

```js
const users = await fetchUsers();     // never re-assigned → const
let total = 0;                         // will be re-assigned → let
for (const user of users) {            // const works in for...of!
  total += user.score;
}
```

**Why `const` by default:** it signals intent. A reader sees `const` and knows this value never changes anywhere below — one less thing to track.

> `for (const x of arr)` works because each iteration creates a **new** binding. Only `for (let i = 0; ...)` needs `let`, because `i++` re-assigns.

---

## Key points

- `var` is **function-scoped**; `let` and `const` are **block-scoped**.
- All three hoist, but `let`/`const` land in the **TDZ** and throw if accessed early.
- `var` allows silent re-declaration — a real source of hidden bugs.
- **`const` prevents re-assignment, not mutation.** Object contents can still change.
- Use `Object.freeze()` for actual immutability (and it is shallow).
- Top-level `var` attaches to `window`; `let`/`const` do not.
- The `var` loop problem is why `let` exists — each iteration gets a fresh binding.
- **Default to `const`, use `let` when needed, never `var`.**

**Related:** [Hoisting.md](Hoisting.md) · [IIFE-And-TDZ.md](IIFE-And-TDZ.md) · [Lexical scope.md](Lexical%20scope.md) · [PureFunctionsAndImmutability.md](PureFunctionsAndImmutability.md)
