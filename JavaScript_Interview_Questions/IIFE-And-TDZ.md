# IIFE, Hoisting and the Temporal Dead Zone (TDZ)

---

# PART 1 — IIFE

## 1. What is an IIFE?

**Definition:** IIFE stands for **Immediately Invoked Function Expression**. It is a function that is **defined and executed at the same time**, immediately after it is created.

**In simple words:** Normally you define a function now and call it later. An IIFE says: "define me and run me right now — and don't leave my variables lying around anywhere."

## 2. IIFE syntax explained

```js
(function () {
  console.log("I run immediately!");
})();
```

**Breaking down the syntax:**

| Part | Definition |
|---|---|
| Outer `( ... )` | Wrapping brackets that turn the function **declaration** into an **expression**. Without them JavaScript expects a function name and throws a syntax error. |
| `function () { ... }` | The anonymous function itself. |
| Final `()` | The call. This is what actually runs the function immediately. |

**Other valid forms:**

```js
// Arrow function IIFE
(() => {
  console.log("Arrow IIFE");
})();

// Async IIFE - lets you use await at the top level of old scripts
(async () => {
  const res = await fetch("/api/data");
  const data = await res.json();
  console.log(data);
})();

// Named IIFE (helpful in stack traces)
(function init() {
  console.log("named");
})();

// With parameters
(function (name) {
  console.log("Hello " + name);
})("Himanshu");
```

## 3. Why is an IIFE used?

### a) To avoid polluting the global scope

**Definition:** Any `var` or function declared at the top level of a script becomes a **global variable**, which can accidentally overwrite variables from other scripts or libraries. An IIFE keeps everything inside its own function scope.

```js
(function () {
  const secret = "hidden";   // not visible outside
  var count = 0;
  console.log(secret);
})();

// console.log(secret); // ReferenceError - exactly what we want
```

### b) To create private variables (the Module Pattern)

**Definition:** The Module Pattern uses an IIFE to hide internal data and expose only a chosen set of public methods. It works because of **closures**.

```js
const counter = (function () {
  let count = 0;                       // PRIVATE - no outside access

  function validate(n) {               // PRIVATE helper
    return typeof n === "number";
  }

  return {                             // PUBLIC interface
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
    setTo: (n) => {
      if (validate(n)) count = n;
    },
  };
})();

counter.increment();
counter.increment();
console.log(counter.value());  // 2
console.log(counter.count);    // undefined ← cannot touch it directly
```

### c) To solve the classic loop problem

**Definition of the problem:** `var` is **function-scoped**, not block-scoped. So a loop using `var` creates only **one** shared variable, and all the callbacks end up seeing its final value.

```js
// THE PROBLEM
for (var i = 1; i <= 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Output: 4, 4, 4  ← the loop finished before any timeout ran, and i is now 4

// FIX 1 - IIFE creates a new scope per iteration
for (var j = 1; j <= 3; j++) {
  (function (n) {
    setTimeout(() => console.log(n), 1000);   // n is a fresh copy each time
  })(j);
}
// Output: 1, 2, 3

// FIX 2 - modern solution, just use let (block-scoped)
for (let k = 1; k <= 3; k++) {
  setTimeout(() => console.log(k), 1000);
}
// Output: 1, 2, 3
```

> Today ES modules give every file its own scope, so IIFEs are less common. You will still see them in older code, in bundled libraries, and for top-level `await` in non-module scripts.

---

# PART 2 — Hoisting and the TDZ

## 4. What is Hoisting?

**Definition:** Hoisting is JavaScript's behaviour of moving **declarations** to the top of their scope during the compilation phase, before any code runs. Only the declaration is moved — **not** the assigned value.

**In simple words:** JavaScript reads the whole file first and notes down all the variable and function names, then runs the code line by line.

```js
console.log(x);  // undefined ← declaration hoisted, value not yet assigned
var x = 10;
console.log(x);  // 10

// JavaScript treats the above as:
// var x;            ← declaration hoisted to the top
// console.log(x);   → undefined
// x = 10;           ← assignment stays where it was
// console.log(x);   → 10
```

### Hoisting of functions

