# System Design Scenarios

Design questions you are likely to get, chosen because they map onto what is already on your resume — so your real experience becomes the answer.

---

## The framework (use this every time)

**Never start drawing boxes immediately.** Interviewers are testing your process as much as your answer.

| Step | Time | What to do |
|---|---|---|
| **1. Clarify** | 5 min | Scope, users, scale, constraints. Ask before assuming. |
| **2. Requirements** | 3 min | Functional (what it does) and non-functional (fast, available, consistent) |
| **3. Estimate** | 3 min | Rough numbers — QPS, storage, read/write ratio |
| **4. API** | 3 min | The main endpoints and their shapes |
| **5. Data model** | 5 min | Schema, and **why** SQL or NoSQL |
| **6. High level** | 10 min | Boxes and arrows — the happy path first |
| **7. Deep dive** | 10 min | Go deep on 1–2 parts, usually where they push |
| **8. Bottlenecks** | 5 min | What breaks at 10×, and how you would fix it |

**Questions to always ask first:**
- How many users? Daily active?
- Read-heavy or write-heavy?
- How fresh must the data be? (Does eventual consistency work?)
- Are we designing v1 or the scaled version?
- What is explicitly out of scope?

> Saying *"let me start with a simple version and then scale it"* is the right opening. Designing for a billion users when they wanted v1 is a common failure.

---

## Scenario 1 — Design a contact search system

**Why you will get this:** it is literally on your resume (300M+ records).

### Clarify
- 300M contacts, how many users? Search latency target? How fresh must contacts be?
- Which fields are searchable — name, company, title, location, industry?
- Do users see all contacts, or only ones they have unlocked?

### The core challenge
Full-text search with multiple filters over 300M rows, returning in under ~200ms.

### Design

```
[Client] → [API] → [Search service] → [Elasticsearch]  ← search index
                        ↓
                  [Postgres/Mongo]  ← source of truth + entitlements
                        ↓
                    [Redis]         ← cache hot queries
```

**Key decisions to state and defend:**

| Decision | Reasoning |
|---|---|
| Separate **search engine** from the primary database | A relational DB cannot do multi-field full-text search at this scale efficiently |
| Index only **searchable + display** fields | The index does not need every column |
| **Keyset pagination**, not OFFSET | `OFFSET 100000` over 300M rows is unusable |
| Entitlement check **after** search | Search the index, then filter/mask what the user has not unlocked |
| Cache common queries in Redis | A large share of queries repeat |

**Deep dive they will push on — how do you keep the index in sync?**
Change data capture or an event on write → queue → indexer. Accept eventual consistency (a few seconds is fine for search). Mention that a full reindex of 300M records is an offline batch job, not something you do casually.

**The bit to volunteer:** *"Search returns the contact, but the email and phone are masked until the user spends a credit to unlock — so the entitlement check happens on the result set, and the unlock itself needs to be atomic."* That connects directly to your real work.

---

## Scenario 2 — Design a credit/quota system

**Why you will get this:** credit-based entitlement validation is on your resume, and it is a great correctness question.

### The core challenge
A user must be charged **exactly once** per unlock, even with concurrent requests, retries and a crash mid-operation.

### Design

```js
// The atomic operation is the whole answer
const result = await db.collection("users").updateOne(
  { _id: userId, credits: { $gte: cost } },     // condition
  { $inc: { credits: -cost } }                   // action - atomic together
);

if (result.modifiedCount === 0) {
  throw new InsufficientCreditsError();          // no credit, or lost the race
}
```

**Then discuss the layers:**

| Concern | Solution |
|---|---|
| Double-click | Idempotency key from the client, deduplicated server-side |
| Concurrent requests | Atomic conditional update (above) — no read-then-write |
| Crash between charge and unlock | Transaction, or make the unlock record the source of truth |
| Already-unlocked contact | Unique index on `(userId, contactId)` — re-unlocking is free |
| Audit / disputes | An immutable ledger of credit transactions, not just a balance |

**The senior move:** propose the **ledger** model. Instead of only storing a balance, store every credit event; the balance is derived (or cached and reconciled). This makes disputes answerable and bugs recoverable — and it is how real billing systems work.

**Expect:** *"What if the unlock succeeds but the response never reaches the user, and they retry?"* → the idempotency key returns the original result rather than charging again.

---

## Scenario 3 — Design a scheduled content publishing system

**Why you will get this:** it is PostAgent, scaled up.

### Clarify
- How many users, and how many scheduled posts per day?
- What is the tolerance for a late post — seconds, minutes?
- What happens if the external platform is down?

### Design

```
[Scheduler] → polls for due jobs
     ↓
[Job queue]  ← BullMQ / SQS
     ↓
[Workers] → [Generate] → [Publish to platform] → [Record result]
     ↓
[Dead letter queue] → alert a human
```

**Key decisions:**

| Decision | Reasoning |
|---|---|
| Queue, not in-process cron | Survives restarts; workers scale independently |
| Job **claimed atomically** | Two workers must never publish the same post |
| Idempotency on publish | Retries must not double-post to a public profile |
| Per-user rate limiting | External API quotas are per account |
| Dead letter queue | Permanently failed jobs need human attention, not silent loss |
| Token refresh before publish | Access tokens expire between scheduling and firing |

**Deep dive: how do you guarantee exactly-once publishing?**
Honest answer: **you cannot guarantee exactly-once across a network boundary.** You get at-least-once delivery plus idempotency on the receiving side. Store the platform's returned post ID; before retrying, check whether it already exists. Saying this plainly demonstrates real distributed-systems understanding.

---

