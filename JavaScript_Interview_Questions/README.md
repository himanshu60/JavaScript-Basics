# JavaScript Interview Questions

All JavaScript topics — core basics and advanced concepts.

📄 **[JavaScriptImpQue.md](JavaScriptImpQue.md)** — all 60 questions with answers in one file.

---

## Core / Basics

| Topic | File | Covers |
|---|---|---|
| JavaScript intro | [Javascript.md](Javascript.md) | What JS is, features |
| Variables | [LetConstVar.md](LetConstVar.md) | `var` vs `let` vs `const`, scope |
| Hoisting | [Hoisting.md](Hoisting.md) | Declaration hoisting |
| Lexical Scope | [Lexical scope.md](Lexical%20scope.md) | Scope chain |
| Closure | [Closure.md](Closure.md) | Functions remembering outer scope |
| `this` keyword | [this.md](this.md) | How `this` is decided |
| `this` in callbacks | [this-In-Callback.md](this-In-Callback.md) | Losing and fixing `this` |
| call / apply / bind | [CallApplyBind.md](CallApplyBind.md) | Setting `this` manually |
| ES5 vs ES6 | [ES5vsES6.md](ES5vsES6.md) | What ES6 added |
| Rest vs Spread | [RestvsSpread.md](RestvsSpread.md) | `...` in both directions |
| Higher-Order Functions | [HOF.md](HOF.md) | Functions taking/returning functions |
| map/filter/reduce/forEach | [MapFilterReduceForeach.md](MapFilterReduceForeach.md) | Array methods compared |
| null vs undefined | [NullVsUndefined.md](NullVsUndefined.md) | The difference |
| JSON | [Json.md](Json.md) | parse, stringify |
| Errors | [JavaScript errors.md](JavaScript%20errors.md) | Error types |
| Modules | [Modules.md](Modules.md) | import / export |
| OOPS | [OOPS.md](OOPS.md) | The four pillars in JS |
| Class | [Class.md](Class.md) | ES6 classes |
| Constructor | [Constructor.md](Constructor.md) | Constructor functions |
| DOM & BOM | [dom and bom.md](dom%20and%20bom.md) | Browser objects |
| Ajax | [Ajax.md](Ajax.md) | Async requests |

## Async JavaScript

| Topic | File | Covers |
|---|---|---|
| Callback | [Callback.md](Callback.md) | Callbacks, callback hell |
| Promises | [Promises.md](Promises.md) | States, chaining |
| async/await | [async.await.md](async.await.md) | Syntax over promises |
| Callback vs Await vs Promise | [CbAwPromises.md](CbAwPromises.md) | All three compared |
| **Promise Combinators** | [PromiseCombinators.md](PromiseCombinators.md) | `all`, `allSettled`, `race`, `any` |
| Event Loop | [Eventloop.md](Eventloop.md) | Basic concept |
| **Microtask vs Macrotask** | [MicrotaskVsMacrotask.md](MicrotaskVsMacrotask.md) | Full event loop, every queue explained |

## Events

| Topic | File | Covers |
|---|---|---|
| Event Bubbling | [EventBubbling.md](EventBubbling.md) | Bubbling basics |
| Event Propagation | [Event propogation.md](Event%20propogation.md) | Capturing and bubbling |
| **Event Delegation** | [EventDelegation.md](EventDelegation.md) | One listener, `target` vs `currentTarget`, `closest()` |

## Advanced

| Topic | File | Covers |
|---|---|---|
| **Currying** | [Currying.md](Currying.md) | Currying, partial application, `curry()` helper |
| **Prototype & Inheritance** | [PrototypeAndInheritance.md](PrototypeAndInheritance.md) | Prototype chain, `__proto__` vs `prototype` |
| **Generators & Iterators** | [GeneratorsAndIterators.md](GeneratorsAndIterators.md) | `function*`, `yield`, async generators |
| **Destructuring** | [Destructuring.md](Destructuring.md) | Array and object destructuring |
| **Map/Set/WeakMap/WeakSet** | [MapSetWeakMapWeakSet.md](MapSetWeakMapWeakSet.md) | All four collections |
| **Optional Chaining & Nullish** | [OptionalChainingAndNullish.md](OptionalChainingAndNullish.md) | `?.`, `??`, `??=` |
| **== vs === and Coercion** | [EqualityAndCoercion.md](EqualityAndCoercion.md) | Truthy/falsy, type conversion |
| **Shallow vs Deep Copy** | [ShallowVsDeepCopy.md](ShallowVsDeepCopy.md) | `structuredClone`, spread, JSON trick |
| **Pure Functions & Immutability** | [PureFunctionsAndImmutability.md](PureFunctionsAndImmutability.md) | Side effects, `Object.freeze` |
| **IIFE, Hoisting & TDZ** | [IIFE-And-TDZ.md](IIFE-And-TDZ.md) | Module pattern, temporal dead zone |
| Debouncing | [Debouncing.md](Debouncing.md) | Basic debounce |
| **Throttling & Debouncing** | [Throttling.md](Throttling.md) | Both, with implementations |
| **Browser Storage** | [StorageOptions.md](StorageOptions.md) | localStorage, sessionStorage, cookies, IndexedDB |

---

## All 60 questions ([JavaScriptImpQue.md](JavaScriptImpQue.md))

1. What is JavaScript?
2. What are the data types in JavaScript?
3. Difference between `null` and `undefined`?
4. What is hoisting?
5. What is the Temporal Dead Zone (TDZ)?
6. Difference between `var`, `let` and `const`?
7. What is a closure?
8. What is the `this` keyword?
9. Difference between `call`, `apply` and `bind`?
10. Difference between `==` and `===`?
11. What are truthy and falsy values?
12. What is type coercion?
13. What is the event loop?
14. Difference between microtasks and macrotasks?
15. What is a callback function?
16. What is a Promise?
17. What is async/await?
18. Difference between `Promise.all`, `allSettled`, `race` and `any`?
19. What is a higher-order function?
20. Difference between `map`, `filter`, `reduce` and `forEach`?
21. What is currying?
22. What is debouncing?
23. What is throttling?
24. What is memoization?
25. What is a pure function?
26. Difference between shallow copy and deep copy?
27. What is the prototype chain?
28. Difference between `__proto__` and `prototype`?
29. Difference between a normal function and an arrow function?
30. What is an IIFE?
31. Rest operator vs spread operator?
32. What is destructuring?
33. What is optional chaining (`?.`)?
34. What is nullish coalescing (`??`)?
35. Difference between `Map` and an object?
36. What is a `Set`?
37. What is a `WeakMap`?
38. What is event bubbling and capturing?
39. What is event delegation?
40. Difference between `event.target` and `event.currentTarget`?
41. What is a generator function?
42. What is an iterable?
43. Difference between `localStorage`, `sessionStorage` and cookies?
44. How does `this` behave in a callback?
45. Difference between `slice` and `splice`?
46. What is `Object.freeze`?
47. What are template literals?
48. Difference between `for...in` and `for...of`?
49. What is `NaN` and how do you check for it?
50. What is strict mode?
51. What is a Symbol?
52. What is garbage collection in JavaScript?
53. What is a polyfill?
54. Difference between synchronous and asynchronous code?
55. How do you handle errors in JavaScript?
56. What is recursion?
57. Difference between function declaration and function expression?
58. What is the `arguments` object?
59. What does `typeof` return for different values?
60. How can you make an object iterable?

---

**Practice problems:** [../Tecnique/](../Tecnique/) · **All questions across all topics:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
