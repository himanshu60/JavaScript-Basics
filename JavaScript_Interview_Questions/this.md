# The `this` Keyword in JavaScript

## 1. What is `this`?

**Definition:** `this` is a reference to the object that is **currently calling** the function. Its value is decided when the function is **called**, not where it is written.

**In simple words:** `this` answers the question *"who called me?"* — and the answer can change between calls of the same function.

```js
const user = {
  name: "Amit",
  greet() {
    console.log(this.name);     // "this" is whatever is before the dot
  },
};

user.greet();                   // "Amit"  ← user called it

const fn = user.greet;
fn();                           // undefined ← nobody called it, "this" is lost
```

Same function, two different values of `this`. **That is the whole topic.**

---

## 2. The four binding rules

`this` is resolved by checking these rules **in priority order**.

### Rule 1 — `new` binding (highest priority)

**Definition:** When a function is called with `new`, `this` is the brand-new empty object being created.

```js
function Person(name) {
  this.name = name;        // "this" = the new object
}
const p = new Person("Amit");
console.log(p.name);       // "Amit"
```

### Rule 2 — Explicit binding

**Definition:** `call`, `apply` and `bind` set `this` manually.

```js
function greet() {
  console.log(this.name);
}
const user = { name: "Amit" };

greet.call(user);          // "Amit"  - call now, args individually
greet.apply(user);         // "Amit"  - call now, args as an array
const bound = greet.bind(user);
bound();                   // "Amit"  - returns a NEW function, locked forever
```

### Rule 3 — Implicit binding

**Definition:** When a function is called as a method, `this` is **the object before the dot**.

```js
const user = {
  name: "Amit",
  greet() { console.log(this.name); },
};
user.greet();              // "Amit" ← "user" is before the dot
```

**Only the last dot matters:**

```js
const a = { name: "A", b: { name: "B", greet() { console.log(this.name); } } };
a.b.greet();               // "B" not "A"
```

### Rule 4 — Default binding (lowest priority)

**Definition:** If none of the above apply, `this` is the global object (`window` in browsers) — or `undefined` in **strict mode** and inside ES modules.

```js
function show() { console.log(this); }
show();                    // window (or undefined in strict mode)
```

**Priority:** `new` → `call`/`apply`/`bind` → method call → default

---

## 3. Arrow functions have no `this`

**Definition:** An arrow function does **not** get its own `this`. It uses the `this` of the surrounding (lexical) scope at the time it was written — and it can never be changed, not even with `call` or `bind`.

```js
const user = {
  name: "Amit",

  regular() {
    console.log(this.name);      // "Amit" - normal method rules
  },

  arrow: () => {
    console.log(this.name);      // undefined - "this" came from OUTSIDE the object
  },
};
```

**An object literal does not create a scope**, so the arrow function's `this` is whatever `this` was in the file — usually `window` or `undefined`.

> **Rule: never use an arrow function as an object method.** Use it for callbacks instead.

---

## 4. The classic problem — losing `this` in a callback

**Definition:** When you pass a method as a callback, it is detached from its object. It is then called as a plain function, so `this` falls back to the default binding.

```js
const user = {
  name: "Amit",
  greet() {
    console.log(this.name);
  },
};

setTimeout(user.greet, 1000);     // undefined ← passed the function, lost the object
```

**Three fixes:**

```js
// 1. Arrow function wrapper - keeps user.greet() as a method call
setTimeout(() => user.greet(), 1000);       // "Amit"

// 2. bind - permanently locks "this"
setTimeout(user.greet.bind(user), 1000);    // "Amit"

// 3. Arrow function inside the object's method (see below)
```

**The nested-function version of the same bug:**

```js
const user = {
  name: "Amit",
  hobbies: ["coding", "music"],

  showBad() {
    this.hobbies.forEach(function (hobby) {
      console.log(this.name, hobby);   // ❌ "this" is undefined inside the callback
    });
  },

  showGood() {
    this.hobbies.forEach((hobby) => {
      console.log(this.name, hobby);   // ✅ arrow inherits "this" from showGood
    });
  },
};
```

This is the single most useful application of arrow functions.

---

## 5. `call` vs `apply` vs `bind`

| Method | Calls immediately? | Arguments | Returns |
|---|---|---|---|
| `call(thisArg, a, b)` | ✅ Yes | Individually | The function's result |
| `apply(thisArg, [a, b])` | ✅ Yes | As an array | The function's result |
| `bind(thisArg, a)` | ❌ **No** | Individually | A **new** bound function |

```js
function introduce(city, country) {
  console.log(`${this.name} from ${city}, ${country}`);
}
const user = { name: "Amit" };

introduce.call(user, "Delhi", "India");
introduce.apply(user, ["Delhi", "India"]);
const bound = introduce.bind(user, "Delhi");
bound("India");                    // partial application
```

**Memory aid:** **C** for Comma (call), **A** for Array (apply), **B** for Bind-it-for-later.

> A bound function **cannot be rebound** — `fn.bind(a).bind(b)` still uses `a`.

---

## 6. `this` in different contexts

```js
// Global scope
console.log(this);        // window (browser), {} (Node module), undefined (ESM)

// Regular function - default binding
function f() { console.log(this); }        // window / undefined (strict)

// Method
obj.method();                              // obj

// Constructor
new Person();                              // the new instance

// Class method - classes are ALWAYS strict mode
class A {
  method() { console.log(this); }          // the instance, or undefined if detached
}

// Event listener - "this" is the element
button.addEventListener("click", function () {
  console.log(this);                       // the button element
});

button.addEventListener("click", () => {
  console.log(this);                       // ❌ NOT the button - lexical this
});
```

---

## 7. `this` in React class components

**Definition:** Class methods are not bound automatically, so passing one as an event handler loses `this`. This is why older React code is full of `bind` calls in constructors.

```js
class Button extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);   // the old fix
  }

  handleClick() {
    console.log(this.props);
  }

  // The modern fix - a class field with an arrow function
  handleClick2 = () => {
    console.log(this.props);      // "this" is lexically the instance
  };

  render() {
    return <button onClick={this.handleClick2}>Click</button>;
  }
}
```

Function components with hooks avoid the problem entirely — there is no `this`.

---

## 8. How to work out `this` — a checklist

Read the **call site**, not the definition, and ask in order:

1. Is it an **arrow function**? → `this` comes from the enclosing scope. Stop.
2. Called with **`new`**? → the new object.
3. Called with **`call`/`apply`/`bind`**? → the given object.
4. Called as **`obj.method()`**? → `obj` (whatever is before the last dot).
5. None of these? → `window`, or `undefined` in strict mode/modules.

---

## Key points

- `this` is decided by **how a function is called**, not where it is defined.
- Priority: `new` → explicit binding → method call → default.
- **Arrow functions have no own `this`** — they inherit it lexically and it cannot be changed.
- Never use an arrow function as an **object method**; always use one for **callbacks**.
- Passing a method as a callback **detaches** it and loses `this` — fix with an arrow wrapper or `bind`.
- `call` and `apply` invoke immediately; `bind` returns a new function and cannot be rebound.
- In strict mode and ES modules, the default `this` is `undefined`, not `window`.

**Related:** [this-In-Callback.md](this-In-Callback.md) · [CallApplyBind.md](CallApplyBind.md) · [Lexical scope.md](Lexical%20scope.md)
