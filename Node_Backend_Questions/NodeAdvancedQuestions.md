# Node.js Advanced Interview Questions and Answers

Questions 1–39 are in [NodeImportantqueAns.md](NodeImportantqueAns.md). This file covers the advanced topics interviewers move to next.

---

## Architecture & Event Loop

## 40. Is Node.js single-threaded or multi-threaded?

Both. **Your JavaScript** runs on a single thread, but **Node itself is multi-threaded** — libuv maintains a thread pool (4 threads by default) for file I/O, DNS lookups, crypto and compression. Network I/O does not use the pool; the OS kernel handles it.

## 41. What is libuv?

A C library that gives Node its **event loop**, its **thread pool**, and cross-platform async I/O. V8 runs your JavaScript; libuv handles everything asynchronous.

## 42. What are the phases of the event loop?

Six: **timers** → **pending callbacks** → **idle/prepare** → **poll** (I/O) → **check** (`setImmediate`) → **close callbacks**. Between every phase, Node drains the `process.nextTick` queue and then the promise microtask queue.

## 43. Difference between `setImmediate`, `setTimeout(fn, 0)` and `process.nextTick`?

`process.nextTick` has the highest priority and runs before promises. `setTimeout(fn, 0)` runs in the timers phase. `setImmediate` runs in the check phase. In the main module the order of the last two is **non-deterministic**, but inside an I/O callback `setImmediate` **always** runs first.

## 44. What is the thread pool and what uses it?

A pool of 4 background threads (set with `UV_THREADPOOL_SIZE`). Used by `fs` operations, `dns.lookup()`, `crypto.pbkdf2`, bcrypt and `zlib`. **Not** used by network I/O. Four concurrent bcrypt calls will saturate it and queue the fifth request.

## 45. What is the difference between CPU-bound and I/O-bound work?

I/O-bound work **waits** (database, network, disk) — Node excels at it. CPU-bound work **calculates** (image processing, hashing, big loops) — it blocks the single thread and must be moved to a worker thread, a child process or a job queue.

## 46. What happens if you block the event loop?

Every other request freezes. A 5-second loop means all users wait 5 seconds. Health checks fail, timeouts fire and load balancers may mark the instance as dead.

## 47. Why can `process.nextTick` starve the event loop?

Because the nextTick queue is drained **completely** before the loop continues. A recursive `process.nextTick(loop)` never lets the loop reach the next phase, freezing the process permanently.

---

## Modules

## 48. Difference between CommonJS and ES Modules?

CommonJS uses `require`/`module.exports`, loads **synchronously** and resolves at runtime. ESM uses `import`/`export`, loads **asynchronously**, is analysed statically (enabling tree shaking) and supports top-level `await`. ESM requires file extensions and has no `__dirname`.

## 49. Difference between `module.exports` and `exports`?

`exports` is a reference to `module.exports`. `exports.foo = bar` works, but `exports = {...}` breaks the link and exports nothing. To replace the whole export, assign to `module.exports`.

## 50. What is module caching?

Node caches a module after its first load, so `require()` returns the **same instance** every time. This is what makes the singleton pattern work — for example a single shared database connection.

## 51. How do you get `__dirname` in ES Modules?

```js
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Node 20.11+: import.meta.dirname
```

## 52. What causes `ERR_REQUIRE_ESM`?

A CommonJS file tried to `require()` an ESM-only package. Fix it with a dynamic `await import()`, or convert your project to ESM with `"type": "module"`.

---

## Streams & Buffers

## 53. What is a Buffer and why does Node need one?

A fixed-size chunk of raw binary memory outside the V8 heap. JavaScript strings cannot represent arbitrary binary data, so Buffers are used for files, network packets and encryption. `.length` counts **bytes**, not characters.

## 54. Difference between `Buffer.alloc()` and `Buffer.allocUnsafe()`?

`alloc()` zero-fills the memory. `allocUnsafe()` is faster but returns memory that may contain **old application data** — a security risk unless you overwrite every byte immediately.

## 55. What are the four types of stream?

**Readable** (read from), **Writable** (write to), **Duplex** (both), **Transform** (a Duplex that modifies data, like gzip).

