# CI/CD, Docker and Git — Interview Questions and Answers

## CI/CD Concepts

## 1. What is CI/CD?

**CI (Continuous Integration)** means merging code into a shared branch frequently, with an automated pipeline building and testing every push. **CD** means either **Continuous Delivery** (always releasable, a human approves the deploy) or **Continuous Deployment** (every passing change deploys automatically).

## 2. Difference between Continuous Delivery and Continuous Deployment?

Both automate everything up to production. Continuous **Delivery** stops at a manual approval gate. Continuous **Deployment** has no gate — merging to main ships to users.

## 3. What are the typical stages of a pipeline?

Lint → type check → unit tests → integration tests → build → security scan → deploy to staging → smoke test → deploy to production. Fast, cheap checks go first so failures surface in seconds, not after a 10-minute test suite.

## 4. What does "build once, deploy many" mean?

Build a single artifact and promote that **exact** artifact through dev, staging and production. Rebuilding per environment means production runs something that was never tested. Configuration comes from environment variables at runtime.

## 5. What are the deployment strategies?

**Recreate** (stop then start — has downtime), **Rolling** (replace instances gradually), **Blue-Green** (two environments, switch the router, instant rollback), **Canary** (5% of traffic first, then increase), and **Feature flags** (ship disabled, enable at runtime).

## 6. What is blue-green deployment?

Two identical environments. Blue serves live traffic while Green receives the new version. After verification, the load balancer switches to Green. Rollback is switching back — seconds. The cost is running double infrastructure.

## 7. What is a canary release?

Routing a small percentage of traffic (say 5%) to the new version, monitoring error rate and latency, then gradually increasing. A bad release affects a fraction of users instead of everyone.

## 8. What are feature flags and why are they useful?

Conditions that enable or disable functionality at runtime without deploying. They **decouple deployment from release** — you can ship code disabled, enable it for 1% of users, and turn it off instantly if something breaks, with no rollback deploy.

## 9. How do you handle database migrations in CI/CD?

Migrations must be **backward compatible** with the currently running code, because during a rolling deploy both versions are live. For breaking changes use **expand and contract**: add the new column, write to both, backfill, switch reads, then drop the old column in a later release.

## 10. How do you roll back a bad deployment?

Redeploy the previous tagged artifact, or switch the router back in blue-green. It only works if artifacts are versioned (not just `latest`), database changes are backward compatible, and the process has been practised beforehand.

## 11. What should you monitor after a deploy?

The four golden signals: **latency** (p95/p99, not the average), **traffic**, **errors** (5xx rate) and **saturation** (CPU, memory, connection pool). Plus a health check endpoint so the platform can restart broken instances.

## 12. How do you manage secrets in a pipeline?

Never in the repository. Store them in GitHub Actions Secrets, AWS Secrets Manager, Vault or the hosting platform, and inject them as environment variables at runtime. Commit a `.env.example` with empty values. If a secret is ever committed, **rotate it** — deleting the commit does not remove it from history.

## 13. What are flaky tests and why are they a problem?

Tests that pass and fail non-deterministically, usually due to timing, shared state or real network calls. They are dangerous because they train the team to ignore red builds — which means a genuine failure gets ignored too. Fix them or quarantine them.

## 14. Your pipeline takes 40 minutes. How do you speed it up?

Cache dependencies, run independent jobs in parallel, run only tests affected by the change, use a matrix only where it adds value, move slow end-to-end tests to a nightly run, and use Docker layer caching.

## 15. What is the difference between staging and production?

Staging mirrors production (same versions, same config shape) but with anonymised data and no real users. Any difference between the two is where "only breaks in production" bugs come from.

---

## Docker

## 16. What is Docker and what problem does it solve?

Docker packages an application with all its dependencies and runtime into an image that runs identically anywhere. It solves "works on my machine" by shipping the environment with the code.

## 17. Difference between an image and a container?

An **image** is a read-only template (the blueprint). A **container** is a running instance of it. One image can produce many containers.

## 18. Difference between Docker and a virtual machine?

A VM virtualises hardware and runs a full guest OS — gigabytes, boots in minutes. A container virtualises the OS and **shares the host kernel** — megabytes, starts in milliseconds. VMs give stronger isolation; containers give far higher density.

## 19. What is a multi-stage build?

Using multiple `FROM` stages so build tools, dev dependencies and source code stay in an intermediate stage and never reach the final image. It commonly reduces an image from over 1 GB to around 150 MB.

## 20. How does Docker layer caching work and how do you optimise for it?

Each Dockerfile instruction creates a cached layer. Changing an instruction invalidates it **and every layer after it**. So copy `package.json` and run `npm ci` **before** copying source code — otherwise every code change re-installs all dependencies.

## 21. What is a `.dockerignore` and why does it matter?

It excludes files from the build context. Without it, `node_modules`, `.git` and `.env` get sent to the daemon — slowing builds, busting the cache and potentially leaking secrets into the image.

## 22. Why should a container not run as root?

If an attacker escapes the container or exploits the app, running as root gives them far more power on the host. Create a non-root user and add `USER nodejs` before `CMD`.

## 23. How do you persist data in Docker?

With **volumes**. A container's filesystem is destroyed when it is removed, so databases mount a named volume: `-v pgdata:/var/lib/postgresql/data`.

## 24. Why should you never put secrets in a Dockerfile?

`ENV API_KEY=secret` is readable by anyone running `docker history`. Even deleting the file in a later layer leaves it in the earlier one. Pass secrets at runtime with `-e`, `--env-file` or a secrets manager.

## 25. What is Docker Compose?

A tool for defining multi-container applications in one YAML file — your app plus Postgres plus Redis — started with `docker compose up`.

## 26. In Compose, why does `localhost` not work between services?

