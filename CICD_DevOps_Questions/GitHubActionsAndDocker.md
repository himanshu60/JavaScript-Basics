# GitHub Actions and Docker

---

# PART 1 — GitHub Actions

## 1. The building blocks

**Definition of a Workflow:** A YAML file in `.github/workflows/` describing an automated process. It is triggered by an event.

**Definition of an Event:** What starts the workflow — a push, a pull request, a schedule, or a manual trigger.

**Definition of a Job:** A group of steps that run on the same machine (runner). Jobs run **in parallel** by default.

**Definition of a Step:** A single task — either a shell command (`run`) or a reusable action (`uses`).

**Definition of a Runner:** The virtual machine executing the job (`ubuntu-latest`, `windows-latest`, or self-hosted).

```
Workflow
 └── Job (runs on a runner)
      └── Step (run a command, or use an action)
```

---

## 2. A complete CI workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:                                   # WHEN to run
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:                         # spin up a real database for integration tests
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5
        ports: ['5432:5432']

    steps:
      - uses: actions/checkout@v4     # clone the repo

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'                # cache ~/.npm between runs - big speedup

      - run: npm ci                   # ci, not install - respects the lock file exactly

      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --coverage
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test

      - run: npm run build

      - uses: actions/upload-artifact@v4    # keep the build output
        with:
          name: dist
          path: dist/
```

---

## 3. Key concepts

### Matrix builds

**Definition:** Run the same job across multiple configurations in parallel — several Node versions, several operating systems.

```yaml
jobs:
  test:
    strategy:
      fail-fast: false               # do not cancel the others when one fails
      matrix:
        node: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```
This creates 6 parallel jobs.

### Job dependencies

**Definition:** `needs` makes one job wait for another. Without it, jobs run in parallel.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps: [...]

  deploy:
    needs: test                       # only runs if "test" succeeded
    if: github.ref == 'refs/heads/main'     # and only on main
    runs-on: ubuntu-latest
    environment: production           # can require manual approval
    steps: [...]
```

### Secrets

**Definition:** Encrypted values stored in repository settings and injected as environment variables. They are automatically **masked** in logs.

```yaml
steps:
  - run: ./deploy.sh
    env:
      API_KEY: ${{ secrets.API_KEY }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

> ⚠️ Secrets are **not** available to workflows triggered by `pull_request` from a fork — a deliberate security measure so outsiders cannot open a PR that prints your keys.

### Caching

**Definition:** Saving directories between runs so dependencies are not re-downloaded every time.

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: ${{ runner.os }}-node-
```
The key includes a hash of the lock file, so the cache invalidates automatically when dependencies change.

### Concurrency

**Definition:** Prevents overlapping runs — cancels an in-progress run when a new commit is pushed to the same branch.

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

## 4. A deployment workflow

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha         # reuse layer cache across runs
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production            # protection rules can require approval
    steps:
      - name: Deploy
        run: curl -X POST ${{ secrets.DEPLOY_HOOK_URL }}

      - name: Smoke test
        run: |
          sleep 30
          curl -f https://myapp.com/health || exit 1
```

Note the image is tagged with `github.sha` — that is what makes rollback possible.

---

# PART 2 — Docker

## 5. What is Docker?

**Definition:** Docker packages an application together with **all its dependencies, libraries and runtime** into a single unit called an **image**, which runs identically on any machine that has Docker.

**In simple words:** It solves "works on my machine" by shipping the machine along with the code.

| Term | Definition |
|---|---|
| **Image** | A read-only template — the blueprint. Built from a Dockerfile. |
| **Container** | A running instance of an image. Many containers from one image. |
| **Dockerfile** | The recipe describing how to build the image |
| **Registry** | Where images are stored and shared (Docker Hub, GHCR, ECR) |
| **Volume** | Persistent storage that survives container restarts |
| **Layer** | Each Dockerfile instruction creates a cached layer |

---

## 6. Containers vs Virtual Machines

**Definition:** A VM virtualises **hardware** and runs a full guest operating system. A container virtualises the **operating system** and shares the host kernel.

```
VIRTUAL MACHINES                 CONTAINERS
┌─────┬─────┬─────┐              ┌─────┬─────┬─────┐
│ App │ App │ App │              │ App │ App │ App │
├─────┼─────┼─────┤              ├─────┴─────┴─────┤
│ OS  │ OS  │ OS  │  ← heavy     │  Docker Engine  │  ← shares the host kernel
├─────┴─────┴─────┤              ├─────────────────┤
│    Hypervisor   │              │     Host OS     │
└─────────────────┘              └─────────────────┘
GBs, boots in minutes            MBs, starts in milliseconds
```

| | VM | Container |
|---|---|---|
| Size | GBs | MBs |
| Startup | Minutes | Milliseconds |
| Isolation | Strong (own kernel) | Weaker (shared kernel) |
| Density per host | Tens | Hundreds |

---

## 7. A production Dockerfile

```dockerfile
# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy ONLY the manifests first - this layer is cached unless deps change
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy just the build output from stage 1
COPY --from=builder /app/dist ./dist

