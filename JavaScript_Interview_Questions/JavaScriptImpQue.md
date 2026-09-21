# JavaScript Interview Questions and Answers

## 1. What is JavaScript?

JavaScript is a single-threaded, interpreted programming language that runs in the browser and on the server (Node.js). It is dynamically typed, meaning a variable can hold any type of value.

## 2. What are the data types in JavaScript?

**Primitive (7):** `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`.
**Non-primitive (1):** `object` (includes arrays, functions, Date, Map, Set).

Primitives are copied by value, objects are copied by reference.

## 3. What is the difference between `null` and `undefined`?

`undefined` means a variable was declared but never given a value (JavaScript sets it). `null` is an intentional "empty" value that you set yourself. `typeof undefined` is `"undefined"`, while `typeof null` is `"object"` (a famous old bug in JavaScript).

## 4. What is hoisting?

Hoisting is JavaScript moving declarations to the top of their scope before running the code. `var` is hoisted and set to `undefined`, `let`/`const` are hoisted but stay in the Temporal Dead Zone, and function declarations are hoisted fully with their body.

## 5. What is the Temporal Dead Zone (TDZ)?

The period between entering a scope and the line where a `let`/`const` is declared. Accessing the variable in that period throws a `ReferenceError` instead of returning `undefined`.

## 6. What is the difference between `var`, `let` and `const`?

`var` is function-scoped, can be re-declared and re-assigned. `let` is block-scoped and can be re-assigned but not re-declared. `const` is block-scoped and cannot be re-assigned — but the contents of a `const` object or array can still be changed.

## 7. What is a closure?

A closure is a function that remembers the variables from the scope where it was created, even after that outer function has finished running. It is used for data privacy, function factories, currying and memoization.

## 8. What is the `this` keyword?

`this` refers to the object that is calling the function. In a normal function it depends on how the function is called; in an arrow function it is taken from the surrounding scope (lexical `this`); in a method it is the object before the dot; alone in the global scope it is `window` (or `undefined` in strict mode).

## 9. What is the difference between `call`, `apply` and `bind`?

All three set `this` manually. `call(thisArg, a, b)` calls the function immediately with individual arguments. `apply(thisArg, [a, b])` calls it immediately with an array of arguments. `bind(thisArg)` does not call it — it returns a new function with `this` locked in.

## 10. What is the difference between `==` and `===`?

`==` compares after converting types (loose), `===` compares value and type without conversion (strict). Always prefer `===`.

## 11. What are truthy and falsy values?

There are exactly 8 falsy values: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy — including `[]`, `{}` and `"0"`.

## 12. What is type coercion?

JavaScript automatically converting one type to another, like `"5" * 2` becoming `10`, or `1 + "2"` becoming `"12"`.

## 13. What is the event loop?

A mechanism that lets single-threaded JavaScript handle async work. It checks whether the call stack is empty, then moves callbacks from the microtask queue (promises) and macrotask queue (timers) onto the stack. All microtasks run before the next macrotask.

## 14. What is the difference between microtasks and macrotasks?

Microtasks (promises, `queueMicrotask`, `async/await` continuations) have higher priority and the whole queue is drained after each macrotask. Macrotasks are `setTimeout`, `setInterval`, `setImmediate` and I/O callbacks.

## 15. What is a callback function?

A function passed as an argument to another function, to be run later. Nesting too many callbacks creates "callback hell", which promises and async/await solve.

## 16. What is a Promise?

An object representing a value that will be available in the future. It has three states: `pending`, `fulfilled`, `rejected`. Once settled, it cannot change state.

## 17. What is async/await?

Syntax sugar over promises that makes async code read like sync code. `async` makes a function return a promise; `await` pauses inside that function until the promise settles. Errors are handled with `try/catch`.

## 18. Difference between Promise.all, allSettled, race and any?

`all` fails fast if any promise rejects. `allSettled` waits for all and never rejects. `race` returns the first to settle (success or failure). `any` returns the first to succeed.

