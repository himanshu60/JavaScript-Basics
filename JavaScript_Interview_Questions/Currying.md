# Currying in JavaScript

## 1. What is Currying?

**Definition:** Currying is a technique of converting a function that takes **many arguments at once** into a **chain of functions**, where each function takes only **one argument at a time** and returns the next function, until all arguments are collected.

**In simple words:** Normally you give all the ingredients together — `add(1, 2, 3)`. With currying you give one ingredient at a time — `add(1)(2)(3)`. Each step remembers what you gave before.

**Why it works:** Currying is built on **closures**. A closure is a function that remembers the variables of the scope where it was created. So the inner function still remembers `a` even after the outer function has finished.

---

## 2. Normal function vs Curried function

```js
// NORMAL FUNCTION - all arguments together
function add(a, b, c) {
  return a + b + c;
}
console.log(add(1, 2, 3)); // 6

// CURRIED FUNCTION - one argument at a time
function curryAdd(a) {
  return function (b) {        // remembers a
    return function (c) {      // remembers a and b
      return a + b + c;
    };
  };
}
console.log(curryAdd(1)(2)(3)); // 6
```

**What happens step by step:**

| Call | What it returns |
|---|---|
| `curryAdd(1)` | a function that is waiting for `b` (and remembers `a = 1`) |
| `curryAdd(1)(2)` | a function that is waiting for `c` (remembers `a = 1`, `b = 2`) |
| `curryAdd(1)(2)(3)` | the final value `6` |

### Short form with arrow functions

**Definition:** An arrow function (`=>`) is a shorter way to write a function. When the body is a single expression, it returns that expression automatically.

```js
const add3 = (a) => (b) => (c) => a + b + c;
console.log(add3(1)(2)(3)); // 6
```

---

## 3. Why Currying is useful - reusable functions

**Definition:** Because the first argument gets "locked in", you can create ready-made specialised versions of a general function.

```js
const multiply = (a) => (b) => a * b;

const double = multiply(2);   // "a" is permanently locked as 2
const triple = multiply(3);   // "a" is permanently locked as 3

console.log(double(5));  // 10
console.log(double(10)); // 20
console.log(triple(5));  // 15
```

**Real example - a logger**

```js
const log = (level) => (module) => (message) =>
  console.log(`[${level}] [${module}] ${message}`);

const errorLog = log("ERROR");
const authError = errorLog("AUTH");

authError("Invalid password");  // [ERROR] [AUTH] Invalid password
authError("Token expired");     // [ERROR] [AUTH] Token expired
```

---

## 4. Partial Application (related but different)

**Definition:** Partial application means fixing **some** of the arguments of a function now, and supplying the rest later. Currying is stricter — it takes exactly **one** argument per call.

```js
// PARTIAL APPLICATION - fix some arguments using bind()
function greet(greeting, name) {
  return `${greeting}, ${name}!`;
}

const sayHello = greet.bind(null, "Hello"); // "greeting" is fixed
console.log(sayHello("Himanshu")); // "Hello, Himanshu!"

// CURRYING - strictly one argument at a time
const greetCurried = (greeting) => (name) => `${greeting}, ${name}!`;
console.log(greetCurried("Hello")("Himanshu"));
```

| Point | Currying | Partial Application |
|---|---|---|
| Arguments per call | Exactly one | One or more |
| Returns | A function until all args are given | A function with fewer remaining args |
| Example | `f(1)(2)(3)` | `f(1, 2)(3)` |

---

## 5. Infinite Currying

**Definition:** Infinite currying is when a curried function can be called any number of times, and you stop it by calling it with **no argument** (or by using the returned value in a string/number context).

```js
function sum(a) {
  return function (b) {
    if (b !== undefined) return sum(a + b); // keep returning a function
    return a;                               // no argument → give the total
  };
}

console.log(sum(1)(2)(3)(4)());    // 10
console.log(sum(5)(10)());         // 15
```

---

## 6. Generic curry() helper

**Definition:** A `curry()` helper is a higher-order function that takes any normal function and automatically converts it into a curried one. It uses `fn.length` (the number of parameters the function expects) to know when all arguments have arrived.

```js
function curry(fn) {
  return function curried(...args) {
    // Do we have enough arguments?
    if (args.length >= fn.length) {
      return fn(...args);                        // YES → run the real function
    }
    // NO → return a function that waits for more
    return (...next) => curried(...args, ...next);
  };
}

const volume = (l, w, h) => l * w * h;
const curriedVolume = curry(volume);

console.log(curriedVolume(2)(3)(4));  // 24
console.log(curriedVolume(2, 3)(4));  // 24  ← flexible
console.log(curriedVolume(2, 3, 4));  // 24
```

**Terms used here:**
- **Rest parameter (`...args`)** — collects all passed arguments into a real array.
- **Spread (`...args` in a call)** — expands an array back into individual arguments.
- **`fn.length`** — how many parameters the original function declared.

---

## 7. Real-world use cases

```js
// 1. API URL builder
const api = (baseUrl) => (version) => (endpoint) => `${baseUrl}/${version}/${endpoint}`;
const myApi = api("https://site.com")("v1");
console.log(myApi("users"));  // https://site.com/v1/users
console.log(myApi("orders")); // https://site.com/v1/orders

// 2. Event handler with extra data (React)
const handleClick = (id) => (event) => {
  console.log("Clicked item:", id, event.type);
};
// <button onClick={handleClick(5)}>Delete</button>

// 3. Discount calculator
const discount = (percent) => (price) => price - (price * percent) / 100;
const festiveOffer = discount(20);
console.log(festiveOffer(1000)); // 800
```

---

## Key points

- Currying = many arguments → chain of single-argument functions.
- It works because of **closures** (inner functions remember outer variables).
- It creates **reusable, pre-configured** functions like `double` and `triple`.
- Curried functions are easy to **compose** and to pass around as callbacks.
- `fn.length` is the trick used to build a generic `curry()` helper.
