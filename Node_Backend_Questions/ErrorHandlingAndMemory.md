# Node.js Error Handling, Memory Leaks and Debugging

---

# PART 1 — Error Handling

## 1. The two kinds of errors

**Definition of an Operational Error:** An expected runtime problem in a correctly written program — a failed API call, invalid user input, a full disk, a database timeout. These **must be handled**.

**Definition of a Programmer Error:** A bug in your code — calling `undefined.foo`, passing the wrong type, a typo. These **should crash the process** so they get noticed and fixed, rather than being swallowed.

| | Operational | Programmer |
|---|---|---|
| Examples | Network timeout, 404, bad input | `TypeError`, `ReferenceError`, wrong argument |
| Cause | The outside world | Your code |
| Action | **Handle it** gracefully | **Let it crash**, then fix the bug |

> The rule: handle operational errors, do not try to "recover" from bugs. A process in an unknown state should restart.

---

## 2. Error-first callbacks

**Definition:** Node's original convention — the callback's **first argument is the error** (or `null` if it succeeded), and the data comes after.

```js
fs.readFile("file.txt", (err, data) => {
  if (err) {
    return console.error("Failed:", err);   // always handle it FIRST
  }
  console.log(data.toString());
});
```

---

## 3. Handling errors in each async style

```js
// 1. Callbacks - check the err argument
fs.readFile("f.txt", (err, data) => {
  if (err) return handleError(err);
});

// 2. Promises - always attach .catch()
fetchData()
  .then((data) => process(data))
  .catch((err) => handleError(err));

// 3. async/await - try/catch
async function getUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);   // fetch does NOT throw on 404!
    return await res.json();
  } catch (err) {
    logger.error({ err, id }, "Failed to fetch user");
    throw err;                    // re-throw so the caller knows
  }
}

// 4. Event emitters - an unhandled "error" event CRASHES the process
stream.on("error", (err) => handleError(err));    // ✅ always add this
```

---

## 4. Custom error classes

**Definition:** Extending the built-in `Error` class lets you attach a status code and distinguish error types with `instanceof`.

```js
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;          // marks it as an expected error
    Error.captureStackTrace(this, this.constructor);   // cleaner stack trace
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message, fields) {
    super(message, 400);
    this.fields = fields;
  }
}

// Usage
if (!user) throw new NotFoundError("User");
```

---

## 5. Express error handling

**Definition:** Express identifies an error-handling middleware by its **four** parameters `(err, req, res, next)`. It must be registered **last**, after all routes.

```js
// Async route errors must be forwarded with next()
app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError("User");
    res.json(user);
  } catch (err) {
    next(err);                    // hand it to the error middleware
  }
});

// A wrapper so you do not write try/catch in every route
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get("/users", asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);                // errors are caught automatically
}));

// 404 handler - after all routes
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// The global error handler - MUST have 4 parameters and come LAST
app.use((err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;

  logger.error({ err, url: req.originalUrl }, "Request failed");

  res.status(statusCode).json({
    error: err.isOperational ? err.message : "Internal server error",
    // Never leak stack traces in production
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});
```

> **Express 4 note:** it does **not** catch errors thrown in async handlers automatically — you must call `next(err)` or use a wrapper. Express 5 fixes this.

---

## 6. Global error handlers (the last resort)

**Definition:** These catch errors that escaped every other handler. Their only correct job is to **log the error and shut down gracefully** — not to keep running.

```js
// An exception that no try/catch caught
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception - shutting down");
  process.exit(1);                     // MUST exit - the state is unknown
});

// A rejected promise with no .catch()
process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason }, "Unhandled rejection - shutting down");
  process.exit(1);
});
```

> ⚠️ **Never** use `uncaughtException` to keep the server alive. After an uncaught exception the process may hold corrupted state, leaked resources or half-written data. Log it, exit, and let PM2/Docker/Kubernetes restart you.

---

## 7. Graceful shutdown

**Definition:** Closing the server properly when a shutdown signal arrives — stop accepting new requests, finish the in-flight ones, close database connections, then exit. Without it, users get dropped connections on every deploy.

```js
const server = app.listen(3000);

async function shutdown(signal) {
  console.log(`${signal} received - shutting down gracefully`);

  // 1. Stop accepting new connections; finish existing ones
  server.close(async () => {
    console.log("HTTP server closed");

    // 2. Close external connections
    await mongoose.connection.close();
    await redisClient.quit();

    console.log("All connections closed");
    process.exit(0);
  });

  // 3. Force exit if something hangs
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));   // sent by Docker/K8s/PM2
process.on("SIGINT", () => shutdown("SIGINT"));     // Ctrl+C
```

