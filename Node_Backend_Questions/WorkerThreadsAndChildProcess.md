# Worker Threads, Child Processes and Clustering

All three exist to solve one problem: **Node's main thread must never be blocked**, but sometimes you have heavy work to do.

---

## 1. The problem

**Definition:** A CPU-bound task (a long loop, image processing, hashing, video encoding) runs on the main thread and **blocks the event loop**, freezing the server for every connected user.

```js
// ❌ This freezes the ENTIRE server for ~5 seconds
app.get("/compute", (req, res) => {
  let sum = 0;
  for (let i = 0; i < 1e10; i++) sum += i;    // nobody else gets served
  res.json({ sum });
});
```

**The three solutions:**

| Solution | Definition | Best for |
|---|---|---|
| **Worker Threads** | Extra threads **inside** the same process | CPU-heavy JavaScript |
| **Child Processes** | Completely **separate** processes | Running external programs/scripts |
| **Cluster** | Multiple **copies of your server** sharing one port | Using all CPU cores for traffic |

---

# PART 1 — Worker Threads

## 2. What are Worker Threads?

**Definition:** Worker Threads let you run JavaScript on **additional threads inside the same Node process**. Each worker has its own V8 instance and event loop, but they can share memory through `SharedArrayBuffer`.

**In simple words:** Hire extra chefs in the same kitchen. They work in parallel, and passing things between them is cheap.

```js
// main.js
const { Worker } = require("worker_threads");

app.get("/compute", (req, res) => {
  const worker = new Worker("./heavy-task.js", {
    workerData: { limit: 1e10 },       // data passed to the worker
  });

  worker.on("message", (result) => res.json({ result }));   // worker finished
  worker.on("error", (err) => res.status(500).json({ error: err.message }));
  worker.on("exit", (code) => {
    if (code !== 0) console.error(`Worker stopped with code ${code}`);
  });
  // The main thread is FREE - other requests are served normally
});
```

```js
// heavy-task.js
const { parentPort, workerData } = require("worker_threads");

let sum = 0;
for (let i = 0; i < workerData.limit; i++) sum += i;

parentPort.postMessage(sum);      // send the result back to the main thread
```

**The key exports of `worker_threads`:**

| Export | Definition |
|---|---|
| `Worker` | The class used to create a new worker thread |
| `isMainThread` | `true` in the main thread, `false` inside a worker |
| `parentPort` | The communication channel back to the parent |
| `workerData` | The data passed in when the worker was created |
| `MessageChannel` | Creates a two-way communication channel |
| `SharedArrayBuffer` | Memory that multiple threads can access directly |

**Two-way communication:**

```js
// Main thread
const worker = new Worker("./worker.js");
worker.postMessage({ cmd: "start", value: 42 });
worker.on("message", (msg) => console.log("From worker:", msg));

// worker.js
const { parentPort } = require("worker_threads");
parentPort.on("message", (msg) => {
  if (msg.cmd === "start") parentPort.postMessage(process(msg.value));
});
```

---

## 3. Worker pools (the production pattern)

**Definition:** Creating a worker is expensive (~10–30 ms and its own memory). In production you create a **pool** of workers once and reuse them, instead of spawning one per request.

```js
// Use a library rather than writing your own pool
const Piscina = require("piscina");

const pool = new Piscina({
  filename: "./heavy-task.js",
  maxThreads: 4,                  // usually = number of CPU cores
});

app.get("/compute", async (req, res) => {
  const result = await pool.run({ limit: 1e9 });   // reuses an idle worker
  res.json({ result });
});
```

**Libraries:** `piscina`, `workerpool`, `threads.js`.

---

# PART 2 — Child Processes

## 4. What is a Child Process?

**Definition:** A child process is a **completely separate OS process** launched from your Node application. It has its own memory and its own V8 instance, and communicates with the parent through streams or IPC messages.

## The four methods

**`spawn(command, args)`**
**Definition:** Launches a command and returns **streams** for stdin/stdout/stderr. Best for large outputs and long-running processes, because data arrives as it is produced.

```js
const { spawn } = require("child_process");

const ls = spawn("ls", ["-lh", "/usr"]);

ls.stdout.on("data", (data) => console.log(`Output: ${data}`));
ls.stderr.on("data", (data) => console.error(`Error: ${data}`));
ls.on("close", (code) => console.log(`Exited with code ${code}`));
```

**`exec(command, callback)`**
**Definition:** Runs a command **in a shell** and buffers the entire output, giving it to a callback at the end. Convenient, but limited by `maxBuffer` (1 MB by default).

```js
const { exec } = require("child_process");

exec("ls -lh /usr", (error, stdout, stderr) => {
  if (error) return console.error(error);
  console.log(stdout);
});
```

> ⚠️ **Security:** `exec` runs through a shell, so unsanitised user input allows **command injection**. Never do `exec("ls " + userInput)`. Use `spawn` with an args array instead.

