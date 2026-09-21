# Promise Combinators - all, allSettled, race, any

## 1. Quick revision - what is a Promise?

**Definition:** A Promise is an object that represents the eventual result of an asynchronous operation. It acts as a placeholder for a value that is not ready yet.

**The three states of a promise:**

| State | Definition |
|---|---|
| **Pending** | The work has started but is not finished yet. This is the initial state. |
| **Fulfilled** | The work finished successfully and produced a value (`resolve` was called). |
| **Rejected** | The work failed and produced an error (`reject` was called). |

A promise is called **settled** once it is either fulfilled or rejected. A settled promise can never change state again.

```js
const promise = new Promise((resolve, reject) => {
  const success = true;
  if (success) resolve("Data loaded");   // → fulfilled
  else reject(new Error("Failed"));      // → rejected
});
```

**Handler methods:**
- **`.then(cb)`** — runs when the promise is fulfilled. Returns a new promise so it can be chained.
- **`.catch(cb)`** — runs when the promise is rejected, or when any earlier step throws.
- **`.finally(cb)`** — always runs, whether it succeeded or failed. Used for cleanup.

---

## 2. What is a Promise Combinator?

**Definition:** A promise combinator is a static method on the `Promise` object that takes **multiple promises** and combines them into **one single promise**. It lets you run many async operations together instead of one after another.

There are four of them, and the difference is only in **when they settle** and **what they do with failures**.

**In simple words:**
- `Promise.all` → "**All** must succeed, otherwise the whole thing fails." (strict team)
- `Promise.allSettled` → "Tell me the result of **each one**, success or failure." (report card)
- `Promise.race` → "Whoever finishes **first** wins — win or lose." (race)
- `Promise.any` → "Give me the first one that **succeeds**, ignore failures." (first winner only)

**Setup used in all examples:**

```js
const p1 = new Promise((resolve) => setTimeout(() => resolve("One"), 1000));
const p2 = new Promise((resolve) => setTimeout(() => resolve("Two"), 2000));
const p3 = new Promise((_, reject) => setTimeout(() => reject("Error Three"), 500));
```

---

## 3. `Promise.all()` — all or nothing

**Definition:** `Promise.all(iterable)` takes an array of promises and returns a single promise that:
- **Fulfils** with an array of all results, in the **same order** as the input, once every promise has succeeded.
- **Rejects immediately** with the first error, as soon as **any one** promise fails. This is called "fail fast".

```js
// All succeed
Promise.all([p1, p2])
  .then((results) => console.log(results))   // ["One", "Two"] after ~2s
  .catch((err) => console.log("Failed:", err));

// One fails → whole thing fails
Promise.all([p1, p2, p3])
  .then((r) => console.log(r))
  .catch((err) => console.log("Failed:", err)); // "Failed: Error Three" after 0.5s
```

**Important:** the order of results follows the **input order**, not the order in which they finished.

**Real use — load a dashboard:**

```js
const [user, posts, comments] = await Promise.all([
  fetch("/api/user").then((r) => r.json()),
  fetch("/api/posts").then((r) => r.json()),
  fetch("/api/comments").then((r) => r.json()),
]);
// All three requests start at the SAME time - much faster than awaiting one by one
```

**When to use:** when your screen cannot work unless **all** the data arrives.

---

## 4. `Promise.allSettled()` — never fails

**Definition:** `Promise.allSettled(iterable)` waits for **every** promise to settle (succeed or fail) and then fulfils with an array of result objects. It **never rejects**.

**Shape of each result object:**
- On success: `{ status: "fulfilled", value: <result> }`
- On failure: `{ status: "rejected", reason: <error> }`

```js
Promise.allSettled([p1, p2, p3]).then((results) => console.log(results));
/*
[
  { status: "fulfilled", value: "One" },
  { status: "fulfilled", value: "Two" },
  { status: "rejected",  reason: "Error Three" }
]
*/
```

**Filtering the results:**