**Definition:** A **function declaration** is hoisted completely, body included, so it can be called before its line. A **function expression** only hoists the variable, so calling it early fails.

```js
sayHi();          // "Hi!" ← works, declarations hoist fully
function sayHi() {
  console.log("Hi!");
}

// sayBye();      // TypeError: sayBye is not a function
var sayBye = function () {
  console.log("Bye!");
};
// Only "var sayBye" was hoisted (as undefined), not the function body
```

---

## 5. What is the Temporal Dead Zone (TDZ)?

**Definition:** The Temporal Dead Zone is the period between entering a scope and the line where a `let` or `const` variable is actually declared. During this period the variable **exists but cannot be accessed** — touching it throws a `ReferenceError`.

**In simple words:** The variable's name is already reserved in the room, but the box is still locked and empty. Trying to open it throws an error instead of giving you `undefined`.

```js
console.log(a);  // undefined  ← var: hoisted AND initialised with undefined
var a = 10;

console.log(b);  // ReferenceError: Cannot access 'b' before initialization
let b = 20;      //   ↑ b was in the TDZ until this line

console.log(c);  // ReferenceError
const c = 30;
```

**Important:** `let` and `const` **are** hoisted — but unlike `var` they are not given an initial value, which is what creates the TDZ.

### TDZ inside a block

```js
{
  // TDZ for "value" starts the moment the block is entered
  // console.log(value);  // ReferenceError
  let value = 5;          // TDZ ends exactly here
  console.log(value);     // 5 ← now it is safe
}
```

### `typeof` is not safe in the TDZ

```js
console.log(typeof neverDeclared); // "undefined" ← no error for unknown names
console.log(typeof x);             // ReferenceError! ← x is in the TDZ
let x = 1;
```

This is a rare case where `typeof` can actually throw.

---

## 6. `var` vs `let` vs `const` — full comparison

| Point | `var` | `let` | `const` |
|---|---|---|---|
| **Scope** | Function-scoped | Block-scoped | Block-scoped |
| **Hoisted** | Yes | Yes | Yes |
| **Initialised on hoist** | Yes, with `undefined` | No → TDZ | No → TDZ |
| **Access before declaration** | `undefined` | ReferenceError | ReferenceError |
| **Re-declare in same scope** | Allowed | Not allowed | Not allowed |
| **Re-assign** | Allowed | Allowed | **Not allowed** |
| **Must initialise at declaration** | No | No | **Yes** |
| **Adds to `window` object** | Yes (at top level) | No | No |

**Definition of "block-scoped":** The variable exists only inside the nearest `{ }` — an `if`, a `for`, or any block.

```js
if (true) {
  var funcScoped = "I leak out";
  let blockScoped = "I stay inside";
}
console.log(funcScoped);    // "I leak out"
// console.log(blockScoped); // ReferenceError
```

**`const` and objects — the common confusion:**

```js
const user = { name: "Himanshu" };
user.name = "Rahul";     // ALLOWED - we changed the contents, not the binding
console.log(user.name);  // "Rahul"

// user = { name: "New" }; // TypeError - cannot reassign the variable itself
```

`const` means the **variable cannot be pointed at something else**. It does not make the object immutable — use `Object.freeze()` for that.

---

## 7. Why does the TDZ exist?

**Definition:** The TDZ was added to catch bugs early. Instead of silently giving `undefined` (which causes a confusing error much later in the code), JavaScript stops you immediately at the actual mistake.

```js
// With var - the bug hides
var total;
console.log(total * 2);   // NaN ← where did this come from? Hard to trace.
total = 10;

// With let - the bug is obvious
console.log(total2 * 2);  // ReferenceError on this exact line
let total2 = 10;
```

---

## Key points

- An **IIFE** runs immediately and creates a private scope. Syntax: `(function(){ ... })()`.
- IIFEs are used for scope isolation, the module pattern, and old loop-closure problems.
- **Hoisting** moves declarations to the top — `var` becomes `undefined`, functions hoist fully.
- **TDZ** is the zone where `let`/`const` exist but cannot be accessed.
- Use `const` by default, `let` when you need to reassign, and avoid `var` completely.
