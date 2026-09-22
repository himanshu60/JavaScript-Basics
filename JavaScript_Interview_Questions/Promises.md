# Promises in JavaScript

## 1. What is a Promise?

**Definition:** A Promise is an object representing the **eventual result of an asynchronous operation**. It acts as a placeholder for a value that is not available yet, but will be at some point.

**In simple words:** You order food and get a token. The token is not the food — it is a promise that food is coming. Later it either arrives (fulfilled) or the kitchen tells you it cannot be made (rejected).

**The problem it solves — callback hell:**

```js
// ❌ Callbacks nested inside callbacks
getUser(1, (user) => {
  getOrders(user.id, (orders) => {
    getDetails(orders[0].id, (details) => {
      console.log(details);              // drifting right forever
    }, handleError);
  }, handleError);
}, handleError);

// ✅ Promises flatten it
getUser(1)
  .then((user) => getOrders(user.id))
  .then((orders) => getDetails(orders[0].id))
  .then((details) => console.log(details))
  .catch(handleError);                   // ONE error handler for the whole chain
```

---

## 2. The three states

**Definition:** A promise is always in exactly one of three states.

| State | Definition |
|---|---|
| **Pending** | The initial state — the work has started but has not finished |
| **Fulfilled** | The work succeeded and produced a value (`resolve` was called) |
| **Rejected** | The work failed and produced a reason (`reject` was called) |

**Definition of Settled:** A promise that is either fulfilled or rejected. **A settled promise can never change state again** — it is final.

```
         ┌──> fulfilled (resolve)
pending ─┤
         └──> rejected  (reject)
```

---

## 3. Creating a promise

```js
const promise = new Promise((resolve, reject) => {
  // this "executor" function runs IMMEDIATELY, synchronously
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve("Data loaded");        // → fulfilled
    } else {
      reject(new Error("Failed"));   // → rejected
    }
  }, 1000);
});
```

**Shortcuts for already-settled promises:**

```js
Promise.resolve(42);                      // already fulfilled
Promise.reject(new Error("nope"));        // already rejected
```

> **Always reject with an `Error` object**, not a string. Only an `Error` carries a stack trace, which is what you need when debugging.

---

## 4. Consuming a promise

**Definition of `.then(onFulfilled)`:** Registers a callback that runs when the promise is fulfilled. It returns a **new promise**, which is what makes chaining possible.

**Definition of `.catch(onRejected)`:** Registers a callback for rejection. It also catches errors thrown by any earlier `.then` in the chain. It is shorthand for `.then(null, fn)`.

**Definition of `.finally(fn)`:** Runs whether the promise succeeded or failed. It receives no value and does not change what passes through — ideal for cleanup.

```js
showLoader();

fetchData()
  .then((data) => {
    console.log(data);
    return data.id;                 // whatever you return becomes the next .then's input
  })
  .then((id) => fetchDetails(id))   // returning a PROMISE waits for it
  .catch((err) => console.error("Something failed:", err))
  .finally(() => hideLoader());     // always runs
```

---

## 5. Chaining — the rules that matter

**Definition:** Each `.then` returns a new promise, so the value you **return** becomes the input to the next one. Returning a promise makes the chain wait for it.

```js
Promise.resolve(1)
  .then((v) => v + 1)              // returns 2
  .then((v) => Promise.resolve(v * 2))  // returns a promise → chain waits → 4
  .then((v) => console.log(v));    // 4
```

**The number one chaining bug — forgetting to return:**

```js
// ❌ Nothing is returned, so the next .then gets undefined
fetchUser()
  .then((user) => {
    fetchOrders(user.id);          // forgot "return"
  })
  .then((orders) => console.log(orders));   // undefined

// ✅
  .then((user) => {
    return fetchOrders(user.id);
  })
```

**Error propagation:** an error anywhere in the chain skips every remaining `.then` and jumps straight to the nearest `.catch`.

```js
step1()
  .then(step2)      // skipped if step1 rejects
  .then(step3)      // skipped
  .catch(handle);   // catches whichever step failed
```

