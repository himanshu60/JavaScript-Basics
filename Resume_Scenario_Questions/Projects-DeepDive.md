# PostAgent and Zongovita — Deep Dive Questions

---

# PART 1 — PostAgent

> *"Multi-tenant SaaS that researches trending tech topics, generates on-brand LinkedIn posts with AI-generated images and auto-publishes them to each user's account on a schedule. Go, MongoDB, Gemini/LLM, Docker, Render."*

This is your strongest project for an AI-focused role. It demonstrates multi-tenancy, OAuth, scheduling, LLM integration and deployment — all in one artifact you can show.

---

## Q: Walk me through the architecture.

Have a 90-second version ready. Structure:

```
[Cron scheduler] → per user, on their schedule
        ↓
[Research step]  → fetch trending tech topics
        ↓
[Generation]     → LLM writes the post (on-brand for that user)
        ↓
[Image gen]      → AI image for the post
        ↓
[Publish]        → LinkedIn API, using THAT user's OAuth token
        ↓
[Record]         → store result in MongoDB per tenant
```

**Lead with the interesting parts**, not the CRUD: multi-tenancy, per-user tokens, the provider abstraction, and the scheduler.

## Q: What does "multi-tenant with per-user data isolation" mean in your implementation?

**What they are testing:** do you understand tenancy, or did you just add a `userId` column?

Be specific about which model you used:

| Model | How it works |
|---|---|
| **Shared database, shared schema** | Every query filters by `tenantId` — simplest, most common |
| Shared database, separate schema | Each tenant gets their own schema |
| Separate database per tenant | Strongest isolation, hardest to operate |

If you used the first (most likely), the important follow-up is: **what stops a missing filter from leaking data across tenants?**

Good answers: a repository layer where every query goes through a function that injects the tenant filter, so an individual handler cannot forget it. Or a middleware that scopes the database handle per request.

```go
// The dangerous pattern - one forgotten filter leaks everything
collection.Find(ctx, bson.M{"status": "published"})

// The safe pattern - tenant scoping is not optional
func (r *Repo) FindPosts(ctx context.Context, tenantID string, filter bson.M) {
    filter["tenant_id"] = tenantID   // always applied, centrally
    return r.collection.Find(ctx, filter)
}
```

## Q: How did you handle each user's LinkedIn OAuth tokens?

**This is a security question.** Expect:

- **Where are tokens stored?** Encrypted at rest, or plain in MongoDB? If plain, acknowledge it as a gap you would fix.
- **Refresh handling** — LinkedIn access tokens expire. What happens when a scheduled post fires with an expired token?
- **Revocation** — the user revokes access in LinkedIn settings. How does your system find out? (It does not, until a call fails — so you must handle that failure and notify them.)
- **Scope** — did you request minimum necessary permissions?

`[Fill in: were tokens encrypted? How did refresh work? What happened on a 401 during a scheduled publish?]`

## Q: What does "self-healing cron scheduler" actually mean?

**Define it concretely** — vague adjectives invite scepticism.

Likely real meanings:
- **Missed-run recovery** — if the server was down at 9am, the job runs on restart rather than being silently skipped
- **Retry on failure** — a failed publish is retried with backoff rather than lost
- **Stuck-job detection** — a job marked "running" for too long is reset
- **Crash resilience** — job state lives in MongoDB, not in memory, so a restart does not lose the schedule

Whichever it is, say it plainly: *"State lives in MongoDB rather than in-process, so on restart it picks up any run it missed and retries failures with backoff."*

## Q: How do you prevent posting the same content twice?

**The idempotency question.** With retries and restarts, duplicate publishes are a real risk — and a very visible one, since it happens on the user's public profile.

Good answers: a unique constraint on `(userId, scheduledSlot)`, a status field transitioned atomically from `pending` → `publishing` → `published`, or storing LinkedIn's returned post ID and checking before retrying.

```go
// Claim the job atomically - only one worker can transition it
result := collection.FindOneAndUpdate(ctx,
    bson.M{"_id": jobID, "status": "pending"},
    bson.M{"$set": bson.M{"status": "publishing", "claimed_at": time.Now()}},
)
// If no document matched, another worker already claimed it
```

## Q: Why did you build a pluggable LLM/image pipeline across four providers?

**This is your best design-thinking story.** Connect it explicitly to the enrichment-API fallback chain at Clodura — the same instinct, applied twice, is a pattern worth naming.

Reasons worth giving:
- **Resilience** — if Gemini is down or rate-limited, the feature still works
- **Cost** — route simple generations to a cheaper provider
- **Avoiding lock-in** — the interface is yours, the provider is swappable
- **Local option** — Ollama means it can run without any API cost

```go
// The abstraction that makes this possible
type TextGenerator interface {
    Generate(ctx context.Context, prompt string) (string, error)
}
// Gemini, OpenRouter and Ollama each implement it; the pipeline does not care
```

**Expect:** *"How did you decide which provider to use for a given request?"* — static order with failover, or dynamic by cost/task? And: *"How did you handle the fact that different providers return different formats and quality?"*

## Q: How do you keep posts "on-brand" for each user?