Each container has its own network namespace, so `localhost` refers to that container itself. Compose creates a network where services are reachable by **service name** — use `db:5432`, not `localhost:5432`.

## 27. What is a health check in Docker?

A command the daemon runs periodically to verify the container is actually working, not just running. Orchestrators use it to restart unhealthy containers and to know when a new container is ready to receive traffic.

## 28. How do you reduce Docker image size?

Use alpine or slim base images, multi-stage builds, install only production dependencies (`npm ci --omit=dev`), clean package caches in the same `RUN` layer, and add a `.dockerignore`.

## 29. What is the difference between `CMD` and `ENTRYPOINT`?

`ENTRYPOINT` sets the executable that always runs; `CMD` provides default arguments that are easy to override at `docker run`. Using `CMD` alone is fine for most applications.

## 30. What is Kubernetes and when do you need it?

An orchestrator that manages containers across many machines — scheduling, scaling, self-healing, rolling updates and service discovery. You need it when you are running many services across multiple hosts. For a single app, a managed platform (Render, Fly, ECS) is simpler and usually sufficient.

---

## Git

## 31. Difference between merge and rebase?

**Merge** creates a merge commit joining two branches, preserving true history. **Rebase** replays your commits on top of another branch, producing linear history but **rewriting commit hashes**.

## 32. When should you never rebase?

On any branch other people have pulled. Rebasing rewrites hashes, so their history diverges from yours and the next merge produces duplicate commits and conflicts.

## 33. Difference between `git reset` and `git revert`?

`reset` moves the branch pointer backwards and rewrites history — safe only on local, unpushed commits. `revert` creates a **new** commit that undoes the old one — safe on shared branches. Use `revert` for anything already pushed.

## 34. Difference between `git fetch` and `git pull`?

`fetch` downloads remote changes without touching your working branch. `pull` is `fetch` followed by `merge` (or `rebase` with `--rebase`).

## 35. What is `git stash` for?

Temporarily shelving uncommitted work so you can switch branches. `git stash -u` includes untracked files; `git stash pop` reapplies and removes it from the stash.

## 36. You committed to the wrong branch. How do you fix it?

```bash
git reset --soft HEAD~1      # undo the commit, keep the changes staged
git stash
git switch correct-branch
git stash pop
git commit -m "..."
```

## 37. How do you recover a commit after `git reset --hard`?

`git reflog` lists every position HEAD has held, including the "lost" commit. Find the SHA and `git reset --hard <sha>`. Reflog entries survive around 30 days.

## 38. What are the branching strategies?

**Git Flow** (main + develop + feature/release/hotfix — suits versioned software), **GitHub Flow** (short branches off an always-deployable main — suits most web teams), and **Trunk-based** (commit to main daily, hide incomplete work behind feature flags — suits high-velocity teams with strong tests).

## 39. What is `git cherry-pick`?

Applying a single commit from one branch onto another. Commonly used to pull a hotfix from `main` into a release branch without merging everything else.

## 40. What is `git bisect`?

A binary search through history to find the commit that introduced a bug. You mark a known-good and known-bad commit; git checks out midpoints for you to test until it identifies the culprit.

## 41. How do you resolve a merge conflict?

Run `git status` to list conflicted files, edit each one removing **all** the `<<<<<<<`, `=======`, `>>>>>>>` markers, `git add` them, then `git commit` (merge) or `git rebase --continue` (rebase).

## 42. What makes a good pull request?

Small (ideally under 400 lines), single-purpose, with a title and description explaining what and why, passing CI before review is requested, and self-reviewed first.

## 43. What is squash merging and when would you use it?

Collapsing all commits on a feature branch into a single commit on main. It keeps history readable when the branch contains "wip" and "fix typo" commits — the most common default for web teams.

## 44. What are conventional commits?

A message format — `type(scope): subject` with types like `feat`, `fix`, `docs`, `refactor`, `chore` — that makes history scannable and enables automated changelogs and semantic versioning.

## 45. What are branch protection rules worth enabling?

Require passing status checks, require at least one approving review, require the branch to be up to date before merging, and block force pushes to `main`.

---

## Practical / Scenario

## 46. Production is broken after a deploy. Walk me through what you do.

Roll back first, investigate second — restore service before diagnosing. Then check the deploy diff, error logs and monitoring dashboards to identify the cause, reproduce it in staging, fix it with a test that would have caught it, and write a blameless postmortem covering why the pipeline let it through.

## 47. How would you set up CI/CD for a Node.js app from scratch?

On every PR: install with `npm ci`, lint, type check, run unit and integration tests against a service container database, and build. On merge to main: build a Docker image tagged with the commit SHA, push it to a registry, deploy to staging, run smoke tests, then deploy to production behind a manual approval. Store secrets in the platform's secret store and keep the previous image for rollback.

## 48. How do you prevent a broken `main` branch?

Branch protection requiring a green pipeline and review before merge, plus requiring the branch to be up to date so it is tested against the latest main.

## 49. A test passes locally but fails in CI. How do you debug it?

Compare the environments — Node version, OS, timezone, locale, missing environment variables, test ordering (CI may run in a different order or in parallel), and reliance on state left by another test. Reproduce it by running the suite in the same Docker image CI uses.

## 50. How would you deploy with zero downtime?

Rolling or blue-green deployment, with health checks so traffic only reaches ready instances, graceful shutdown on `SIGTERM` so in-flight requests finish, and backward-compatible database migrations so both versions can run simultaneously.

---

**Related:** [CICDFundamentals.md](CICDFundamentals.md) · [GitHubActionsAndDocker.md](GitHubActionsAndDocker.md) · [GitWorkflow.md](GitWorkflow.md) · [Docker.md](Docker.md)
