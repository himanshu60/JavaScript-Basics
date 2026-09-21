# Workflow Automation and n8n

## 1. What is workflow automation?

**Definition:** Connecting separate systems so a sequence of steps runs by itself — triggered by an event or a schedule — without a person manually moving data between tools.

**In simple words:** instead of a human checking a form, copying the data into a CRM, sending an email and posting to Slack, a workflow does all four the moment the form is submitted.

---

## 2. What is n8n?

**Definition:** n8n is an open-source, self-hostable workflow automation tool. You build workflows visually as a graph of **nodes**, and you can drop into JavaScript wherever the visual builder is not enough.

| Tool | Notes |
|---|---|
| **n8n** | Open source, self-hostable, code-friendly, fair pricing on volume |
| **Zapier** | Easiest, largest app library, expensive per task at scale |
| **Make** | Strong visual branching, mid-market |
| **Temporal / Airflow** | Code-first, for engineering-owned durable workflows |
| **Custom code** | Full control, but you build retries, logging and scheduling yourself |

**Why n8n specifically:** self-hosting means sensitive data never leaves your infrastructure, there is no per-task pricing to worry about at volume, and the Code node means you are never blocked by a missing feature.

---

## 3. Core concepts

| Concept | Definition |
|---|---|
| **Workflow** | The whole automation — a graph of connected nodes |
| **Node** | One step: a trigger, an action, or a transformation |
| **Trigger node** | What starts the workflow. Every workflow has exactly one |
| **Connection** | The line passing data from one node to the next |
| **Item** | A single unit of data flowing through. Nodes process **arrays of items** |
| **Expression** | `{{ $json.fieldName }}` — pulls data from previous nodes |
| **Credential** | A stored, encrypted authentication config reused across workflows |

**Trigger types:**

| Trigger | Fires when |
|---|---|
| **Webhook** | An HTTP request arrives — real time |
| **Schedule / Cron** | At a set time or interval |
| **Polling** | n8n checks a service periodically for changes |
| **Manual** | You click execute (for testing) |
| **App event** | A connected app emits an event |

---

## 4. The data model — the thing that trips everyone up

**Definition:** n8n passes an **array of items** between nodes. If a node outputs 10 items, the next node runs **10 times** — once per item. This is the single most misunderstood part of n8n.

```js
// What flows between nodes
[
  { json: { name: "Amit",  email: "amit@x.com" } },
  { json: { name: "Priya", email: "priya@x.com" } },
]
```

**Accessing data in expressions:**

```js
{{ $json.email }}                    // a field on the current item
{{ $node["HTTP Request"].json.id }}  // output from a specific earlier node
{{ $items("Set")[0].json.total }}    // a specific item from a node
{{ $now.toISO() }}                   // current timestamp
{{ $workflow.id }}                   // workflow metadata
```

**The Code node** — for anything the visual nodes cannot do:

```js
// Run Once for All Items
const items = $input.all();

const grouped = {};
for (const item of items) {
  const dept = item.json.department;
  grouped[dept] ??= [];
  grouped[dept].push(item.json.name);
}

// Must return an array of { json: ... }
return Object.entries(grouped).map(([department, members]) => ({
  json: { department, members, count: members.length },
}));
```

> **Run Once for All Items** vs **Run Once for Each Item** — pick the first when you need to aggregate, group or deduplicate across the whole batch.

---

## 5. A practical workflow — AI content pipeline

This mirrors the PostAgent pattern: research → generate → review → publish.

```
[Schedule: daily 9am]
        ↓
[HTTP Request: fetch trending topics from an API]
        ↓
[Code: filter and rank topics, pick the top 3]
        ↓
[Loop over items]
        ↓
[AI node: generate a draft post from the topic]
        ↓
[AI node: score the draft for quality 1-10]
        ↓
[IF: score >= 7]
    ├── true  → [Slack: post for human approval]
    │                    ↓
    │           [Wait: for approval webhook]
    │                    ↓
    │           [HTTP Request: publish to the platform]
    │                    ↓
    │           [Database: log what was published]
    │
    └── false → [Code: log rejection reason]
                         ↓
                [Slack: notify with the low-scoring draft]
```

**The design decisions worth defending in an interview:**

1. **Quality gate before publishing** — an LLM scores its own output, and anything below the threshold never reaches a human's queue
2. **Human approval for the external action** — publishing is irreversible and public, so it is never fully automatic
3. **Everything logged** — you can answer "why did it post that?" three weeks later
4. **Failures notify a person** — a silent failure is worse than a loud one

---

## 6. AI nodes in n8n

**Definition:** n8n has built-in nodes for LLM calls, embeddings, vector stores and agents, so a RAG pipeline can be assembled without writing a service.

