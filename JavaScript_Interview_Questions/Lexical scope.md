# Lexical Scope and the Scope Chain

## 1. What is Scope?

**Definition:** Scope is the region of code where a variable is accessible. It decides where you can and cannot use a name.

**The three scopes:**

| Scope | Definition |
|---|---|
| **Global** | Declared outside any function or block — accessible everywhere |
| **Function** | Declared inside a function — accessible only within it (`var`) |
| **Block** | Declared inside `{ }` — accessible only within it (`let`, `const`) |

```js
const globalVar = "global";              // global scope

function outer() {
  const functionVar = "function";        // function scope

  if (true) {
    const blockVar = "block";            // block scope
    console.log(globalVar, functionVar, blockVar);   // ✅ all three
  }

  console.log(blockVar);                 // ❌ ReferenceError
}
```

---

## 2. What is Lexical Scope?

**Definition:** Lexical scope (also called static scope) means a variable's accessibility is determined by **where it is physically written in the source code**, not by where or how the function is called.

**In simple words:** A function can see the variables around the place it was **written**. Moving the function elsewhere does not change what it can see.

```js
const name = "Global";

function outer() {
  const name = "Outer";

  function inner() {
    console.log(name);      // "Outer" - found in the scope where inner was WRITTEN
  }

  return inner;
}

const fn = outer();
fn();                        // "Outer", not "Global"
```

Even though `fn()` is called from the global scope, `inner` was **written** inside `outer`, so it looks there first. **The call site is irrelevant.**

> This is the opposite of `this`, which *is* decided by the call site. Scope is lexical (where written); `this` is dynamic (how called). That contrast is a common interview question.

---

## 3. The Scope Chain

**Definition:** The scope chain is the ordered list of scopes JavaScript searches when resolving a name. It looks in the current scope, then the enclosing one, and keeps going outward until it finds the variable or reaches the global scope.

```js
const level1 = "outermost";

function a() {
  const level2 = "middle";

  function b() {
    const level3 = "innermost";

    console.log(level3);    // found immediately, in b
    console.log(level2);    // not in b → found in a
    console.log(level1);    // not in b or a → found in global
    console.log(missing);   // ReferenceError - end of the chain
  }
  b();
}
```

**The search direction is one way — inward scopes see outward, never the reverse:**

```js
function outer() {
  const secret = "hidden";
}
console.log(secret);        // ❌ ReferenceError - outer scopes cannot look in
```

---

## 4. Shadowing

**Definition:** Shadowing is declaring a variable with the same name in an inner scope. The inner one "shadows" the outer, so the outer becomes unreachable within that block.

```js
const value = "outer";

function test() {
  const value = "inner";    // shadows the outer one
  console.log(value);       // "inner"
}

test();
console.log(value);         // "outer" - unchanged
```

**The TDZ makes shadowing throw if you read too early:**

```js
const x = "outer";
{
  console.log(x);           // ❌ ReferenceError, NOT "outer"
  const x = "inner";        // this declaration shadows for the WHOLE block
}
```

The inner `x` is hoisted to the top of the block, so the outer one is invisible there — proof that `const` is hoisted into the TDZ.

---

## 5. Lexical scope vs Dynamic scope

**Definition of Dynamic scope:** A model where a variable is resolved by the **call stack** rather than the source layout. JavaScript does **not** use this — but knowing the contrast makes lexical scope clear.

```js
const name = "Global";

function printName() {
  console.log(name);
}

function run() {
  const name = "Local";
  printName();              // "Global" in JavaScript (lexical)
}                           // would be "Local" under dynamic scoping

run();
```

`printName` was **written** in the global scope, so it sees the global `name` — regardless of who calls it.

---

## 6. Why lexical scope matters — closures

**Definition:** Closures exist *because* scope is lexical. A returned function keeps a reference to the scope it was written in, so that scope stays alive.

```js
function makeCounter() {
  let count = 0;            // lives in makeCounter's scope

  return function () {
    count++;                // still reachable via the scope chain
    return count;
  };
}

const counter = makeCounter();
counter();   // 1
counter();   // 2           ← the scope survived because the inner fn references it
```

Without lexical scoping, the returned function would have no way to find `count`.

---

## 7. Practical consequences

**Module pattern — privacy comes from scope:**

```js
const bank = (function () {
  let balance = 0;                       // unreachable from outside

  return {
    deposit: (n) => (balance += n),
    getBalance: () => balance,
  };
})();

bank.deposit(100);
console.log(bank.getBalance());   // 100
console.log(bank.balance);        // undefined ← genuinely private
```

**Avoiding global pollution:**

```js
// ❌ Top-level var attaches to window and can collide with other scripts
var config = {};

// ✅ Contained in a module or block scope
const config = {};
```

---

## 8. Common mistakes

```js
// 1. Expecting var to be block-scoped
if (true) { var leaked = "escapes"; }
console.log(leaked);       // "escapes" - var ignores blocks

// 2. Assuming the call site decides scope
function f() { console.log(x); }
function g() { const x = 1; f(); }
g();                       // ReferenceError - f cannot see g's x

// 3. Accidental global from a missing declaration
function bad() {
  undeclared = 5;          // creates a GLOBAL (throws in strict mode)
}
```

Enable `"use strict"` — or use ES modules, which are strict by default — to turn mistake 3 into an error.

---

## Key points

- **Scope** is where a variable is accessible; JavaScript has global, function and block scope.
- **Lexical scope** means accessibility is decided by where code is **written**, not where it is called.
- The **scope chain** searches inner → outer, and never the reverse.
- **Shadowing** hides an outer variable; with `let`/`const` the TDZ applies to the whole block.
- Scope is **lexical**, but `this` is **dynamic** — a frequently tested contrast.
- **Closures work because of lexical scope** — the referenced scope stays alive.
- Undeclared assignments create globals unless you are in strict mode.

**Related:** [Closure.md](Closure.md) · [Hoisting.md](Hoisting.md) · [LetConstVar.md](LetConstVar.md) · [this.md](this.md)
