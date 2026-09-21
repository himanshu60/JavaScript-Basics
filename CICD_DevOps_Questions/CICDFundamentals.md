# CI/CD Fundamentals

## 1. What is CI/CD?

**Definition of CI (Continuous Integration):** The practice of merging every developer's code into a shared branch frequently — usually several times a day — where an **automated pipeline builds it and runs the tests** on every push. The goal is to catch integration problems within minutes instead of weeks.

**Definition of CD (Continuous Delivery):** Every change that passes CI is automatically prepared into a **releasable artifact**, so you *could* deploy to production at any moment with a single manual approval.

**Definition of CD (Continuous Deployment):** One step further — every change that passes the pipeline is deployed to production **automatically**, with no human approval step.

```
Continuous Integration  → build + test on every push
Continuous Delivery     → always ready to deploy, human clicks the button
Continuous Deployment   → deploys itself, no button
```

**In simple words:** CI is "does the code still work when we combine it?". CD is "can we ship it safely, on demand, without a two-day manual ritual?".

---

## 2. Why it matters

| Without CI/CD | With CI/CD |
|---|---|
| Bugs found weeks later, during a painful merge | Bugs found in minutes, on the commit that caused them |
| Manual deploys — slow, inconsistent, error-prone | One repeatable, scripted process |
| "It works on my machine" | Built in a clean environment every time |
| Releases are risky events people dread | Small, frequent, boring releases |
| Rollback means panic | Rollback is a documented one-step action |

**The core idea:** small, frequent changes are far safer than large, rare ones. If a deploy contains 3 commits, finding the broken one is trivial. If it contains 300, it is a week of bisecting.

---

## 3. The pipeline stages

**Definition of a Pipeline:** An automated sequence of stages a code change passes through on its way to production. If any stage fails, the pipeline stops and nothing is promoted.

```
┌──────┐  ┌───────┐  ┌──────┐  ┌──────┐  ┌────────┐  ┌────────┐  ┌──────────┐
│ Push │→ │ Lint  │→ │ Test │→ │Build │→ │Security│→ │ Deploy │→ │ Smoke    │
│      │  │Format │  │      │  │      │  │  Scan  │  │ Staging│  │ Test/Prod│
└──────┘  └───────┘  └──────┘  └──────┘  └────────┘  └────────┘  └──────────┘
```

| Stage | Definition | Typical tools |
|---|---|---|
| **Lint / Format** | Static checks for style and obvious errors | ESLint, Prettier |
| **Type check** | Verify types compile | TypeScript `tsc` |
| **Unit tests** | Test individual functions in isolation | Jest, Vitest |
| **Integration tests** | Test modules working together, with a real DB | Supertest, Testcontainers |
| **Build** | Compile/bundle into a deployable artifact | Vite, webpack, `docker build` |
| **Security scan** | Check dependencies and code for known issues | `npm audit`, Snyk, Trivy |
| **Deploy** | Push the artifact to an environment | Docker, Kubernetes, Vercel |
| **Smoke test** | Verify the deployed app actually responds | curl a health endpoint, Playwright |

**Ordering principle:** put the **fastest and most likely to fail** stages first. Linting takes 10 seconds and catches a lot — run it before a 10-minute test suite.

---

## 4. Environments

**Definition:** Separate, isolated copies of the application used at different stages of confidence.

| Environment | Purpose | Data |
|---|---|---|
| **Local** | Developer's machine | Fake / seeded |
| **Development** | Shared integration of in-progress work | Fake |
| **Staging / UAT** | Mirror of production for final verification | Anonymised copy of production |
| **Production** | Real users | Real |

**The rule:** staging should match production as closely as possible — same Node version, same database engine, same environment variable names. A bug that only appears in production usually traces back to a difference between the two.

---

## 5. Build once, deploy many

**Definition:** The most important CI/CD principle. Build **one** artifact, then promote that **exact same artifact** through dev → staging → production. Never rebuild per environment.

```
❌ WRONG                          ✅ RIGHT
build for dev     → deploy       build once → artifact v1.2.3
build for staging → deploy                 ├→ deploy to dev
build for prod    → deploy                 ├→ deploy to staging
                                           └→ deploy to prod
```

**Why:** if you rebuild for production, you are shipping something that was **never tested**. A dependency could have published a new patch version between builds. Configuration comes from environment variables at **runtime**, not from a rebuild.

---

## 6. Artifacts and versioning

**Definition of an Artifact:** The packaged, deployable output of a build — a Docker image, a `.zip`, a compiled bundle. It must be immutable and uniquely versioned.

```bash
# Tag with the git SHA so every build is traceable to a commit
docker build -t myapp:$GITHUB_SHA .
docker tag myapp:$GITHUB_SHA myapp:latest
```

**Definition of Semantic Versioning:** `MAJOR.MINOR.PATCH` — major for breaking changes, minor for new backward-compatible features, patch for bug fixes.

---

## 7. Deployment strategies

### Recreate (big bang)

**Definition:** Stop the old version, start the new one. Simple, but causes **downtime**.

```
[v1 running] → [stopped] → [v2 running]
              ↑ downtime
```
Fine for internal tools, unacceptable for customer-facing services.

### Rolling deployment

**Definition:** Replace instances a few at a time. No downtime, but both versions run simultaneously for a while.

```
[v1][v1][v1][v1] → [v2][v1][v1][v1] → [v2][v2][v1][v1] → [v2][v2][v2][v2]
```
**Requirement:** v1 and v2 must be compatible with the same database schema during the overlap.

