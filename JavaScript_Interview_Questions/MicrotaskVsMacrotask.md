# Microtask vs Macrotask (Event Loop Deep Dive)

## 1. What is the Call Stack?

**Definition:** The Call Stack is the place where JavaScript keeps track of which function is running right now. It works on **LIFO** (Last In, First Out) — the last function that entered is the first to leave.

**In simple words:** It is a stack of plates. You put a plate on top when a function starts, and remove the top plate when that function finishes.

```js
function third()  { console.log("third"); }
function second() { third(); }
function first()  { second(); }

first();
// Stack grows:  first → second → third
// Stack shrinks: third → second → first
```

> JavaScript is **single threaded** — it has only ONE call stack, so it can do only one thing at a time.

---

## 2. What is the Event Loop?

**Definition:** The Event Loop is a continuously running process that checks whether the Call Stack is empty. When it is empty, the Event Loop takes the next waiting task from a queue and pushes it onto the Call Stack to run.

**In simple words:** It is a manager who keeps looking at the doctor's room. As soon as the room is empty, he sends in the next patient from the waiting line.

**The rule to remember:**
> Run all synchronous code → then empty the **whole** microtask queue → then run **one** macrotask → then empty the whole microtask queue again → repeat.

---

## 3. What is a Task Queue (Callback Queue)?

**Definition:** A task queue is a waiting line that holds callback functions that are ready to run but must wait until the Call Stack becomes empty. JavaScript has two main queues with different priority.

**In simple words:** Two waiting lines outside the doctor's room — one VIP line (microtask) and one normal line (macrotask). VIPs always go first, and ALL VIPs finish before one normal patient is called.

---

## 4. What is a Microtask?

**Definition:** A microtask is a **high priority** callback that is queued in the microtask queue. After the current running code finishes, the Event Loop runs **every single microtask** (including new ones added while draining) before moving on to anything else.

**In simple words:** VIP patients. All of them are seen before a single normal patient goes in.

### Types of microtasks (each one explained)

#### a) `.then()` — Promise success handler

**Definition:** `.then()` registers a callback that runs when a promise is **fulfilled** (succeeds). It returns a **new promise**, so it can be chained.

```js
const promise = Promise.resolve("Data loaded");

promise.then((value) => {
  console.log(value); // "Data loaded"
  return value.toUpperCase();
})
.then((upper) => {
  console.log(upper); // "DATA LOADED"  ← chaining works because .then returns a promise
});
```

`.then()` can also take a second argument for errors: `.then(onSuccess, onError)`.

#### b) `.catch()` — Promise error handler

**Definition:** `.catch()` registers a callback that runs when a promise is **rejected** (fails), or when any earlier `.then()` in the chain throws an error. It is shorthand for `.then(null, errorFn)`.

```js
const promise = Promise.reject(new Error("Server down"));

promise
  .then((value) => console.log(value))     // skipped, because promise failed
  .catch((error) => console.log("Caught:", error.message)); // "Caught: Server down"
```

**Important:** one `.catch()` at the end of a chain catches errors from **all** the steps before it.

```js
fetchUser()
  .then((user) => fetchPosts(user.id))
  .then((posts) => console.log(posts))
  .catch((err) => console.log("Something failed:", err)); // catches any step
```

#### c) `.finally()` — always runs

**Definition:** `.finally()` registers a callback that runs **no matter what** — whether the promise succeeded or failed. It receives no value and does not change the result passing through it.

```js
showLoader();

fetchData()
  .then((data) => console.log("Success:", data))
  .catch((err) => console.log("Failed:", err))
  .finally(() => hideLoader()); // runs in BOTH cases - perfect for cleanup
```

**In simple words:** "Whatever happens — pass or fail — turn off the loading spinner."

#### d) `async/await` continuation

**Definition:** Everything written **after** an `await` line is internally converted into a microtask. The code before `await` runs synchronously; the code after it is queued.

```js
async function demo() {
  console.log("A");   // runs immediately (synchronous)
  await null;         // pause point
  console.log("B");   // this line becomes a MICROTASK
}

demo();
console.log("C");
// Output: A, C, B
```

#### e) `queueMicrotask()`

**Definition:** A built-in function that manually puts a callback into the microtask queue. Use it when you want something to run right after the current code but before timers.

```js
console.log("start");
queueMicrotask(() => console.log("microtask"));
console.log("end");
// Output: start, end, microtask
```

#### f) `MutationObserver`

**Definition:** A browser API that watches for changes in the DOM (added/removed nodes, attribute changes) and fires its callback as a microtask.

```js
const observer = new MutationObserver((mutations) => {
  console.log("DOM changed:", mutations.length, "change(s)");
});

observer.observe(document.body, { childList: true, subtree: true });
```

#### g) `process.nextTick()` — Node.js only

**Definition:** A Node.js function that queues a callback in a **special queue with even higher priority than promises**. The nextTick queue is fully drained before the promise microtask queue.

```js
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));
// Output: nextTick, promise
```

---

## 5. What is a Macrotask?

**Definition:** A macrotask (also called a "task") is a **normal priority** callback queued in the macrotask queue. The Event Loop runs **only ONE** macrotask per cycle, and then immediately drains the entire microtask queue again.

**In simple words:** Normal patients. Only one goes in per round, and after him all waiting VIPs go again.

### Types of macrotasks (each one explained)

#### a) `setTimeout(fn, delay)`

**Definition:** Runs a callback **once** after at least `delay` milliseconds. The delay is a **minimum wait**, not an exact time — the callback still has to wait for the stack and all microtasks to be clear.

```js
setTimeout(() => console.log("Runs after ~2 seconds"), 2000);

// Even with 0 ms, it still waits for sync code + microtasks
setTimeout(() => console.log("second"), 0);
console.log("first");
// Output: first, second
```