---

# PART 2 — Memory Leaks

## 8. What is a memory leak?

**Definition:** A memory leak happens when your program keeps references to objects it no longer needs, so the **garbage collector cannot free them**. Memory grows steadily until the process crashes with "JavaScript heap out of memory".

**Definition of Garbage Collection:** V8 automatically frees memory that is no longer **reachable** from the root. If anything still points to an object, it is kept — even if you never use it again.

---

## 9. The five common causes in Node

```js
// 1. GLOBAL VARIABLES that keep growing
let cache = {};                    // ❌ never cleared - grows forever
app.get("/data/:id", (req, res) => {
  cache[req.params.id] = heavyData;
});
// ✅ Fix: use an LRU cache with a size limit, or Redis with a TTL
const LRU = require("lru-cache");
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 });

// 2. FORGOTTEN TIMERS
setInterval(() => doSomething(bigObject), 1000);   // ❌ keeps bigObject alive forever
const timer = setInterval(...);                    // ✅ store and clear it
clearInterval(timer);

// 3. EVENT LISTENERS never removed
emitter.on("event", handler);                      // ❌ added on every request
emitter.off("event", handler);                     // ✅ remove when done
// Warning sign: "MaxListenersExceededWarning: 11 listeners added"

// 4. CLOSURES holding large objects
function createHandler() {
  const hugeData = new Array(1e6).fill("x");
  return () => console.log("hi");    // ❌ the closure keeps hugeData alive
}

// 5. Growing ARRAYS used as logs/queues
const requests = [];
app.use((req, res, next) => {
  requests.push(req);                // ❌ unbounded growth
  next();
});
```

---

## 10. Finding a memory leak

```bash
# 1. Watch memory over time
node --inspect server.js
# Open chrome://inspect → Memory → take heap snapshots before and after load

# 2. Compare two snapshots
#    Take snapshot → run load → take snapshot → compare "Delta"
#    Objects that keep growing between snapshots are your leak

# 3. Raise the heap limit (a workaround, not a fix)
node --max-old-space-size=4096 server.js
```

```js
// Log memory usage periodically
setInterval(() => {
  const m = process.memoryUsage();
  console.log({
    rss: `${Math.round(m.rss / 1024 / 1024)} MB`,        // total process memory
    heapUsed: `${Math.round(m.heapUsed / 1024 / 1024)} MB`, // JS objects in use
    heapTotal: `${Math.round(m.heapTotal / 1024 / 1024)} MB`,
    external: `${Math.round(m.external / 1024 / 1024)} MB`,  // Buffers, C++ objects
  });
}, 30000);
```

**The signature of a leak:** `heapUsed` climbs steadily and never returns to a baseline after traffic stops.

---

# PART 3 — Debugging and Profiling

## 11. Debugging

```bash
node --inspect server.js              # attach Chrome DevTools or VS Code
node --inspect-brk server.js          # pause on the first line
```

```js
// VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server.js",
  "skipFiles": ["<node_internals>/**"]
}
```

## 12. Profiling CPU

```bash
# Find which function is eating CPU
node --prof server.js
# ...generate load, then stop...
node --prof-process isolate-*.log > profile.txt

# Or use clinic.js - the easiest option
npx clinic doctor -- node server.js     # diagnoses the problem type
npx clinic flame -- node server.js      # flame graph of CPU usage
npx clinic bubbleprof -- node server.js # async operation delays
```

## 13. Logging

**Definition:** `console.log` is synchronous and blocks the event loop when writing to a file or pipe. Production applications use a structured, asynchronous logger.

```js
const pino = require("pino");           // pino is the fastest Node logger

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["password", "req.headers.authorization"],   // never log secrets
});

logger.info({ userId: 123 }, "User logged in");
logger.error({ err, orderId }, "Payment failed");
```

**Why structured (JSON) logs:** they can be searched, filtered and aggregated by tools like Datadog, Elasticsearch or CloudWatch. Plain strings cannot.

---

## Key points

- Distinguish **operational errors** (handle them) from **programmer errors** (crash and fix).
- Node's callback convention is **error-first**: `(err, data)`.
- Always attach `.catch()` to promises and an `error` listener to streams and emitters.
- An Express error handler needs **four parameters** and must be registered **last**.
- `uncaughtException` / `unhandledRejection` should **log and exit**, never keep running.
- Implement **graceful shutdown** on `SIGTERM` or every deploy drops live requests.
- Memory leaks come from globals, timers, listeners, closures and unbounded arrays.
- Find leaks with **heap snapshots**; profile CPU with **clinic.js**.
- Use a structured logger (**pino**/winston), not `console.log`, in production.