This is a prompt engineering question. Likely answers: a per-user profile or tone description stored in their settings and injected into the system prompt, few-shot examples of their previous posts, or a style guide they configure.

**Expect the follow-up:** *"How do you know the output is actually good?"* If you had no evaluation, say so — and say what you would add. See [evals](../AI_Engineering_Questions/LLMInProduction.md).

## Q: Why Go rather than Node.js, which you know better?

Perfectly fine to say **"to learn it"** — self-directed learning is the point of a side project. Add a technical reason if one is genuine: a single deployable binary, low memory footprint on a small Render instance, strong concurrency primitives for a scheduler, or static typing.

**Expect a basic Go question afterwards.** Be ready for goroutines vs OS threads, what a channel is, and Go's explicit `if err != nil` error handling versus exceptions.

## Q: What would you do differently if this had 10,000 users?

**Good directions:**
- Move from an in-process scheduler to a proper job queue with workers
- Rate limiting per LinkedIn API quota, per user
- Cost controls — 10,000 users generating daily posts is a real LLM bill
- Monitoring and alerting on failed publishes
- Encrypt tokens at rest with proper key management
- Horizontal scaling — multiple workers claiming jobs without collisions
- Evals on generation quality, since you cannot manually review 10,000 posts

---

# PART 2 — Zongovita Attendance System

> *"Sole Node.js backend developer ... designed and built the entire backend architecture from scratch, used daily by 200+ employees."*

This is your clearest ownership story. The value is not the complexity — it is that every decision was yours.

---

## Q: How did you model attendance and leave?

Expect a schema discussion. Be ready to sketch:

```js
// Attendance - one record per employee per day, or check-in/out events?
{
  employeeId, date, checkIn, checkOut,
  status: "present" | "absent" | "half-day" | "leave" | "holiday",
  workedMinutes,
}

// Leave - needs a workflow, not just a flag
{
  employeeId, type: "casual" | "sick" | "earned",
  from, to, days,
  status: "pending" | "approved" | "rejected",
  approverId, reason, appliedAt, decidedAt,
}

// Balance - how many days does each employee have left?
{ employeeId, year, type, allocated, used, remaining }
```

**Expect:** *"Why one record per day rather than an event log?"* Both are defensible — a daily record is simpler to query for reports; an event log handles multiple check-ins and gives a full audit trail. Have a reason for your choice.

## Q: What was the trickiest business rule?

Attendance systems are full of edge cases. Good material:
- Half-days and how they affect leave balance
- Leave spanning a weekend or public holiday — do those days count?
- An employee applying for leave on a day already marked present
- Backdated corrections by an admin
- Leave balance carry-forward at year end
- Someone who forgot to check out

`[Pick one you actually hit and describe how you resolved it — including any rule you had to go and ask HR to clarify.]`

**This is a strong answer type** because it shows you engage with the domain rather than just writing CRUD.

## Q: How did you handle timezones?

Attendance is fundamentally about time, so this will come up. The right answer is storing UTC and converting at the boundary — but "everyone was in one office in one timezone so I stored local time" is honest and fine for the context. What matters is knowing it is a decision.

## Q: You were the only backend developer. How did you make sure your design was sound?

**What they are testing:** how you operate without a safety net.

Good answers: researching how similar systems model the problem, validating rules with HR before building, writing the API contract first and reviewing it with the frontend developer, starting with the simplest thing that worked, and testing with real edge cases from the previous manual process.

## Q: What would you design differently now?

**Prepare a real answer.** "Nothing" is the wrong answer to a project from two years ago.

Good candidates: an event-sourced attendance log for a proper audit trail, separating leave policy from leave records so rules can change without migrating data, more tests around the date arithmetic, a proper approval state machine, or better handling of the timezone/DST question.

## Q: How did you handle authentication for 200+ employees?

Expect: roles (employee, manager, HR, admin), who could see whose data, whether managers could see only their reports, and how you prevented an employee from viewing or modifying someone else's attendance.

**Same IDOR question as in the Clodura file** — ownership must be enforced in the query, not just checked after fetching.

---

## Connecting the two projects

If asked *"what is the common thread in your work?"*, you have a genuine answer:

| Clodura | PostAgent | The pattern |
|---|---|---|
| Enrichment API fallback chain | Pluggable LLM providers | **Designing for provider failure** |
| Credit entitlement validation | Idempotent publishing | **Correctness under retries and concurrency** |
| RBAC across the platform | Per-tenant data isolation | **Access control as a design concern** |
| 15+ component library | `TextGenerator` interface | **Abstracting behind a stable interface** |

Naming a pattern across projects is a senior-sounding move. It shows the work was deliberate rather than incidental.

---

## Have the repo ready

PostAgent is public on your GitHub with a live demo. Before any interview:

- [ ] README explains **what problem it solves**, not just how to run it
- [ ] The live demo actually works — check it the morning of the interview
- [ ] The code you would want them to read is easy to find
- [ ] You can explain any file they open at random
- [ ] Known limitations are stated honestly in the README

> An interviewer opening your repo and finding a broken demo costs more than not having a project at all. Check it before every interview.

---

**Next:** [BehavioralSTAR.md](BehavioralSTAR.md) · [SystemDesignScenarios.md](SystemDesignScenarios.md)
