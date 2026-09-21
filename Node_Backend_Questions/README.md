# Node.js & Backend Interview Questions

📄 **[NodeImportantqueAns.md](NodeImportantqueAns.md)** — questions 1–39 (basics)
📄 **[NodeAdvancedQuestions.md](NodeAdvancedQuestions.md)** — questions 40–90 (advanced)

---

## Node.js Core & Architecture

| Topic | File | Covers |
|---|---|---|
| Node.js intro | [Node.md](Node.md) | What Node is, features |
| JavaScript vs Node | [JsVsNode.md](JsVsNode.md) | Browser JS vs server JS |
| **Architecture & Event Loop** | [NodeArchitecture.md](NodeArchitecture.md) | V8, libuv, thread pool, 6 phases, blocking vs non-blocking, `nextTick` vs `setImmediate` |
| **Modules: CJS vs ESM** | [ModulesCommonJSvsESM.md](ModulesCommonJSvsESM.md) | `require` vs `import`, caching, resolution, `ERR_REQUIRE_ESM` |
| **Streams & Buffers** | [StreamsAndBuffers.md](StreamsAndBuffers.md) | 4 stream types, backpressure, `pipeline()`, video streaming |
| **Worker Threads & Child Process** | [WorkerThreadsAndChildProcess.md](WorkerThreadsAndChildProcess.md) | Worker threads, spawn/exec/fork, cluster, job queues |
| Event Emitter | [EventEmitter.md](EventEmitter.md) | Node's event system |
| Cluster | [cluster.md](cluster.md) | Using multiple CPU cores |
| REPL | [REPL.md](REPL.md) | The interactive shell |
| DNS module | [DNS module.md](DNS%20module.md) | DNS lookups |
| Bun | [Bun.md](Bun.md) | The alternative runtime |

## Errors, Memory & Tooling

| Topic | File | Covers |
|---|---|---|
| **Error Handling & Memory** | [ErrorHandlingAndMemory.md](ErrorHandlingAndMemory.md) | Operational vs programmer errors, `uncaughtException`, graceful shutdown, memory leaks, profiling |
| **npm, Security & Performance** | [NpmAndSecurity.md](NpmAndSecurity.md) | package.json, semver, `npm ci`, injection attacks, helmet, performance checklist |

## Express & Middleware

| Topic | File | Covers |
|---|---|---|
| Express | [Express.md](Express.md) | The web framework |
| Middleware | [middleware.md](middleware.md) | What middleware is |
| Middleware Types | [MiddlewareTypes.md](MiddlewareTypes.md) | The five types |

## APIs & Communication

| Topic | File | Covers |
|---|---|---|
| RESTful API | [RestfulAPI.md](RestfulAPI.md) | REST principles |
| HTTP Components | [HTTPComponents.md](HTTPComponents.md) | Methods, status codes, headers |
| GraphQL | [Graph ql.md](Graph%20ql.md) | Alternative to REST |
| CORS | [Cors.md](Cors.md) | Cross-origin requests |
| Socket.io | [Socket.io.md](Socket.io.md) | Real-time library |
| WebSockets & Socket.IO | [Websockets&SocketIO.md](Websockets&SocketIO.md) | Both compared |
| Rate Limiter | [RateLimiter.md](RateLimiter.md) | Limiting request volume |

## Authentication & Security

| Topic | File | Covers |
|---|---|---|
| JWT | [jwt.md](jwt.md) | JSON Web Tokens |
| Authentication vs Authorization | [AuthenticationVSAuthorization.md](AuthenticationVSAuthorization.md) | The difference |
| Bcrypt | [Bcrypt.md](Bcrypt.md) | Password hashing |
| Encryption & bcrypt | [Encryption and bcrypt.md](Encryption%20and%20bcrypt.md) | Hashing vs encryption |
| Cookies | [Cookies.md](Cookies.md) | Cookie basics |
| View & Session state | [viewView-and-Session-state.md](viewView-and-Session-state.md) | Server-side state |