## 56. What is backpressure?

When a readable stream produces data faster than the writable side can consume it, causing memory to grow. `write()` returns `false` when its buffer is full; you must pause until `drain` fires. **`pipe()` handles this automatically** — which is the main reason to use it.

## 57. Why use `pipeline()` instead of `pipe()`?

`pipe()` does not propagate errors or destroy the source stream on failure, which leaks file descriptors. `pipeline()` cleans up **every** stream and forwards errors properly. Always use it in production.

## 58. How do you serve a 2 GB file without running out of memory?

`fs.createReadStream(file).pipe(res)` — it reads ~64 KB at a time, so memory stays constant no matter how large the file is. `fs.readFile` would load all 2 GB per request.

---

## Concurrency

## 59. What are Worker Threads and when do you use them?

Additional threads **inside the same process**, each with its own V8 instance and event loop. Use them for CPU-heavy JavaScript. Creating one costs ~10–30 ms, so production code uses a **pool** (Piscina).

## 60. Difference between `spawn`, `exec`, `execFile` and `fork`?

`spawn` streams the output (best for large or long output). `exec` runs through a **shell** and buffers output (1 MB limit, **command-injection risk**). `execFile` runs a binary directly without a shell (safer). `fork` runs another **Node** script with a built-in IPC channel.

## 61. What is the cluster module?

It forks one copy of your server per CPU core, all sharing the same port, so Node can use all cores. Workers do **not** share memory — sessions, caches and WebSocket rooms must move to Redis.

## 62. Worker Threads vs Cluster vs Child Process — which when?

**Worker Threads** for CPU-heavy JavaScript. **Child Process** for running external programs. **Cluster** (or PM2) for scaling HTTP traffic across cores. For genuinely long tasks, use a **job queue** instead of all three.

## 63. Why do sessions break when you enable clustering?

Each worker is a separate process with its own memory, so an in-memory session store is invisible to the other workers. A user's next request may hit a different worker and appear logged out. Fix: store sessions in Redis.

---

## Error Handling

## 64. Difference between operational and programmer errors?

**Operational** errors are expected runtime problems (network timeout, bad input) — handle them. **Programmer** errors are bugs (`TypeError`, wrong argument) — let the process crash so they are found and fixed.

## 65. What should `uncaughtException` do?

**Log the error and exit.** After an uncaught exception the process may hold corrupted state or leaked resources. Never use it to keep the server running — let PM2/Docker restart the process.

## 66. How do you handle errors in async Express routes?

Express 4 does **not** catch them automatically. Either call `next(err)` in a `catch` block, or wrap handlers:
```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

## 67. How does Express know a middleware is an error handler?

By its **arity** — it must have exactly four parameters `(err, req, res, next)` and be registered **after** all routes.

## 68. What is graceful shutdown and why does it matter?

On `SIGTERM`, stop accepting new connections, finish in-flight requests, close database connections, then exit. Without it, **every deploy drops live user requests**.

## 69. What is an unhandled promise rejection?

A rejected promise with no `.catch()`. Since Node 15 this **terminates the process** by default. Always attach a `.catch()` or use `try/catch` with `await`.

---

## Memory & Performance

## 70. What causes memory leaks in Node?

Growing global variables/caches, forgotten `setInterval` timers, event listeners never removed, closures holding large objects, and unbounded arrays. The signature is `heapUsed` climbing and never returning to baseline.

## 71. How do you find a memory leak?

Run with `--inspect`, open `chrome://inspect`, take a **heap snapshot**, apply load, take another, then compare the delta. Objects growing between snapshots are the leak.

## 72. What does `process.memoryUsage()` return?

`rss` (total process memory), `heapTotal` (allocated heap), `heapUsed` (JS objects in use), `external` (Buffers and C++ objects) and `arrayBuffers`.

## 73. How do you profile a slow Node application?

`node --prof` plus `--prof-process`, or `npx clinic doctor` / `clinic flame`. Load test with `autocannon`. In practice, the bottleneck is usually an unindexed database query or sequential `await` calls, not Node itself.

## 74. How would you speed up a slow API?

