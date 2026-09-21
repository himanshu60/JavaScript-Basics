# Node.js Architecture - libuv, Thread Pool and the Event Loop

## 1. What is Node.js really?

**Definition:** Node.js is a **runtime environment** that lets JavaScript run outside the browser. It is built from three main parts:

| Part | Definition |
|---|---|
| **V8** | Google's JavaScript engine (from Chrome). It compiles and runs your JS code. |
| **libuv** | A C library that provides the **event loop**, the **thread pool**, and async file/network I/O. |
| **Node APIs** | The built-in modules (`fs`, `http`, `crypto`, `path`) that wrap libuv and expose it to JavaScript. |

```
Your JavaScript
      ↓
Node.js API (fs, http, crypto)
      ↓
Node bindings (C++)
      ↓
┌──────────────┬──────────────┐
│      V8      │    libuv     │
│ (runs JS)    │ (event loop  │
│              │  + threads)  │
└──────────────┴──────────────┘
      ↓
Operating System
```

---

## 2. Is Node.js single-threaded?

**Definition:** The answer is **"yes and no"** — and this is the most common Node interview trap.

- **Your JavaScript code** runs on **one single thread** (the main thread). Only one line of your code executes at a time.
- **Node itself is multi-threaded.** libuv maintains a **thread pool** (4 threads by default) that performs certain blocking operations in the background.

**In simple words:** You have one chef (the main thread) taking orders, but there are four assistants in the back doing the slow chopping work.

```js
// This is all on ONE thread - the second line waits for the first
const a = heavyCalculation();   // blocks everything
const b = anotherCalculation();

// But this is handed to the thread pool and does NOT block
fs.readFile("big.txt", (err, data) => { /* ... */ });
console.log("This runs immediately");
```

---

## 3. What is the libuv Thread Pool?

**Definition:** A pool of background threads (default **4**, configurable up to 1024) that libuv uses to run operations the operating system cannot do asynchronously on its own.

**What USES the thread pool:**

| Operation | Example |
|---|---|
| File system operations | `fs.readFile`, `fs.writeFile` |
| DNS lookups | `dns.lookup()` |
| Some crypto operations | `crypto.pbkdf2`, `crypto.randomBytes`, `bcrypt` |
| Compression | `zlib.gzip` |

**What does NOT use the thread pool** (the OS handles these asynchronously itself):

| Operation | Handled by |
|---|---|
| Network I/O (HTTP, TCP) | OS kernel (epoll / kqueue / IOCP) |
| `dns.resolve()` | The network, not the thread pool |

```js
// Change the pool size - must be set BEFORE any async work starts
process.env.UV_THREADPOOL_SIZE = 8;
```

**Why this matters:** four simultaneous `bcrypt.hash()` calls will saturate the pool, and a fifth request must **wait** — even though Node "is async". This is a real production bottleneck.

---

## 4. Blocking vs Non-blocking

**Definition of Blocking:** An operation that stops the main thread until it finishes. Nothing else — not even other users' requests — can be processed.

**Definition of Non-blocking:** An operation that is started and handed off, letting the main thread continue. A callback runs later when the result is ready.

```js
const fs = require("fs");

// ❌ BLOCKING - the entire server freezes for every user
const data = fs.readFileSync("large.txt");
console.log(data);
console.log("This waits");

// ✅ NON-BLOCKING - the server keeps serving other requests
fs.readFile("large.txt", (err, data) => {
  console.log(data);
});
console.log("This runs first");
```

**The golden rule:** never block the event loop. In a server, one blocking call freezes **every** connected user.

```js
// ❌ This freezes the server for ~3 seconds for EVERYONE
app.get("/slow", (req, res) => {
  let sum = 0;
  for (let i = 0; i < 1e10; i++) sum += i;    // CPU-bound, blocking
  res.json({ sum });
});
```

---

## 5. CPU-bound vs I/O-bound work

**Definition of I/O-bound:** Work that spends its time **waiting** for something external — a database, a file, a network request. Node is excellent at this.

**Definition of CPU-bound:** Work that spends its time **calculating** — image processing, encryption, large loops, video encoding. Node is **bad** at this on the main thread.

| Type | Examples | Node's fit |
|---|---|---|
| **I/O-bound** | API calls, DB queries, file reads, streaming | ✅ Excellent |
| **CPU-bound** | Image resizing, hashing, big loops, ML | ❌ Blocks the loop |

