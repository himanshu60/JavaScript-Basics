# async / await

## 1. What is async/await?

**Definition:** `async`/`await` is syntax built on top of Promises that lets you write asynchronous code that **reads like synchronous code** — no `.then()` chains, and errors handled with a normal `try/catch`.

**Definition of `async`:** A keyword that makes a function **always return a Promise**, whatever you return inside it.
**Definition of `await`:** A keyword usable inside an `async` function that **pauses** it until a Promise settles, then gives you the resolved value.

```js
// Promise chain
function getUser() {
  return fetchUser()
    .then((user) => fetchOrders(user.id))
    .then((orders) => ({ orders }))
    .catch((err) => { console.error(err); throw err; });
}

// Same thing with async/await
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

**They are the same mechanism.** `await` works on any Promise, and an `async` function can be consumed with `.then()`.

---

## 2. An async function always returns a Promise

```js
async function f() {
  return 42;                  // NOT 42 - it is Promise<42>
}

f().then((v) => console.log(v));   // 42
const v = await f();               // 42

async function g() {
  throw new Error("boom");    // returns a REJECTED promise
}
g().catch((e) => console.log(e.message));
```

This is why you cannot do `const data = getUser()` and use it directly — you always get a Promise back.

---

## 3. `await` pauses only its own function

**Definition:** `await` does **not** block the thread or the program. It suspends that one async function and hands control back to the event loop, so everything else keeps running.

```js
async function demo() {
  console.log("1");
  await null;              // pause point
  console.log("3");        // continues LATER, as a microtask
}

demo();
console.log("2");

// Output: 1, 2, 3
```

Everything after an `await` is effectively a `.then()` callback — a **microtask**.

---

## 4. Error handling

```js
async function load() {
  try {
    const res = await fetch("/api/data");

    // ⚠️ fetch does NOT reject on 404 or 500 - you must check
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") return null;    // cancelled, not an error
    logger.error(err);
    throw err;                                      // re-throw so the caller knows
  } finally {
    hideLoader();                                   // always runs
  }
}
```

**The unhandled rejection trap:**

```js
async function risky() { throw new Error("boom"); }

risky();                     // ❌ unhandled rejection - crashes Node
risky().catch(console.error); // ✅
await risky();                // ✅ if the caller has try/catch
```

---

## 5. Sequential vs parallel — the biggest mistake

**Definition:** Each `await` waits for the previous line. If the calls do not depend on each other, that is wasted time.

```js
// ❌ SEQUENTIAL - 3 seconds
const user = await fetchUser();       // 1s
const posts = await fetchPosts();     // 1s (starts only after user finishes)
const tags = await fetchTags();       // 1s

// ✅ PARALLEL - 1 second
const [user, posts, tags] = await Promise.all([
  fetchUser(), fetchPosts(), fetchTags(),
]);
```

**Sequential is correct only when there is a real dependency:**

```js
const user = await fetchUser();                  // needed first
const orders = await fetchOrders(user.id);       // depends on user - fine
```

**The same bug inside a loop:**

```js
// ❌ 100 users = 100 sequential requests
for (const id of ids) {
  const user = await fetchUser(id);
  users.push(user);
}

// ✅ all at once
const users = await Promise.all(ids.map(fetchUser));

// ✅ when you need a concurrency limit, batch them
for (let i = 0; i < ids.length; i += 10) {
  const batch = ids.slice(i, i + 10);
  results.push(...(await Promise.all(batch.map(fetchUser))));
}
```

> **Watch for this in code review.** `await` inside a `for` loop is the most common async performance bug in real codebases.

---

## 6. `await` in array methods does not work as expected

**Definition:** `forEach` ignores the Promise returned by its callback, so it does not wait.

```js
// ❌ "done" prints before any user is fetched
ids.forEach(async (id) => {
  const user = await fetchUser(id);
  console.log(user);
});
console.log("done");

// ✅ for...of waits properly (sequential)
for (const id of ids) {
  console.log(await fetchUser(id));
}

// ✅ map + Promise.all (parallel)
const users = await Promise.all(ids.map((id) => fetchUser(id)));
```

`map` returns an array of Promises — you must pass it to `Promise.all`.

---

## 7. Top-level await

**Definition:** In **ES modules** you can use `await` at the top level of a file, without wrapping it in an async function.

```js
// ✅ In an ES module (.mjs, or "type": "module")
const config = await fetch("/config.json").then((r) => r.json());

// ❌ In CommonJS - wrap it
(async () => {
  const config = await loadConfig();
})();
```

> Top-level `await` blocks the module from finishing loading, which delays everything importing it. Use it for genuine startup dependencies, not convenience.

---

## 8. Practical patterns

```js
// Timeout - Promise.race with a rejecting timer
async function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timed out")), ms)
  );
  return Promise.race([promise, timeout]);
}

// Retry with exponential backoff
async function retry(fn, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 2 ** i * 1000));
    }
  }
}

// Cancellation - AbortController (promises cannot be cancelled directly)
const controller = new AbortController();
const data = await fetch(url, { signal: controller.signal });
controller.abort();

// Partial failure - allSettled instead of all
const results = await Promise.allSettled(ids.map(fetchUser));
const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
```

---

## 9. async/await vs Promises — when to use which

| Situation | Better choice |
|---|---|
| Sequential dependent steps | **async/await** — far more readable |
| Error handling with try/catch/finally | **async/await** |
| Multiple independent calls | `Promise.all` (with or without await) |
| First to finish wins | `Promise.race` / `Promise.any` |
| Tolerating partial failures | `Promise.allSettled` |
| A short one-off call | Either |

In practice you combine them: `await Promise.all([...])` is the most common line in modern async JavaScript.

---

## Key points

- `async` makes a function **always return a Promise**; `await` unwraps one.
- `await` pauses **only its own function** — it never blocks the thread.
- Code after an `await` runs as a **microtask**.
- `fetch` does **not** reject on 404/500 — check `res.ok` yourself.
- **Sequential awaits are the biggest async performance bug** — use `Promise.all` for independent work.
- `await` inside a `for` loop is sequential; `forEach` does not wait at all.
- Top-level `await` works in ES modules but delays anything importing that module.
- Promises cannot be cancelled — use `AbortController`.
- Always handle rejections; an unhandled one crashes modern Node.

**Related:** [Promises.md](Promises.md) · [PromiseCombinators.md](PromiseCombinators.md) · [MicrotaskVsMacrotask.md](MicrotaskVsMacrotask.md) · [CbAwPromises.md](CbAwPromises.md)
