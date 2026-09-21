# npm, package.json, Security and Performance

---

# PART 1 — npm and package.json

## 1. What is npm?

**Definition:** npm (Node Package Manager) is the default package manager for Node.js. It installs dependencies, manages versions and runs project scripts.

| Tool | Definition |
|---|---|
| **npm** | The default, bundled with Node |
| **yarn** | Faster installs, workspaces; created by Facebook |
| **pnpm** | Uses a shared store with hard links — **much** less disk space, very fast |
| **npx** | Runs a package **without installing** it (`npx create-react-app my-app`) |

---

## 2. package.json explained

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",              // makes .js files ES Modules
  "main": "index.js",            // entry point for CommonJS consumers
  "engines": { "node": ">=18" }, // required Node version

  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "build": "tsc"
  },

  "dependencies": {              // needed to RUN the app in production
    "express": "^4.18.2"
  },
  "devDependencies": {           // needed only to DEVELOP/build
    "nodemon": "^3.0.1",
    "jest": "^29.0.0"
  },
  "peerDependencies": {          // the HOST app must provide these
    "react": ">=18"
  }
}
```

**The three dependency types:**

| Type | Definition | Installed in production? |
|---|---|---|
| `dependencies` | Required at runtime | ✅ Yes |
| `devDependencies` | Only for development and building | ❌ No (`npm ci --omit=dev`) |
| `peerDependencies` | Must be supplied by the consuming project | Not auto-installed |

---

## 3. Semantic Versioning (semver)

**Definition:** Version numbers follow `MAJOR.MINOR.PATCH`, and each part signals what kind of change it is.

```
   4  .  18  .  2
   │      │      └── PATCH: bug fixes, fully backward compatible
   │      └───────── MINOR: new features, still backward compatible
   └──────────────── MAJOR: breaking changes
```

**Version range symbols:**

| Symbol | Meaning | `^4.18.2` allows |
|---|---|---|
| `^` (caret) | Allows MINOR and PATCH updates | 4.18.2 → 4.99.9, **not** 5.0.0 |
| `~` (tilde) | Allows PATCH updates only | 4.18.2 → 4.18.9, **not** 4.19.0 |
| exact | No updates at all | only 4.18.2 |
| `*` | Any version (dangerous) | anything |

---

## 4. package-lock.json

**Definition:** A file recording the **exact version** of every package and sub-dependency that was installed, plus their integrity hashes. It guarantees that every developer and every server installs an identical dependency tree.

**Always commit `package-lock.json`.** Without it, `^4.18.2` might install 4.18.2 on your machine and 4.25.0 on the server — the classic "works on my machine" bug.

```bash
npm install     # may UPDATE the lock file
npm ci          # installs EXACTLY the lock file - use this in CI/CD and Docker
```

**Definition of `npm ci`:** "Clean install" — it deletes `node_modules`, installs strictly from the lock file, and fails if `package.json` and the lock file disagree. It is faster and reproducible.

---

## 5. Useful npm commands

```bash
npm init -y                     # create package.json with defaults
npm install express             # add to dependencies
npm install -D nodemon          # add to devDependencies
npm install -g pm2              # install globally
npm uninstall express
npm update                      # update within the allowed ranges
npm outdated                    # show what is behind
npm audit                       # check for known vulnerabilities
npm audit fix                   # auto-fix where possible
npm ls express                  # show why a package is installed
npm run dev                     # run a script
npx cowsay hello                # run without installing
```

---

# PART 2 — Security

## 6. The main Node.js security risks

### a) Injection attacks

**Definition:** Passing unsanitised user input into a query or command, letting an attacker change what it does.

```js
// ❌ SQL injection
db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);
// input "1 OR 1=1" returns every user

// ✅ Parameterised query - the driver escapes it
db.query("SELECT * FROM users WHERE id = ?", [req.params.id]);

// ❌ NoSQL injection
User.find({ email: req.body.email });
// body { "email": { "$ne": null } } returns every user

// ✅ Force a string
User.find({ email: String(req.body.email) });
// plus express-mongo-sanitize to strip $ and . from input

// ❌ Command injection
exec(`convert ${req.body.filename} out.png`);
// filename "a.jpg; rm -rf /" is catastrophic