```js
const results = await Promise.allSettled(promises);

const successes = results
  .filter((r) => r.status === "fulfilled")
  .map((r) => r.value);

const failures = results
  .filter((r) => r.status === "rejected")
  .map((r) => r.reason);

console.log(`${successes.length} succeeded, ${failures.length} failed`);
```

**Real use:** sending 100 emails or uploading 10 files — you want to know exactly which ones failed, not abort everything because one failed.

**When to use:** when each operation is **independent** and a partial success is acceptable.

---

## 5. `Promise.race()` — first to finish wins

**Definition:** `Promise.race(iterable)` returns a promise that settles as soon as the **first** promise settles — whether it fulfilled or rejected. The results of all the others are discarded.

```js
Promise.race([p1, p3])
  .then((r) => console.log("Winner:", r))
  .catch((e) => console.log("Lost:", e));
// "Lost: Error Three" ← p3 finished first (0.5s), even though it failed
```

**Real use — adding a timeout to a request:**

```js
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), ms)
  );
  return Promise.race([promise, timeout]);  // whichever finishes first wins
}

try {
  const data = await withTimeout(fetch("/api/slow"), 3000);
} catch (err) {
  console.log(err.message); // "Request timed out" if the API took over 3s
}
```

**When to use:** timeouts, or taking the fastest of several equivalent sources.

---

## 6. `Promise.any()` — first success wins

**Definition:** `Promise.any(iterable)` returns a promise that fulfils with the value of the **first promise to succeed**. Rejections are ignored. It only rejects if **every** promise fails, and then the error is an `AggregateError`.

**Definition of `AggregateError`:** A special error type that holds an array of all the individual errors in its `.errors` property.

```js
Promise.any([p3, p1, p2])
  .then((r) => console.log("First success:", r))  // "One" ← p3's failure ignored
  .catch((e) => console.log(e));

// When ALL of them fail
Promise.any([Promise.reject("a"), Promise.reject("b")])
  .catch((e) => {
    console.log(e.name);   // "AggregateError"
    console.log(e.errors); // ["a", "b"] ← all the individual errors
  });
```

**Real use — try several mirror servers:**

```js
const data = await Promise.any([
  fetch("https://server1.com/data"),
  fetch("https://server2.com/data"),
  fetch("https://server3.com/data"),
]);
// Uses whichever server responds successfully first
```

**When to use:** when you have several backup sources and need only one working result.

---

## 7. `race` vs `any` — the key difference

| Situation | `Promise.race` | `Promise.any` |
|---|---|---|
| First promise **succeeds** | Fulfils with that value | Fulfils with that value |
| First promise **fails** | **Rejects** with that error | **Ignores** it and waits for a success |
| All promises fail | Rejects with the first error | Rejects with `AggregateError` |

---

## 8. Full comparison table

| Method | Fulfils when | Rejects when | Result value |
|---|---|---|---|
| `all` | **All** fulfil | **Any** rejects (fail fast) | Array of values, in input order |
| `allSettled` | **All** settle | **Never** | Array of `{status, value/reason}` |
| `race` | First **settles** with success | First settles with failure | Single value or error |
| `any` | First **fulfils** | **All** reject | Single value / `AggregateError` |

---

## 9. Why combinators matter - sequential vs parallel

**Definition (Sequential):** Each operation waits for the previous one to finish. Total time = sum of all times.
**Definition (Parallel/Concurrent):** All operations start together. Total time = the slowest one.

```js
// SLOW - sequential (3 requests × 1s = ~3 seconds)
for (const url of urls) {
  await fetch(url);      // waits for each one before starting the next
}

// FAST - parallel (~1 second total)
await Promise.all(urls.map((url) => fetch(url)));
```

> A very common interview point: using `await` inside a `for` loop makes requests run one by one. Use `Promise.all` with `.map()` to run them together.

---

## Key points

- All four are **static methods** — call them on `Promise`, not on an instance.
- They accept any iterable; non-promise values are treated as already-fulfilled promises.
- `all` = strict (any failure kills it). `allSettled` = tolerant (never fails).
- `race` = first to settle. `any` = first to succeed.
- Use them to run independent async work **concurrently** instead of one after another.