**`execFile(file, args)`**
**Definition:** Like `exec`, but runs the file **directly without a shell** — safer and slightly faster.

**`fork(modulePath)`**
**Definition:** A special case of `spawn` for running **another Node.js file**, with a built-in IPC channel for `send()`/`on("message")`.

```js
// parent.js
const { fork } = require("child_process");

const child = fork("./child.js");
child.send({ task: "process", data: [1, 2, 3] });
child.on("message", (msg) => console.log("Result:", msg));

// child.js
process.on("message", (msg) => {
  const result = msg.data.map((n) => n * 2);
  process.send(result);
});
```

**Comparison:**

| Method | Shell | Output | Best for |
|---|---|---|---|
| `spawn` | No | **Streamed** | Large output, long-running commands |
| `exec` | **Yes** | Buffered (1 MB limit) | Short commands where you want the whole output |
| `execFile` | No | Buffered | Running an executable safely |
| `fork` | No | IPC messages | Running another **Node.js** script |

---

# PART 3 — Cluster

## 5. What is the Cluster module?

**Definition:** The `cluster` module creates multiple **copies (workers) of your entire server**, one per CPU core, all sharing the **same port**. The OS or Node distributes incoming connections between them.

**In simple words:** Node uses one CPU core by default. Clustering runs one Node process per core, so an 8-core machine can handle roughly 8× the traffic.

```js
const cluster = require("cluster");
const os = require("os");

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  console.log(`Primary ${process.pid} starting ${cpuCount} workers`);

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();                       // create one worker per core
  }

  // Restart a worker if it dies - keeps the server alive
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Every worker runs the actual server
  require("./server.js");
  console.log(`Worker ${process.pid} started`);
}
```

**Important consequence — workers do NOT share memory:**

```js
// ❌ BROKEN in a cluster - each worker has its OWN copy
let sessions = {};            // worker 1's sessions are invisible to worker 2
let cache = new Map();

// ✅ Use shared external storage
// Sessions → Redis
// Cache    → Redis
// State    → the database
```

This is also why **in-memory rate limiting and WebSocket rooms break** under clustering — they need a Redis adapter.

---

## 6. PM2 — clustering in practice

**Definition:** PM2 is a production process manager that handles clustering, restarts, logs and zero-downtime reloads, without you writing any cluster code.

```bash
pm2 start server.js -i max       # one instance per CPU core
pm2 start server.js -i 4         # exactly 4 instances
pm2 reload server                # zero-downtime restart
pm2 logs
pm2 monit
pm2 startup && pm2 save          # restart automatically on server reboot
```

Most teams use PM2 (or Kubernetes / Docker replicas) rather than the `cluster` module directly.

---

## 7. Which one should you use?

```
Is the work CPU-heavy JavaScript?
├── YES → Worker Threads (+ a pool like Piscina)
└── NO
    ├── Running an external program (ffmpeg, python, git)? → spawn / execFile
    ├── Running another Node script with messaging? → fork
    └── Just need to handle more traffic? → cluster / PM2
```

| | Worker Threads | Child Process | Cluster |
|---|---|---|---|
| **Creates** | A thread | A process | A process (copy of the server) |
| **Memory** | Shared process, can share buffers | Fully separate | Fully separate |
| **Startup cost** | Low (~10–30 ms) | High (~50–100 ms) | High |
| **Communication** | `postMessage`, SharedArrayBuffer | IPC / streams | IPC |
| **Purpose** | CPU-bound JS work | External programs | Scaling traffic across cores |

---

## 8. The better alternative for heavy work — a job queue

**Definition:** For genuinely heavy tasks (video encoding, report generation, sending 10,000 emails), do not do the work during the HTTP request at all. Put a **job** on a queue and let a separate worker service process it.

```js
const { Queue } = require("bullmq");
const videoQueue = new Queue("video-processing");

// API responds instantly
app.post("/upload", async (req, res) => {
  await videoQueue.add("encode", { videoId: req.body.id });
  res.json({ status: "queued" });      // returns in milliseconds
});
```

```js
// worker.js - a completely separate process, can be scaled independently
const { Worker } = require("bullmq");

new Worker("video-processing", async (job) => {
  await encodeVideo(job.data.videoId);   // takes minutes - does not matter
});
```

**Benefits:** the API stays fast, jobs survive a server restart, failed jobs retry automatically, and workers scale separately from the web servers.

---

## Key points

- Node's main thread must never be blocked by CPU-bound work.
- **Worker Threads** = extra threads in the same process; best for heavy **JavaScript** computation. Use a **pool** in production.
- **Child Processes** = separate processes; `spawn` (streamed), `exec` (buffered, shell — injection risk), `execFile` (safe), `fork` (another Node script with IPC).
- **Cluster** = one server copy per CPU core sharing a port; workers do **not** share memory, so sessions and caches must move to Redis.
- **PM2** does clustering for you in production.
- For genuinely long tasks, use a **job queue** (BullMQ) instead of any of the above.