// ✅ No shell, arguments passed separately
execFile("convert", [req.body.filename, "out.png"]);
```

### b) Missing security headers

```js
const helmet = require("helmet");
app.use(helmet());       // sets ~12 protective headers in one line
```

**Definition of `helmet`:** Middleware that sets HTTP headers like `X-Frame-Options` (blocks clickjacking), `X-Content-Type-Options` (blocks MIME sniffing), `Strict-Transport-Security` (forces HTTPS) and a Content Security Policy.

### c) No rate limiting

```js
const rateLimit = require("express-rate-limit");

app.use("/api/login", rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 5,                        // 5 attempts per IP
  message: "Too many login attempts, try again later",
}));
```

Without this, an attacker can brute-force passwords freely.

### d) Weak authentication

```js
// ✅ Always hash passwords - never store plain text
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(input, hash);

// ✅ Store tokens in HttpOnly cookies, not localStorage
res.cookie("token", jwt, {
  httpOnly: true,     // JavaScript cannot read it → XSS-proof
  secure: true,       // HTTPS only
  sameSite: "strict", // CSRF protection
  maxAge: 3600000,
});

// ✅ Give the same error for both cases - avoids user enumeration
if (!user || !valid) return res.status(401).json({ error: "Invalid credentials" });
```

### e) No input validation

```js
const { z } = require("zod");

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
  password: z.string().min(8),
});

app.post("/users", (req, res, next) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  createUser(result.data);      // only validated data reaches your logic
});
```

**Never trust client-side validation** — it can be bypassed with curl in one second.

### f) Leaking information

```js
// ❌ Leaks your stack trace and file paths to attackers
app.use((err, req, res, next) => res.status(500).json({ stack: err.stack }));

// ✅ Generic message in production
app.use((err, req, res, next) => {
  logger.error({ err });
  res.status(500).json({ error: "Internal server error" });
});

app.disable("x-powered-by");    // stop advertising "Express"
```

### g) Vulnerable dependencies

```bash
npm audit                # list known CVEs
npm audit fix
npx snyk test            # deeper scanning
```

Enable **Dependabot** on GitHub for automatic security update PRs.

---

## 7. Security checklist

- [ ] Use parameterised queries (SQL and NoSQL)
- [ ] Validate and sanitise **all** input on the server (zod / joi)
- [ ] Hash passwords with bcrypt or argon2
- [ ] Store tokens in `HttpOnly` + `Secure` + `SameSite` cookies
- [ ] Add `helmet()` and configure CORS to specific origins
- [ ] Rate-limit authentication and expensive endpoints
- [ ] Keep secrets in environment variables, never in git
- [ ] Never expose stack traces in production
- [ ] Run `npm audit` regularly and keep dependencies updated
- [ ] Use HTTPS everywhere
- [ ] Limit request body size (`express.json({ limit: "10kb" })`)
- [ ] Check authorisation on **every** endpoint, not just authentication

---

# PART 3 — Performance

## 8. Node performance checklist

```js
// 1. Never block the event loop - offload CPU work to a worker
// 2. Use streams for large files instead of readFile
// 3. Cache expensive results in Redis
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
const data = await expensiveQuery();
await redis.setex(key, 300, JSON.stringify(data));

// 4. Enable gzip/brotli compression
app.use(require("compression")());

// 5. Use connection pooling for databases (do NOT connect per request)
// 6. Run requests in parallel, not sequentially
const [a, b] = await Promise.all([fetchA(), fetchB()]);    // ✅
// const a = await fetchA(); const b = await fetchB();      // ❌ waterfall

// 7. Index your database queries (the most common real bottleneck)
// 8. Paginate - never return 10,000 rows
// 9. Cluster/PM2 to use all CPU cores
// 10. Put a CDN in front of static assets
```

**Measuring:**

```bash
npx autocannon -c 100 -d 30 http://localhost:3000   # load test
npx clinic doctor -- node server.js                 # diagnose bottlenecks
```

> **The most common real-world cause of a slow Node API is not Node** — it is an unindexed database query or a sequential chain of awaits.

---

## Key points

- `dependencies` ship to production; `devDependencies` do not.
- `^` allows minor updates, `~` allows patch updates only.
- **Always commit `package-lock.json`** and use **`npm ci`** in CI/CD.
- Use parameterised queries and server-side validation — never trust the client.
- `helmet`, rate limiting, bcrypt and `HttpOnly` cookies are the security baseline.
- Never leak stack traces or advertise your framework in production.
- Performance: do not block the loop, use streams, cache, pool connections, parallelise with `Promise.all`, and index your database.