## Architecture & DevOps

| Topic | File | Covers |
|---|---|---|
| System Design | [SystemDesign.md](SystemDesign.md) | Design fundamentals |
| HLD vs LLD | [HLDvsLLD.md](HLDvsLLD.md) | High vs low level design |
| Microservices | [Microservices.md](Microservices.md) | Service-based architecture |
| Caching | [Caching.md](Caching.md) | Caching strategies |
| Redis | [Redis.md](Redis.md) | In-memory store |
| CDN | [CDN.md](CDN.md) | Content delivery networks |
| Docker & CI/CD | [../CICD_DevOps_Questions/](../CICD_DevOps_Questions/) | Containers, pipelines, Git workflow |
| Unit Testing | [Unitesting.md](Unitesting.md) | Testing basics |
| Firebase & Supabase | [FireBase And SupaBase.md](FireBase%20And%20SupaBase.md) | Backend-as-a-service |

---

## Advanced questions 40–90 ([NodeAdvancedQuestions.md](NodeAdvancedQuestions.md))

**Architecture & Event Loop (40–47)**
40. Is Node.js single-threaded or multi-threaded?
41. What is libuv?
42. What are the phases of the event loop?
43. Difference between `setImmediate`, `setTimeout(fn,0)` and `process.nextTick`?
44. What is the thread pool and what uses it?
45. Difference between CPU-bound and I/O-bound work?
46. What happens if you block the event loop?
47. Why can `process.nextTick` starve the event loop?

**Modules (48–52)**
48. Difference between CommonJS and ES Modules?
49. Difference between `module.exports` and `exports`?
50. What is module caching?
51. How do you get `__dirname` in ES Modules?
52. What causes `ERR_REQUIRE_ESM`?

**Streams & Buffers (53–58)**
53. What is a Buffer and why does Node need one?
54. Difference between `Buffer.alloc()` and `Buffer.allocUnsafe()`?
55. What are the four types of stream?
56. What is backpressure?
57. Why use `pipeline()` instead of `pipe()`?
58. How do you serve a 2 GB file without running out of memory?

**Concurrency (59–63)**
59. What are Worker Threads and when do you use them?
60. Difference between `spawn`, `exec`, `execFile` and `fork`?
61. What is the cluster module?
62. Worker Threads vs Cluster vs Child Process — which when?
63. Why do sessions break when you enable clustering?

**Error Handling (64–69)**
64. Difference between operational and programmer errors?
65. What should `uncaughtException` do?
66. How do you handle errors in async Express routes?
67. How does Express know a middleware is an error handler?
68. What is graceful shutdown and why does it matter?
69. What is an unhandled promise rejection?

**Memory & Performance (70–74)**
70. What causes memory leaks in Node?
71. How do you find a memory leak?
72. What does `process.memoryUsage()` return?
73. How do you profile a slow Node application?
74. How would you speed up a slow API?

**npm & Tooling (75–79)**
75. Difference between `dependencies`, `devDependencies` and `peerDependencies`?
76. What do `^` and `~` mean in versions?
77. Difference between `npm install` and `npm ci`?
78. Why must you commit `package-lock.json`?
79. What is npx?

**Security (80–85)**
80. How do you prevent NoSQL injection?
81. Why is `exec()` dangerous?
82. Where should a JWT be stored?
83. What does `helmet` do?
84. How do you prevent brute-force attacks?
85. Why should you never expose stack traces in production?

**Practical / Design (86–90)**
86. How do you handle file uploads in Node?
87. How do you implement pagination?
88. How would you schedule background jobs?
89. How do you keep secrets out of your code?
90. What is connection pooling and why does it matter?

---

**Related:** [../MongoDB_Interview_Questions/](../MongoDB_Interview_Questions/) for the database layer · [../Nextjs_Interview_Questions/AuthAndDeployment.md](../Nextjs_Interview_Questions/AuthAndDeployment.md) for auth in Next.js · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