### Blue-Green

**Definition:** Run two identical environments. "Blue" serves live traffic while "Green" gets the new version. Once Green is verified, switch the load balancer. Rollback is switching back — seconds.

```
Blue (v1) ← 100% traffic        Blue (v1) ← 0%
Green (v2) ← 0% (testing)  →    Green (v2) ← 100%
```
**Cost:** you pay for double the infrastructure during the switch.

### Canary

**Definition:** Release to a small percentage of users first (5%), watch error rates and latency, then gradually increase to 100%. A bad release affects 5% of users, not everyone.

```
v2 ← 5% traffic → monitor → 25% → monitor → 50% → 100%
```
Best strategy for high-traffic products, but needs good monitoring to be meaningful.

### Feature flags

**Definition:** Ship the code disabled, then enable it for specific users at runtime without deploying again. This **decouples deployment from release**.

```js
if (featureFlags.isEnabled("new-checkout", user)) {
  return <NewCheckout />;
}
return <OldCheckout />;
```
**Benefit:** if something breaks, flip the flag off instantly — no rollback deploy needed.

| Strategy | Downtime | Rollback speed | Cost | Best for |
|---|---|---|---|---|
| Recreate | Yes | Slow | Low | Internal tools |
| Rolling | No | Medium | Low | Default choice |
| Blue-Green | No | **Instant** | High (2×) | Critical services |
| Canary | No | Fast | Medium | High-traffic products |
| Feature flags | No | **Instant** | Low | Risky features |

---

## 8. Database migrations in a pipeline

**Definition:** The hardest part of CI/CD, because a database has **state** — you cannot just roll it back like code.

**The safe pattern for a breaking change — expand and contract:**

```
Step 1 (deploy 1): ADD the new column, keep the old one. Code writes BOTH.
Step 2:            Backfill existing rows.
Step 3 (deploy 2): Code reads from the new column only.
Step 4 (deploy 3): DROP the old column.
```

Each step is independently deployable and rollback-safe. Renaming a column in one deploy breaks every running instance of the old code during a rolling update.

**Rules:**
- Migrations run **before** the new code is deployed
- Migrations must be **backward compatible** with the currently running version
- Never write a destructive migration (`DROP COLUMN`) in the same release that stops using it
- Always take a backup before running migrations in production

---

## 9. Rollback

**Definition:** Returning to the previous known-good version when a deploy goes wrong.

```bash
# Container platforms make this trivial if you tagged properly
kubectl rollout undo deployment/myapp
docker service update --rollback myapp

# With blue-green, just switch the router back
```

**Requirements for rollback to actually work:**
1. Artifacts are versioned and kept (do not only tag `latest`)
2. Database changes are backward compatible
3. The process is **documented and practised**, not improvised at 2am

---

## 10. What to monitor after a deploy

**Definition of the Four Golden Signals:** the minimum set of metrics that tell you whether a service is healthy.

| Signal | What it tells you |
|---|---|
| **Latency** | How long requests take (watch p95/p99, not the average) |
| **Traffic** | Requests per second |
| **Errors** | Rate of 5xx responses and exceptions |
| **Saturation** | CPU, memory, disk, connection pool usage |

Add a **health check endpoint** so the platform can detect and restart a broken instance:

```js
app.get("/health", async (req, res) => {
  try {
    await db.ping();                        // is the DB reachable?
    res.status(200).json({ status: "ok", uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: "unhealthy" });
  }
});
```

---

## 11. Secrets management

**Definition:** Secrets (API keys, database passwords, tokens) must never live in the repository. They are injected at runtime from a secure store.

```bash
# ❌ Never
DATABASE_URL="postgres://user:realpassword@host/db"   # committed to git

# ✅ Committed as an example only
# .env.example
DATABASE_URL=
JWT_SECRET=
```

**Where secrets actually live:** GitHub Actions Secrets, AWS Secrets Manager, HashiCorp Vault, Doppler, or the hosting platform's environment variable settings.

**If a secret is ever committed:** rotate it immediately. Deleting the commit is not enough — it stays in the git history and in every clone.

---

## 12. Common CI/CD problems

| Problem | Cause | Fix |
|---|---|---|
| **Flaky tests** | Timing, shared state, real network calls | Fix or quarantine them — a red build nobody trusts is useless |
| **Slow pipeline** | No caching, sequential jobs | Cache dependencies, run jobs in parallel |
| **Works locally, fails in CI** | Different Node/OS version, missing env var | Pin versions, build in Docker |
| **Secrets leaked in logs** | Printing env vars | Mask secrets; never `console.log(process.env)` |
| **Broken main branch** | Merging without a passing build | Require status checks before merge |
| **Cannot reproduce a build** | Using `latest` tags, no lock file | Pin versions, commit the lock file, use `npm ci` |

---

## Key points

- **CI** = automatic build and test on every push. **CD** = always releasable (delivery) or auto-deployed (deployment).
- Put fast, cheap checks first in the pipeline.
- **Build once, deploy many** — never rebuild per environment; config comes from env vars at runtime.
- Know the strategies: recreate, rolling, blue-green, canary, feature flags — and their rollback speed.
- Database migrations must be **backward compatible**; use expand-and-contract for breaking changes.
- Rollback only works if artifacts are versioned and the process is practised.
- Secrets never go in git; if one leaks, rotate it.
- Monitor latency, traffic, errors and saturation after every deploy.