## Scenario 4 — Design a rate limiter

**Why you will get this:** it is a standard question and your resume mentions rate limiting.

### The algorithms

| Algorithm | How it works | Trade-off |
|---|---|---|
| **Fixed window** | Count per minute, reset on the boundary | Simple; allows a 2× burst at the boundary |
| **Sliding window log** | Store every request timestamp | Exact; memory-heavy |
| **Sliding window counter** | Weighted blend of current and previous window | Good balance — **usual choice** |
| **Token bucket** | Tokens refill at a rate; each request takes one | Allows controlled bursts — **also common** |
| **Leaky bucket** | Requests drain at a fixed rate | Smooths output completely |

```js
// Token bucket in Redis, atomic via Lua so there is no race
const allowed = await redis.eval(TOKEN_BUCKET_SCRIPT, 1,
  `ratelimit:${userId}`, capacity, refillRate, now);
```

**The distributed question they will ask:** *"You have 5 API servers. How do they share the count?"*
→ Centralised counter in Redis. In-memory counters mean the real limit is 5× what you configured.

**Also mention:** return `429` with a `Retry-After` header, and different limits per endpoint (login should be far stricter than a read).

---

## Scenario 5 — Design a real-time notification system

**Why you will get this:** WebSockets/Socket.io is on your resume.

### Design

```
[Event source] → [Notification service] → [Queue]
                                            ↓
                          ┌─────────────────┼─────────────────┐
                     [WebSocket]        [Email]            [Push]
                          ↓
                     [Redis pub/sub]  ← so any server can reach any user
```

**Key decisions:**

| Concern | Solution |
|---|---|
| User connected to a different server | **Redis adapter / pub-sub** — the critical piece |
| User offline | Persist the notification; deliver on reconnect |
| User on 3 devices | Track connections per user, fan out to all |
| Reconnection | Client re-fetches state over HTTP rather than replaying events |
| Delivery guarantees | Store first, then push — never push-only |

**The question that separates people:** *"What happens when you scale from 1 server to 5?"* Socket state is per-process, so without a Redis adapter, users connected to different instances cannot receive each other's events. Volunteer this before they ask.

---

## Scenario 6 — Design a RAG-powered support bot

**Why you will get this:** your resume lists RAG, and AI roles ask this constantly.

### Design

```
INGEST:  [Docs] → [Chunk] → [Embed] → [Vector DB]

QUERY:   [Question] → [Rewrite with history] → [Hybrid search]
                                                     ↓
         [Answer + citations] ← [LLM] ← [Rerank top 5]
                    ↓
         [Below threshold? → escalate to human]
```

**Key decisions to state:**

| Decision | Reasoning |
|---|---|
| Chunk 500–1000 tokens, 10–15% overlap | Biggest lever on quality; overlap preserves split sentences |
| **Hybrid** search | Semantic misses exact error codes and SKUs |
| Reranking | Highest-return quality improvement |
| Similarity **threshold** | Otherwise unrelated questions get answered from the least-unrelated chunks |
| Citations required | Makes answers verifiable and builds trust |
| Escalation path | The bot must know when to hand off |
| Eval set from real tickets | Otherwise prompt changes are guesswork |

**Metrics they will ask about:** deflection rate (tickets resolved without a human), user satisfaction, and cost per resolved ticket — **not** model benchmarks. Answering with business metrics signals product thinking.

Full detail: [RAGPipelines.md](../AI_Engineering_Questions/RAGPipelines.md)

---

## Scenario 7 — Design a URL shortener / paste bin

**Why you will get this:** it is the classic warm-up.

**The key insights to hit:**
- **Read-heavy** (100:1 or more) → cache aggressively, use read replicas
- ID generation: base62 encode a counter, or hash with collision handling
- Custom aliases need a uniqueness check
- 301 vs 302 — 302 preserves analytics, 301 caches in the browser
- Analytics writes should be async so they never slow the redirect
- TTL/expiry, and an abuse/spam check on creation

---

## Common follow-ups in any design round

| Question | What to cover |
|---|---|
| "How do you scale this to 10×?" | Identify the actual bottleneck first — usually the database |
| "What is your single point of failure?" | Be honest, then explain how you would remove it |
| "How do you monitor this?" | Latency p95/p99, error rate, saturation, business metrics |
| "How do you deploy this safely?" | Rolling or blue-green, backward-compatible migrations |
| "SQL or NoSQL?" | Justify by **access pattern**, not preference |
| "What would you build first?" | The smallest thing delivering value — shows product sense |

---

## Mistakes to avoid

| Mistake | Instead |
|---|---|
| Drawing before clarifying | Ask 3–4 questions first, always |
| Designing for a billion users when asked for v1 | Start simple, then scale on request |
| Silence while thinking | Narrate — they are evaluating your reasoning |
| Adding Kafka/Kubernetes with no justification | Every component needs a reason |
| Ignoring the data model | Schema choices drive everything else |
| Never mentioning failure | Volunteer what breaks and how you would detect it |
| Defending a bad idea when challenged | Interviewers often push to see if you can update |

> **The strongest habit:** state the trade-off out loud. *"I'd use Redis here for speed, which means accepting that a cache miss after a restart causes a latency spike — acceptable because this data is regenerable."* That single pattern, repeated, is what makes a design round go well.

---

**Related:** [../Node_Backend_Questions/](../Node_Backend_Questions/) · [../MongoDB_Interview_Questions/](../MongoDB_Interview_Questions/) · [../SQL_Interview_Questions/](../SQL_Interview_Questions/) · [../AI_Engineering_Questions/](../AI_Engineering_Questions/)