Cancel it with `clearTimeout(id)`:

```js
const id = setTimeout(() => console.log("never runs"), 1000);
clearTimeout(id);
```

#### b) `setInterval(fn, delay)`

**Definition:** Runs a callback **again and again**, every `delay` milliseconds, until you stop it with `clearInterval()`.

```js
let count = 0;
const id = setInterval(() => {
  count++;
  console.log("Tick", count);
  if (count === 3) clearInterval(id); // stop after 3 ticks
}, 1000);
```

#### c) `setImmediate(fn)` — Node.js only

**Definition:** Runs a callback in the **check phase** of the Node event loop, which happens right after the poll (I/O) phase. Meant for "run this as soon as the current I/O work is done".

```js
setImmediate(() => console.log("setImmediate runs after I/O"));
```

#### d) I/O callbacks

**Definition:** Callbacks from file reads, database queries and network requests. They are queued as macrotasks when the operating system finishes the work.

```js
const fs = require("fs");
fs.readFile("data.txt", "utf8", (err, data) => {
  console.log("File read finished"); // macrotask (I/O callback)
});
```

#### e) UI events and rendering

**Definition:** User events like `click`, `scroll`, `keydown`, and the browser's repaint work, are also scheduled as macrotasks.

```js
button.addEventListener("click", () => console.log("Clicked")); // macrotask
```

---

## 6. Priority table

| Priority | Queue | Contains |
|---|---|---|
| 1 (highest) | Synchronous code | Normal line-by-line code on the Call Stack |
| 2 | `process.nextTick` queue (Node only) | `process.nextTick()` |
| 3 | Microtask queue | `.then`, `.catch`, `.finally`, `await`, `queueMicrotask`, `MutationObserver` |
| 4 (lowest) | Macrotask queue | `setTimeout`, `setInterval`, `setImmediate`, I/O, UI events |

---

## 7. Example - the classic interview question

```js
console.log("1 - Start");

setTimeout(() => console.log("2 - setTimeout"), 0);

Promise.resolve().then(() => console.log("3 - Promise"));

console.log("4 - End");
```

**Output:**
```
1 - Start
4 - End
3 - Promise
2 - setTimeout
```

**Step-by-step why:**
1. `console.log("1 - Start")` → synchronous, prints immediately.
2. `setTimeout` → its callback goes to the **macrotask** queue.
3. `.then` → its callback goes to the **microtask** queue.
4. `console.log("4 - End")` → synchronous, prints immediately.
5. Stack is now empty → Event Loop drains the microtask queue → prints `3 - Promise`.
6. Microtask queue empty → Event Loop takes one macrotask → prints `2 - setTimeout`.

---

## 8. Example - with async/await

```js
console.log("1");

async function foo() {
  console.log("2");
  await null;          // everything after this becomes a microtask
  console.log("3");
}

foo();

setTimeout(() => console.log("4"), 0);

Promise.resolve().then(() => console.log("5"));

console.log("6");
```

**Output:** `1, 2, 6, 3, 5, 4`

| Step | Why |
|---|---|
| `1` | Synchronous |
| `2` | Synchronous (code before `await` runs immediately) |
| `6` | Synchronous |
| `3` | Microtask, queued first (from the `await`) |
| `5` | Microtask, queued second |
| `4` | Macrotask, always last |

---

## 9. Example - microtasks can starve macrotasks

```js
setTimeout(() => console.log("timeout"), 0);

Promise.resolve()
  .then(() => console.log("p1"))
  .then(() => console.log("p2"))
  .then(() => console.log("p3"));
```

**Output:** `p1, p2, p3, timeout`

Each `.then()` queues a **new** microtask while the queue is being drained, and the Event Loop must empty the whole microtask queue first. So all three promises finish before the 0 ms timer.

---

## 10. Example - Node.js order

```js
setTimeout(() => console.log("setTimeout"), 0);
setImmediate(() => console.log("setImmediate"));
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));

console.log("sync");
```

**Output:**
```
sync          ← synchronous code
nextTick      ← nextTick queue (highest priority queue)
promise       ← microtask queue
setTimeout    ← timers phase (macrotask)
setImmediate  ← check phase (macrotask)
```

---

## 11. Node.js Event Loop phases

**Definition:** In Node.js the event loop runs in 6 repeating phases. Each phase has its own queue of callbacks.

| Phase | What runs here |
|---|---|
| **1. Timers** | `setTimeout` and `setInterval` callbacks whose time is up |
| **2. Pending callbacks** | Some system-level callbacks (for example TCP errors) |
| **3. Idle / Prepare** | Internal use by Node only |
| **4. Poll** | Waits for new I/O events and runs I/O callbacks (file, network) |
| **5. Check** | `setImmediate` callbacks |
| **6. Close callbacks** | Cleanup callbacks like `socket.on("close")` |

**Very important:** between **every** phase, Node empties the `process.nextTick` queue first, then the promise microtask queue.

---

## 12. Practical takeaway

- `setTimeout(fn, 0)` does **not** mean "run now". It means "run after the current code and after all microtasks".
- Heavy synchronous work blocks everything, including the UI → split it into chunks.
- A very long promise chain can delay timers and screen repainting.

```js
// Break heavy work into chunks so the browser can paint between them
function processInChunks(items) {
  const chunk = items.splice(0, 100);
  chunk.forEach(doWork);
  if (items.length) setTimeout(() => processInChunks(items), 0);
}
```

## Key points

- JavaScript is single threaded → one Call Stack.
- Microtasks = high priority, the **whole queue** is drained at once.
- Macrotasks = normal priority, only **one runs** per event loop cycle.
- Order to remember: **Sync → nextTick (Node) → Microtasks → One Macrotask → repeat**.