## 19. What is a higher-order function?

A function that takes a function as an argument, returns a function, or both. Examples: `map`, `filter`, `reduce`, `setTimeout`.

## 20. Difference between `map`, `filter`, `reduce` and `forEach`?

`map` returns a new array of the same length with transformed values. `filter` returns a new array with only matching items. `reduce` boils the array down to a single value. `forEach` just loops and returns `undefined`.

## 21. What is currying?

Converting a function of many arguments into a chain of functions of one argument each: `add(1,2,3)` becomes `add(1)(2)(3)`. It relies on closures and helps create reusable, pre-configured functions.

## 22. What is debouncing?

Delaying a function until the user has stopped triggering it for a set time. Used for search boxes and auto-save.

## 23. What is throttling?

Limiting a function so it runs at most once per fixed interval, no matter how many times the event fires. Used for scroll, resize and mouse-move events.

## 24. What is memoization?

Caching a function's results so that repeated calls with the same arguments return the stored value instead of recomputing.

```js
function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
```

## 25. What is a pure function?

A function that always returns the same output for the same input and causes no side effects (no mutating outside state, no API calls, no DOM changes).

## 26. What is the difference between shallow copy and deep copy?

A shallow copy copies only the first level; nested objects are still shared. A deep copy copies everything recursively so nothing is shared. `{...obj}` is shallow; `structuredClone(obj)` is deep.

## 27. What is the prototype chain?

Every object has a hidden link to a prototype object. When a property is not found, JavaScript looks up the chain until it finds it or reaches `null`. This is how inheritance works in JavaScript.

## 28. Difference between `__proto__` and `prototype`?

`__proto__` is a property on every object pointing to its prototype. `prototype` is a property on constructor functions/classes; it becomes the `__proto__` of objects created with `new`.

## 29. What is the difference between a normal function and an arrow function?

Arrow functions have no own `this`, `arguments`, `super` or `prototype`, cannot be used with `new`, and cannot be generators. They take `this` from the surrounding scope, which makes them great for callbacks but wrong for object methods that need their own `this`.

## 30. What is an IIFE?

An Immediately Invoked Function Expression — `(function(){ ... })()` — a function that runs as soon as it is defined, used to avoid polluting the global scope and to create private variables.

## 31. What is the rest operator vs the spread operator?

They look the same (`...`) but do opposite things. Rest **collects** many values into an array (in function parameters or destructuring). Spread **expands** an array or object into individual items.

## 32. What is destructuring?

A short syntax to pull values out of arrays and objects into variables: `const {name, age} = user;` or `const [a, b] = arr;`.

## 33. What is optional chaining (`?.`)?

It safely reads nested properties, returning `undefined` instead of throwing when something in the chain is `null` or `undefined`.

## 34. What is nullish coalescing (`??`)?

It returns the right-hand value only when the left is `null` or `undefined`. Unlike `||`, it keeps `0`, `""` and `false`.

## 35. Difference between `Map` and an object?

A `Map` accepts any type of key, keeps insertion order, has `.size`, and is directly iterable. Objects only take string/symbol keys and are better for simple records and JSON.

## 36. What is a `Set`?

A collection of unique values. `[...new Set(arr)]` is the shortest way to remove duplicates from an array.

## 37. What is a `WeakMap`?

Like a `Map` but keys must be objects and they are held weakly, so the garbage collector can remove entries when the key object is no longer used elsewhere. Used for caches and private data.

## 38. What is event bubbling and capturing?

Bubbling: the event starts at the target and travels up to its ancestors (default). Capturing: the event travels down from the root to the target (enable with `{capture: true}`). Stop it with `event.stopPropagation()`.

## 39. What is event delegation?

Attaching one listener to a parent instead of many listeners to children, using `event.target` to find what was clicked. It saves memory and works for elements added later.

## 40. What is the difference between `event.target` and `event.currentTarget`?

