# Closures in JavaScript

## 1. What is a Closure?

**Definition:** A closure is a function that **remembers the variables from the scope where it was created**, and can still access them even after that outer function has finished executing.

**In simple words:** A function carries a backpack. When it is created, it packs the variables around it. Wherever you take that function afterwards, the backpack comes with it.

**Why it exists:** JavaScript functions are values — you can return them, pass them around, and store them. A returned function still needs its variables, so the engine keeps that scope alive instead of destroying it.

```js
function outerFunc() {
  var outVariable = "I am from the outer function";   // lives in the outer scope

  function innerFunc() {
    console.log(outVariable);      // reaches OUT to the enclosing scope
  }

  return innerFunc;                // returned WITHOUT being called
}

var closure = outerFunc();         // outerFunc has now FINISHED
closure();                         // "I am from the outer function"
```

Normally `outVariable` would be destroyed when `outerFunc` returns. Because `innerFunc` still references it, the scope survives. **That surviving link is the closure.**

---

## 2. Each closure gets its own copy

**Definition:** Every call to the outer function creates a **new** scope, so each returned function has its own independent set of variables.

```js
function counter() {
  let count = 0;                   // a fresh "count" per call

  function increment() {
    count++;
    console.log(count);
  }

  return increment;
}

var res = counter();
var ans = counter();               // a completely separate count

res();   // 1
res();   // 2

ans();   // 1   ← its own counter, not 3
res();   // 3
ans();   // 2
```

**This is the most common interview follow-up.** `res` and `ans` do not share state because `counter()` ran twice, creating two separate scopes.

---

## 3. Why closures matter — private data

**Definition:** JavaScript has no `private` keyword for plain functions. Closures are how you hide state — the variable simply cannot be reached from outside.

```js
function createBankAccount(initialBalance) {
  let balance = initialBalance;          // PRIVATE - no outside access

  return {
    deposit(amount) {
      if (amount <= 0) return "Invalid amount";
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) return "Insufficient funds";
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const account = createBankAccount(100);
account.deposit(50);          // 150
account.getBalance();         // 150
console.log(account.balance); // undefined ← cannot be touched directly
```

The only way to change `balance` is through the methods, which can validate first. That is real encapsulation.

---

## 4. The classic loop problem

**Definition:** `var` is **function-scoped**, so a loop using `var` creates only **one** shared variable. Every callback closes over that same variable and sees its final value.

```js
// ❌ prints 3, 3, 3
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 1000);
}
```

By the time the timeouts run, the loop has finished and `i` is `3`. All three closures point at the **same** `i`.

```js
// ✅ Fix 1 - let is BLOCK-scoped, so each iteration gets its own i
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);    // 0, 1, 2
}

// ✅ Fix 2 - an IIFE creates a new scope per iteration (the pre-ES6 way)
for (var i = 0; i < 3; i++) {
  (function (n) {
    setTimeout(() => console.log(n), 1000);  // 0, 1, 2
  })(i);
}
```

---

## 5. Where closures are used every day

```js
// 1. Function factories - a pre-configured function
function multiplier(factor) {
  return (number) => number * factor;      // "factor" is remembered
}
const double = multiplier(2);
const triple = multiplier(3);
double(5);   // 10

// 2. Debouncing - "timer" survives between calls
function debounce(fn, delay) {
  let timer;                               // held by the closure
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 3. Memoization - "cache" persists across calls
function memoize(fn) {
  const cache = new Map();                 // private cache
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// 4. Currying
const add = (a) => (b) => a + b;           // the inner fn remembers "a"

// 5. React hooks - useState works because of closures
function Counter() {
  const [count, setCount] = useState(0);
  // the event handler closes over "count" from this render
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## 6. The stale closure trap

**Definition:** A stale closure is one that captured an **old** value and never updates, because it was created in an earlier scope and reused.

```js
// ❌ Always logs 0 - the callback captured count from the first render
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []);                          // empty deps = created once, never refreshed

// ✅ Fix 1 - add the dependency so the effect re-creates with the new value
}, [count]);

// ✅ Fix 2 - use a functional update so you do not need the captured value
setCount((c) => c + 1);
```

This is the single most common React bug, and it is a closure problem, not a React problem.

---

## 7. Closures and memory

**Definition:** Because a closure keeps its outer scope alive, variables it references cannot be garbage collected. Holding a large object in a closure that never goes away is a memory leak.

```js
// ❌ hugeData is kept alive forever by the returned function
function createHandler() {
  const hugeData = new Array(1_000_000).fill("x");
  return () => console.log("clicked");     // does not even use hugeData
}

// ✅ Only keep what you need
function createHandler() {
  const hugeData = new Array(1_000_000).fill("x");
  const count = hugeData.length;           // extract just the value
  return () => console.log(count);
}
```

Closures are not a leak by themselves — leaks come from closures that **outlive their usefulness**, like an event listener that is never removed.

---

## Key points

- A closure is a function **plus** the scope it was created in.
- The outer scope survives because the inner function still references it.
- Each call to the outer function creates a **separate** closure with its own variables.
- Closures give JavaScript **private state** — the basis of the module pattern.
- The `var` loop problem is a closure problem; `let` fixes it by being block-scoped.
- They power debouncing, memoization, currying, function factories and React hooks.
- A **stale closure** captured an old value — fix with correct dependencies or a functional update.
- Closures keep memory alive, so do not capture large objects you do not need.

**Related:** [Lexical scope.md](Lexical%20scope.md) · [Currying.md](Currying.md) · [IIFE-And-TDZ.md](IIFE-And-TDZ.md) · [Throttling.md](Throttling.md)