**Recovering mid-chain** — a `.catch` returns a normal promise, so the chain continues:

```js
fetchFromAPI()
  .catch(() => getCachedData())    // fall back instead of failing
  .then((data) => render(data));   // runs either way
```

---

## 6. Promise combinators

**Definition:** Static methods that combine several promises into one.

```js
// all - every one must succeed; rejects immediately if any fails
const [user, posts] = await Promise.all([fetchUser(), fetchPosts()]);

// allSettled - waits for all, NEVER rejects
const results = await Promise.allSettled(promises);
// [{status:"fulfilled", value}, {status:"rejected", reason}]

// race - first to SETTLE wins, success or failure
await Promise.race([fetchData(), timeout(5000)]);

// any - first to SUCCEED wins, ignores failures
await Promise.any([server1(), server2(), server3()]);
```

**Sequential vs parallel — a very common performance bug:**

```js
// ❌ 3 seconds - each waits for the previous
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();

// ✅ 1 second - all start together
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
```

Full detail: [PromiseCombinators.md](PromiseCombinators.md)

---

## 7. Promises are microtasks

**Definition:** Promise callbacks go into the **microtask queue**, which is drained completely before any macrotask (like `setTimeout`) runs.

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");

// Output: 1, 4, 3, 2
```

Sync code first → **all** microtasks (promises) → then macrotasks (timers).

Full detail: [MicrotaskVsMacrotask.md](MicrotaskVsMacrotask.md)

---

## 8. Promises vs async/await

**Definition:** `async`/`await` is syntax sugar over promises. An `async` function always returns a promise, and `await` pauses until a promise settles.

```js
// Promise chain
function getUser() {
  return fetchUser()
    .then((user) => fetchOrders(user.id))
    .then((orders) => ({ orders }))
    .catch((err) => { console.error(err); throw err; });
}

// async/await - same thing, reads like sync code
async function getUser() {
  try {
    const user = await fetchUser();
    const orders = await fetchOrders(user.id);
    return { orders };
  } catch (err) {
    console.error(err);
    throw err;
  }
}
```

**They are interchangeable** — `await` works on any promise, and an `async` function can be used with `.then()`.

---

## 9. Common mistakes

```js
// 1. Not returning in a .then  (see section 5)

// 2. Unhandled rejection - crashes the process in modern Node
fetchData();                          // ❌ no .catch
fetchData().catch(handleError);       // ✅

// 3. Forgetting that fetch does NOT reject on 404/500
const res = await fetch(url);
if (!res.ok) throw new Error(`HTTP ${res.status}`);   // ✅ you must check

// 4. Nesting promises instead of chaining
fetchA().then((a) => {
  fetchB().then((b) => {             // ❌ callback hell again
    console.log(a, b);
  });
});
fetchA().then((a) => fetchB().then((b) => [a, b]));   // ✅ or use Promise.all

// 5. await inside a loop when the calls are independent
for (const id of ids) { await fetchUser(id); }        // ❌ sequential
await Promise.all(ids.map(fetchUser));                // ✅ parallel

// 6. Trying to cancel a promise - you cannot
// Use AbortController on the underlying request instead
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort();
```

---

## Key points

- A Promise is a placeholder for a future value, in one of three states.
- **Once settled, a promise never changes state.**
- `.then` returns a **new promise** — that is what enables chaining.
- **Always `return`** inside `.then`, or the next step receives `undefined`.
- One `.catch` at the end handles errors from every earlier step.
- `.finally` always runs and does not alter the value.
- Promise callbacks are **microtasks** — they run before `setTimeout`.
- Use `Promise.all` for independent work; awaiting in a loop is a common performance bug.
- `fetch` does **not** reject on HTTP errors — check `res.ok` yourself.
- Promises cannot be cancelled; use `AbortController`.

**Related:** [async.await.md](async.await.md) · [PromiseCombinators.md](PromiseCombinators.md) · [CbAwPromises.md](CbAwPromises.md) · [Callback.md](Callback.md)