```
[Webhook: incoming question]
        ↓
[Embeddings node: embed the question]
        ↓
[Vector Store node: retrieve top 5 chunks]
        ↓
[Basic LLM Chain: answer using only the retrieved context]
        ↓
[Respond to Webhook: return the answer + sources]
```

**A common, genuinely useful pattern — document ingestion:**

```
[Trigger: new file in cloud storage]
  → [Extract text from PDF]
  → [Code: chunk the text]
  → [Embeddings: embed each chunk]
  → [Vector Store: insert]
  → [Slack: "Indexed 47 chunks from policy.pdf"]
```

---

## 7. Error handling

**Definition:** Automations fail silently by default, which is worse than failing loudly — nobody notices for weeks.

**Node-level settings:**

| Setting | What it does |
|---|---|
| **Retry On Fail** | Retry N times with a delay — essential for flaky APIs |
| **Continue On Fail** | Pass the error downstream instead of stopping the workflow |
| **Always Output Data** | Emit an empty item rather than halting when there is no result |

**Error Workflow:** a separate workflow that runs whenever any workflow fails.

```
[Error Trigger]
  → [Code: format the error, workflow name and failing node]
  → [Slack: alert the team channel]
  → [IF: critical workflow] → [Create a Jira ticket]
```

**Idempotency** — the most important reliability concept:

**Definition:** An operation is idempotent if running it twice produces the same result as running it once. Retries and duplicate webhooks make this essential.

```js
// ❌ Not idempotent - a retry charges the customer twice
await createCharge(order.amount);

// ✅ Idempotent - the provider deduplicates by key
await createCharge(order.amount, { idempotencyKey: order.id });

// ✅ Or check first
if (await db.findOne({ orderId: order.id })) return { skipped: true };
```

---

## 8. Security and operations

| Concern | Practice |
|---|---|
| **Credentials** | Use n8n's encrypted credential store; never paste keys into node parameters |
| **Webhook security** | Verify a signature or shared secret — a public webhook URL is callable by anyone |
| **Self-hosting** | Keeps sensitive data inside your own network |
| **Rate limits** | Add delays or batching before hammering third-party APIs |
| **Version control** | Export workflow JSON into git — it is a diffable artifact |
| **Environments** | Separate dev and production instances; never test against live data |
| **Least privilege** | Give each credential the minimum scope it needs |

```js
// Verify an incoming webhook signature in a Code node
const crypto = require("crypto");
const expected = crypto
  .createHmac("sha256", $env.WEBHOOK_SECRET)
  .update(JSON.stringify($json.body))
  .digest("hex");

if (expected !== $json.headers["x-signature"]) {
  throw new Error("Invalid signature");
}
return $input.all();
```

---

## 9. When to use automation vs writing code

| Use a workflow tool | Write code |
|---|---|
| Connecting existing SaaS products | Core product logic |
| Internal operations and back-office tasks | Anything customer-facing and latency-sensitive |
| Prototyping a process quickly | Complex branching and state machines |
| Non-engineers need to read or edit it | It needs unit tests and code review |
| Low to moderate volume | High volume / high throughput |
| The logic changes frequently | The logic is stable and critical |

**The honest answer for an interview:** *"n8n for internal glue and prototypes, code for anything in the product path."* Automation tools become a liability when business-critical logic lives in a visual graph that nobody can test or review properly.

---

## 10. Interview questions on automation

**"How would you automate X?"** — structure your answer as:
1. **Trigger** — what starts it?
2. **Steps** — the sequence of actions
3. **Failure handling** — what happens when step 3 fails?
4. **Idempotency** — what if it runs twice?
5. **Human checkpoints** — which actions are irreversible?
6. **Observability** — how do you know it is working?

**"What breaks in automated workflows?"**
Rate limits, schema changes in third-party APIs, expired credentials, duplicate webhook deliveries, partial failures leaving inconsistent state, silent failures nobody notices, and infinite loops between two workflows that trigger each other.

**"When would you not use n8n?"**
When the logic is core product behaviour, when it needs proper tests and code review, when latency matters, at very high volume, or when the workflow has grown so complex that the visual graph is harder to read than code would be.

---

## Key points

- n8n is **open source and self-hostable** — data stays in your infrastructure.
- Workflows are **nodes connected in a graph**, starting from exactly one trigger.
- Data flows as an **array of items**; a node with 10 items runs 10 times.
- The **Code node** handles anything the visual nodes cannot.
- **Always configure error handling** — set up an Error Workflow that alerts a human.
- **Idempotency is essential** — retries and duplicate webhooks are normal, not exceptional.
- **Verify webhook signatures**; a public webhook URL is callable by anyone.
- Export workflows to git so they are versioned and reviewable.
- Use automation for **internal glue and prototypes**, code for the product path.