# Never run as root
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
```

**Definition of a Multi-stage build:** Using several `FROM` statements so build tools (compilers, dev dependencies, source code) stay in an intermediate stage and never reach the final image. This can cut an image from 1.2 GB to 150 MB.

### Layer caching — the most important optimisation

**Definition:** Docker caches each instruction's result. If an instruction and everything before it are unchanged, the cache is reused. **A change invalidates that layer and every layer after it.**

```dockerfile
# ❌ WRONG - any source change re-runs npm ci (slow, every time)
COPY . .
RUN npm ci

# ✅ RIGHT - npm ci only re-runs when package.json changes
COPY package*.json ./
RUN npm ci
COPY . .
```

**`.dockerignore`** — keeps junk out of the build context and prevents cache busting:
```
node_modules
.git
.env
dist
*.md
coverage
```

---

## 8. Essential Docker commands

```bash
# Images
docker build -t myapp:1.0 .
docker images
docker rmi myapp:1.0

# Containers
docker run -d -p 3000:3000 --name myapp myapp:1.0    # -d detached, -p port map
docker run -e NODE_ENV=production --env-file .env myapp:1.0
docker ps                    # running
docker ps -a                 # including stopped
docker logs -f myapp         # follow logs
docker exec -it myapp sh     # shell inside a running container
docker stop myapp && docker rm myapp

# Volumes (persistent data)
docker run -v pgdata:/var/lib/postgresql/data postgres:16

# Cleanup
docker system prune -a       # remove unused images, containers, networks
```

---

## 9. Docker Compose

**Definition:** A tool for defining and running **multi-container** applications from a single YAML file — your app plus its database, cache and so on.

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/myapp
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy    # wait until the DB is actually ready
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    volumes:
      - pgdata:/var/lib/postgresql/data      # survives container removal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      retries: 5

  cache:
    image: redis:7-alpine

volumes:
  pgdata:
```

```bash
docker compose up -d
docker compose logs -f app
docker compose down          # add -v to also delete volumes
```

**Networking:** Compose creates a network where services reach each other **by service name** — `db:5432`, not `localhost:5432`. Using `localhost` inside a container refers to that container itself, which is the most common Compose mistake.

---

## 10. Docker best practices

| Practice | Why |
|---|---|
| Use **alpine** or **slim** base images | 50 MB instead of 1 GB |
| **Multi-stage** builds | Build tools never reach production |
| Copy `package.json` before source | Preserves the dependency layer cache |
| Add a `.dockerignore` | Smaller context, no leaked `.env` |
| Run as a **non-root** user | Container escape is far less damaging |
| **Pin** base image versions | `node:20-alpine`, never `node:latest` |
| One process per container | Containers should be restartable and disposable |
| Never bake secrets into the image | Anyone who pulls the image can read them |
| Add a `HEALTHCHECK` | Lets the orchestrator restart broken instances |
| Scan images | `docker scout cves` or Trivy |

> ⚠️ **Secrets in images:** `ENV API_KEY=secret` is visible to anyone running `docker history`. Even deleting a file in a later layer leaves it in the earlier layer. Pass secrets at **runtime** with `-e` or a secrets manager.

---

## Key points

**GitHub Actions**
- Workflow → Jobs (parallel by default) → Steps. Use `needs` to sequence them.
- Cache dependencies and use `npm ci`, not `npm install`.
- Secrets are masked and unavailable to fork PRs.
- Tag deploy artifacts with the git SHA so rollback is possible.

**Docker**
- An image is the blueprint; a container is a running instance.
- Containers share the host kernel — MBs and milliseconds, versus GBs and minutes for a VM.
- **Layer caching:** copy manifests and install dependencies *before* copying source.
- **Multi-stage builds** keep build tooling out of the final image.
- Run as non-root, pin versions, add a health check, never bake in secrets.
- In Compose, services talk to each other by **service name**, not `localhost`.