Index the database queries, replace sequential awaits with `Promise.all`, add Redis caching, paginate results, enable compression, use connection pooling, stream large payloads, and cluster across cores.

---

## npm & Tooling

## 75. Difference between `dependencies`, `devDependencies` and `peerDependencies`?

`dependencies` are needed at runtime and ship to production. `devDependencies` are only for development and building. `peerDependencies` must be provided by the consuming project (common in plugins and libraries).

## 76. What do `^` and `~` mean in versions?

`^4.18.2` allows minor and patch updates (up to but not including 5.0.0). `~4.18.2` allows patch updates only (up to but not including 4.19.0).

## 77. Difference between `npm install` and `npm ci`?

`npm install` may update the lock file. `npm ci` deletes `node_modules` and installs **exactly** what the lock file says, failing if it disagrees with `package.json`. Use `npm ci` in CI/CD and Docker for reproducible builds.

## 78. Why must you commit `package-lock.json`?

It pins the exact version of every package and sub-dependency. Without it, different machines can resolve different versions of the same range — the classic "works on my machine" bug.

## 79. What is npx?

A tool that runs a package **without installing it globally**, for example `npx create-next-app`. It downloads, runs, and discards.

---

## Security

## 80. How do you prevent NoSQL injection?

Cast input to the expected type (`String(req.body.email)`), validate with zod/joi, and use `express-mongo-sanitize` to strip `$` and `.` from user input. Without this, `{ "email": { "$ne": null } }` returns every user.

## 81. Why is `exec()` dangerous?

It runs through a **shell**, so unsanitised input allows command injection — `"file.jpg; rm -rf /"` executes both commands. Use `execFile` or `spawn` with an arguments array instead.

## 82. Where should a JWT be stored?

In an **`HttpOnly` + `Secure` + `SameSite` cookie**. JavaScript cannot read it, so an XSS vulnerability cannot steal it. `localStorage` is readable by any injected script.

## 83. What does `helmet` do?

Sets around 12 protective HTTP headers in one line — `X-Frame-Options` (clickjacking), `X-Content-Type-Options` (MIME sniffing), `Strict-Transport-Security` (forces HTTPS) and a Content Security Policy.

## 84. How do you prevent brute-force attacks?

Rate-limit authentication endpoints (`express-rate-limit`), add account lockout or exponential backoff, use CAPTCHA after repeated failures, and return an **identical** error for wrong email and wrong password.

## 85. Why should you never expose stack traces in production?

They reveal file paths, library versions, and internal structure — a map for an attacker. Log them server-side and return a generic message.

---

## Practical / Design

## 86. How do you handle file uploads in Node?

Use `multer` for multipart form data. Validate the MIME type and file size, generate a new filename (never trust the client's), store outside the web root or in S3, and scan for malware if users share files.

## 87. How do you implement pagination?

Offset pagination (`skip`/`limit`) is simple but slow on deep pages. **Cursor pagination** (`where id < lastSeenId`) stays fast at any depth because it uses the index directly.

## 88. How would you schedule background jobs?

`node-cron` for simple periodic tasks in a single instance. For anything real, use a queue like **BullMQ** with Redis — it survives restarts, retries failures and scales workers independently.

## 89. How do you keep secrets out of your code?

Environment variables loaded from `.env` (git-ignored) in development, and the hosting platform's secret manager in production. Never commit `.env`; add it to `.gitignore` immediately.

## 90. What is connection pooling and why does it matter?

Reusing a set of open database connections instead of opening one per request. Opening a connection costs tens of milliseconds and databases limit total connections — without pooling, a traffic spike exhausts them and every query fails.

---

**Related deep-dive files:** [NodeArchitecture.md](NodeArchitecture.md) · [StreamsAndBuffers.md](StreamsAndBuffers.md) · [WorkerThreadsAndChildProcess.md](WorkerThreadsAndChildProcess.md) · [ModulesCommonJSvsESM.md](ModulesCommonJSvsESM.md) · [ErrorHandlingAndMemory.md](ErrorHandlingAndMemory.md) · [NpmAndSecurity.md](NpmAndSecurity.md)