`target` is the element actually clicked; `currentTarget` is the element the listener is attached to.

## 41. What is a generator function?

A `function*` that can pause at each `yield` and resume when `next()` is called. Useful for lazy sequences, infinite streams and custom iterators.

## 42. What is an iterable?

Anything with a `[Symbol.iterator]` method, so it works with `for...of` and spread. Arrays, strings, Map and Set are iterable; plain objects are not.

## 43. What is the difference between `localStorage`, `sessionStorage` and cookies?

`localStorage` stays forever and is shared across tabs. `sessionStorage` is per tab and cleared on tab close. Cookies are small (4 KB), can expire, and are sent to the server with every request.

## 44. How does `this` behave in a callback?

In a normal-function callback `this` is lost (becomes `undefined` or `window`). Fix it with an arrow function, `.bind(this)`, or by saving `const self = this`.

## 45. What is the difference between `slice` and `splice`?

`slice(start, end)` returns a copy and never changes the original. `splice(start, count, ...items)` removes/inserts items and **mutates** the original array.

## 46. What is `Object.freeze`?

It makes an object read-only — no adding, removing or changing properties. It is shallow, so nested objects can still be modified.

## 47. What are template literals?

Strings written with backticks that support interpolation `${value}` and multi-line text.

## 48. What is the difference between `for...in` and `for...of`?

`for...in` loops over **keys** (including inherited enumerable ones) and is meant for objects. `for...of` loops over **values** of iterables like arrays, strings, Map and Set.

## 49. What is `NaN` and how do you check for it?

`NaN` means "Not a Number" and is the only value not equal to itself. Use `Number.isNaN(x)` — the global `isNaN()` coerces first and gives wrong results (`isNaN("abc")` is `true`).

## 50. What is strict mode?

`"use strict"` turns silent mistakes into errors: no undeclared variables, no duplicate parameters, `this` is `undefined` in plain function calls. ES modules and classes are always strict.

## 51. What is a Symbol?

A unique, immutable primitive used as an object key that never clashes with other keys. Well-known symbols like `Symbol.iterator` let you customise language behaviour.

## 52. What is garbage collection in JavaScript?

Automatic memory cleanup. The engine uses a mark-and-sweep algorithm: anything not reachable from the root is freed. Memory leaks happen from forgotten timers, detached DOM nodes, global variables and lingering listeners.

## 53. What is a polyfill?

Code that implements a newer feature on older browsers that do not support it — for example writing your own `Array.prototype.includes` when the browser lacks it.

## 54. What is the difference between synchronous and asynchronous code?

Synchronous code runs line by line and blocks the next line until it is finished. Asynchronous code starts a task and continues, handling the result later through a callback, promise or `await`.

## 55. How do you handle errors in JavaScript?

`try/catch/finally` for synchronous code and `async/await`, `.catch()` for promise chains, `window.onerror` / `unhandledrejection` for global handling, and custom error classes extending `Error` for domain-specific errors.

## 56. What is recursion?

A function calling itself until it reaches a base case. Always define the base case first, or you get a stack overflow.

```js
function factorial(n) {
  if (n <= 1) return 1;        // base case
  return n * factorial(n - 1); // recursive case
}
```

## 57. What is the difference between function declaration and function expression?

A declaration (`function foo(){}`) is fully hoisted and can be called before its line. An expression (`const foo = function(){}`) is not — calling it early throws an error.

## 58. What is the `arguments` object?

An array-like object available inside normal functions holding all passed arguments. Arrow functions do not have it — use rest parameters (`...args`) instead.

## 59. What does `typeof` return for different values?

`"number"`, `"string"`, `"boolean"`, `"undefined"`, `"object"` (for objects, arrays and `null`), `"function"`, `"symbol"`, `"bigint"`. Use `Array.isArray()` to detect arrays.

## 60. How can you make an object iterable?

Add a `[Symbol.iterator]` method that returns an iterator (or write it as a generator method). Then `for...of` and spread work on it.