**How to handle CPU-bound work in Node:**
1. **Worker Threads** — run it on another thread in the same process
2. **Child processes / cluster** — run it in a separate process
3. **A job queue** (BullMQ + Redis) — offload it to a separate worker service
4. **A different language** for that specific service

> See [WorkerThreadsAndChildProcess.md](WorkerThreadsAndChildProcess.md).

---

## 6. The Event Loop phases

**Definition:** The event loop runs in **six repeating phases**. Each phase has its own queue of callbacks, and the loop drains that queue before moving to the next phase.

| # | Phase | What runs here |
|---|---|---|
| 1 | **Timers** | `setTimeout` and `setInterval` callbacks whose time has expired |
| 2 | **Pending callbacks** | Some deferred system callbacks (e.g. TCP errors) |
| 3 | **Idle / Prepare** | Internal use by Node only |
| 4 | **Poll** | Retrieve new I/O events; run I/O callbacks (file reads, incoming requests) |
| 5 | **Check** | `setImmediate` callbacks |
| 6 | **Close callbacks** | Cleanup callbacks like `socket.on("close")` |

**Critical rule:** between **every** phase, Node empties the `process.nextTick` queue first, then the Promise microtask queue.

```
   ┌───────────────────────────┐
┌─>│         timers            │  setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │          poll             │  I/O callbacks  ← most time is spent here
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │          check            │  setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘

   Between EVERY phase: nextTick queue → microtask (promise) queue
```

---

## 7. `setTimeout` vs `setImmediate` vs `process.nextTick`

**Definition of `process.nextTick(cb)`:** Runs the callback **immediately after the current operation completes**, before the event loop continues. It has the **highest** priority — even above promises.

**Definition of `setImmediate(cb)`:** Runs the callback in the **check phase**, right after the poll phase. Meaning: "run as soon as the current I/O work is done".

**Definition of `setTimeout(cb, 0)`:** Runs in the **timers phase** on the next loop iteration. The `0` is a *minimum* delay, not an exact one.

```js
console.log("1: sync");

setTimeout(() => console.log("2: setTimeout"), 0);
setImmediate(() => console.log("3: setImmediate"));
process.nextTick(() => console.log("4: nextTick"));
Promise.resolve().then(() => console.log("5: promise"));

console.log("6: sync");
```

**Output:**
```
1: sync
6: sync
4: nextTick       ← highest priority queue
5: promise        ← microtask queue
2: setTimeout     ← timers phase
3: setImmediate   ← check phase
```

**The famous edge case:** in the **main module**, the order of `setTimeout(fn, 0)` and `setImmediate(fn)` is **non-deterministic** — it depends on how fast the process starts.

```js
// Run this several times - the order can change!
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
```

**But inside an I/O callback, `setImmediate` ALWAYS wins**, because after the poll phase the check phase comes immediately, while timers must wait a full loop.

```js
fs.readFile("file.txt", () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// ALWAYS: immediate, then timeout
```

**⚠️ `process.nextTick` starvation:** because the nextTick queue is drained completely before the loop continues, a recursive `nextTick` will **freeze the event loop forever**.

```js
// ❌ Never do this - the event loop never progresses
function loop() {
  process.nextTick(loop);
}
```

---

## 8. Why Node scales well

**Definition:** Traditional servers (like classic Apache/PHP) use a **thread-per-request** model — 10,000 users means 10,000 threads, each using memory and requiring context switching.

Node uses **one thread + an event loop**. While request A waits for the database, the same thread serves requests B, C and D. This makes Node extremely efficient for **I/O-heavy** applications with many concurrent connections.

| Model | 10,000 concurrent users |
|---|---|
| Thread-per-request | 10,000 threads, heavy RAM, lots of context switching |
| Node's event loop | 1 thread + a queue, very low RAM |

**The trade-off:** that single thread must never be blocked. One heavy CPU task ruins it for everyone.

---

## Key points

- Node = **V8** (runs JS) + **libuv** (event loop + thread pool) + Node APIs.
- Your JavaScript is **single-threaded**, but Node internally uses a **4-thread pool**.
- The thread pool handles **file I/O, DNS lookup, crypto and zlib** — **not** network I/O.
- **Never block the event loop** — one blocking call freezes every user.
- Node is great for **I/O-bound** work, poor for **CPU-bound** work on the main thread.
- Six event loop phases; `nextTick` and microtasks run **between every phase**.
- `process.nextTick` > promises > timers > `setImmediate`.
- Inside an I/O callback, `setImmediate` always beats `setTimeout(fn, 0)`.
