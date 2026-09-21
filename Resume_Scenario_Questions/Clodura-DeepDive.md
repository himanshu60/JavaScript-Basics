# Clodura.AI — Deep Dive Questions

Questions an interviewer will ask about each bullet, with the structure for answering.

> `[…]` marks where only you know the real detail. Fill these in before the interview.

---

## 1. The Angular → Next.js migration

> *"Owned the migration of 8+ Angular modules to Next.js"*

### Q: Why migrate from Angular to Next.js at all?

**What they are testing:** can you justify technical work in business terms, or do you just follow trends?

**Weak answer:** "Next.js is more modern / faster / better."

**Strong answer structure:**
- The business driver — SEO visibility, page load, hiring, or consolidating two frontends
- The evidence that it was a problem — what was measurably wrong before
- Why Next.js specifically over the alternatives
- Honest acknowledgement: migration is expensive, so the reason has to be worth it

Your resume mentions **SEO visibility** and **page load** — lead with whichever was the actual driver. If the decision was made above you, say *"the decision was made by [...], and I owned the execution"* — that is honest and still strong.

### Q: How do you migrate incrementally without breaking users?

**What they are testing:** do you understand that big-bang rewrites fail?

**Structure:**
- Route-by-route or module-by-module, never all at once
- A proxy or reverse proxy routing some paths to the old app and some to the new
- Shared authentication so a user moving between them stays logged in
- Feature parity verified before switching each route
- Ability to roll a single route back

**Be ready for:** *"How did users stay logged in across both apps?"* — this is the practical problem in every incremental migration. If cookies were shared across a common domain, say that.

### Q: What broke during the migration, and how did you find out?

**They want a real answer.** A migration of 8+ modules with nothing going wrong is not believable.

Good material: SEO/routing differences, hydration mismatches, state that existed in the Angular app but not the new one, styling inconsistencies, or a shared API assuming Angular-specific behaviour.

`[Pick one real incident: what broke, how you detected it, how long it took to fix, what you changed so it could not recur.]`

### Q: What did you do about Angular-specific features that had no Next.js equivalent?

Angular brings dependency injection, RxJS, two-way binding and its own forms module. React has none of these directly.

`[How did you replace RxJS streams? What replaced Angular's form validation — react-hook-form? How did services become hooks or context?]`

---

## 2. The 30% improvement

> *"Improved page load and API response times by 30% by eliminating redundant API calls and introducing a caching layer"*

### Q: 30% of what? How did you measure it?

**This is the most likely follow-up on your entire resume.** Have specifics.

Be ready with:
- The metric — LCP, TTFB, full page load, or API p95?
- The tool — Lighthouse, real user monitoring, APM, browser network tab?
- Before and after numbers — `[e.g. 4.2s → 2.9s]`
- Which pages — the whole app, or the specific heavy ones?

> If you measured with Lighthouse on one page, say that. Precision about the *limits* of your measurement builds more credibility than a big vague number.

### Q: What were the redundant API calls, and why were they happening?

**Common real causes worth describing if they match:**
- The same endpoint called from several components independently
- A call inside a `.map()`, so N rows meant N requests (the N+1 problem on the frontend)
- A `useEffect` with a missing or unstable dependency firing repeatedly
- No request deduplication, so concurrent identical calls all went out

**Structure:** how you found them (network tab, logs, APM) → what the root cause was → what you changed → how you verified.

### Q: What did you cache, where, and how did you invalidate it?

**Cache invalidation is the real question here.** Anyone can add a cache; the follow-up is always about staleness.

Be ready for:
- Where — browser, RTK Query, Redis, CDN, or in-memory?
- TTL, or explicit invalidation on write?
- What happened when data changed — did users see stale data?
- Was the cache per-user? (For a contact database, caching across users would be a data leak.)

`[If you used RTK Query, its tag-based invalidation is a good concrete answer: providesTags / invalidatesTags.]`

### Q: What would you optimise next if you had another two weeks?

Shows whether you understand where the remaining cost is. Good directions: database query optimisation, pagination strategy, bundle size, image optimisation, moving work off the request path into a queue.

---

## 3. The Twilio dialer

> *"Built a Twilio-based dialer with number purchase, call usage tracking and call recording management, used by 100+ paying customers"*

### Q: Walk me through what happens when a user clicks "call".

**Structure the flow end to end:**
1. Frontend requests a call → your backend
2. Backend validates permissions and available credit/balance
3. Backend calls the Twilio API to initiate the call
4. Twilio sends **webhooks** back as the call state changes (ringing, answered, completed)
5. Your backend updates call state and records duration
6. Usage is recorded for billing
7. The recording becomes available and is stored/linked

**Expect:** *"What if your server is down when Twilio sends the webhook?"* — Twilio retries, which means your handler must be **idempotent**. If you handled that, say how. If not, say what you would do.

### Q: How did you track usage for billing accurately?

This is money, so correctness matters.

Be ready for: where duration came from (Twilio's reported duration, not your own timer), what happened on a dropped or failed call, whether usage was recorded atomically, and how you handled a webhook arriving twice.

### Q: Where were call recordings stored, and what about compliance?

`[Twilio-hosted, or downloaded to your own storage? Who could access them? Was there consent/announcement handling?]`

Call recording has legal requirements in most jurisdictions. Even saying *"we relied on the customer configuring consent announcements"* shows you know it is a consideration.

### Q: What was the hardest part of the Twilio integration?

Good candidates: webhook reliability and ordering, testing telephony without making real calls, handling all the call states, number provisioning, or debugging something that only failed in production.

---

## 4. Contact search over 300M+ records

> *"Implemented unlock workflows, credit-based entitlement validation and bulk export for a contact search module over a 300M+ record database"*

### Q: How do you make search fast over 300 million records?

**Be clear about what you built versus what existed.** If the search infrastructure was Elasticsearch set up by someone else and you built the entitlement layer on top, say that plainly.

Relevant concepts either way:
- Indexes on exactly the filter combinations users actually use
- A dedicated search engine (Elasticsearch/OpenSearch) rather than the primary database
- **Keyset pagination**, not `OFFSET` — at 300M rows, `OFFSET 100000` is unusable
- Returning only the fields the list view needs
- Caching common queries

### Q: A user double-clicks "unlock". How do you make sure they are only charged one credit?

**This is the sharpest technical question your resume invites.** It is a classic race condition on something money-adjacent.

**The possible answers, in increasing quality:**

1. *Frontend disables the button* — necessary but not sufficient; it does not protect the API
2. *Idempotency key* — the client sends a unique key; the server deduplicates
3. *Atomic conditional update* — decrement the credit only if the balance allows, in one operation:
   ```js
   // MongoDB - atomic, no race possible
   db.users.updateOne(
     { _id: userId, credits: { $gte: 1 } },
     { $inc: { credits: -1 } }
   );
   // If modifiedCount === 0, they did not have credit - reject
   ```
4. *Transaction* — wrap the credit decrement and the unlock record together so both happen or neither does
5. *Unique constraint on (userId, contactId)* — a second unlock of the same contact cannot be inserted, so it cannot be charged twice

**If you did not handle this at the time, say so and describe what you would do now.** Recognising the race condition demonstrates more engineering maturity than claiming a perfect solution you cannot explain.

### Q: How did bulk export work for a large result set?

Expect: was it synchronous or queued? What stopped someone exporting 10 million rows and taking down the server?

Good structure: validate the size → queue the job → process in batches with a cursor → stream to a file → notify the user with a download link. If you did it synchronously with a hard row cap, say that — it is a legitimate simpler design.

### Q: You used Prospeo, LeadMagic and ContactOut as fallbacks. How did the fallback chain work?

**What they are testing:** resilience thinking. This is the same pattern as your PostAgent LLM providers, which is worth pointing out — it shows a consistent design instinct.

Be ready for:
- What triggered a failover — error, timeout, or empty result?
- Was there a timeout per provider? (Without one, a slow provider blocks everything.)
- Were they called in sequence or parallel?
- What if all three failed?
- Did you cache results to avoid paying for the same lookup twice?
- Did you track cost per provider?

---

## 5. The UI component library

> *"Built a reusable UI component library of 15+ React/Next.js components ... adopted across multiple modules, with RTK Query for API state management"*

### Q: How did you design the component APIs?

Expect discussion of: props vs composition, sensible defaults, controlled vs uncontrolled inputs, how consumers customised styling (className passthrough? variants?), and forwarding refs.

**A good concrete example:** how your form input handled label, error state, validation and passing through arbitrary props via `...rest`.

### Q: Someone needs a variant your component does not support. What do you do?

**What they are testing:** do you understand that a library is a product with users?

The trade-off: adding a prop for every request leads to a component with 40 props that nobody understands. The alternatives are composition (let them compose smaller pieces), a variant system, or accepting a `children`/slot.

### Q: How did you handle a breaking change once other modules depended on it?

`[Versioning? A deprecation period where both APIs worked? A codemod? Or direct coordination because it was one codebase?]`

Even "it was a monorepo so I updated all call sites in the same PR" is a fine answer — it is honest and it is what most teams actually do.

### Q: How did you get people to actually use it?

Adoption is the hard part. Good answers: documentation, Storybook, being the path of least resistance, migrating existing screens yourself to demonstrate it, or making it the default in code review.

### Q: Why RTK Query rather than React Query or plain fetch?

Have a real reason. If Redux was already in the codebase, that is the honest and correct answer — RTK Query integrates with the existing store. Do not invent a technical superiority argument.

---

## 6. Auth, authorization and RBAC

> *"Implemented authentication, authorization and role-based access control across the platform"*

### Q: Where did you store the auth token and why?

Know the trade-off cold:

| Storage | XSS-safe | CSRF-safe | Notes |
|---|---|---|---|
| `HttpOnly` cookie | ✅ | ✅ with `SameSite` | The secure default |
| `localStorage` | ❌ | ✅ | Convenient, but any injected script can steal it |

If the project used localStorage, **say so and explain the trade-off** — that reads far better than pretending otherwise.

### Q: How did you design the role system?

Expect: what roles existed, were permissions role-based or resource-based, where the check happened (middleware? per route? per resource?), and how a new permission was added.

### Q: A user changes the ID in the URL to view someone else's contact. What stops them?

**This is the IDOR question, and it is the one that matters.** Checking *authentication* ("are you logged in?") is not enough — you must check *authorization for that specific resource* ("is this yours?").

```js
// ❌ Authenticated, but not authorised
const contact = await Contact.findById(req.params.id);

// ✅ Ownership enforced in the query itself
const contact = await Contact.findOne({ _id: req.params.id, ownerId: req.user.id });
if (!contact) return res.status(404).json({ error: "Not found" });
```

Returning **404 rather than 403** is a nice detail — it does not reveal that the record exists.

### Q: How did token refresh work?

`[Access token lifetime? Refresh token rotation? What happened when a refresh token was reused — did you detect theft?]`

---

## 7. WebSockets and Socket.io

> *"Developed real-time communication features using WebSockets and Socket.io"*

### Q: What did you use real-time for, and why not polling?

Real-time is justified when updates are frequent and latency matters. If it was a notification that arrives a few times a day, polling would have been simpler — be ready to defend the choice.

### Q: What happens when a user's connection drops?

Expect: automatic reconnection (Socket.io does this), but what about messages sent while they were disconnected? Were they queued, or lost? Did the client re-fetch state on reconnect?

**The usual correct answer:** on reconnect, fetch current state over HTTP rather than trying to replay missed socket events.

### Q: You scale to three server instances behind a load balancer. What breaks?

**The question people miss.** Socket.io keeps connections in the memory of one process. User A connected to instance 1 cannot receive an event emitted on instance 3.

**The fix:** the Redis adapter (`@socket.io/redis-adapter`), which broadcasts events across instances via Redis pub/sub.

If you ran a single instance, say that honestly: *"we ran one instance so it did not come up, but with multiple you need the Redis adapter because socket state is per-process."* Knowing the failure mode is what they are checking.

### Q: How did you authenticate socket connections?

Sockets do not automatically carry your HTTP auth. Expect: token passed in the handshake, validated in middleware before the connection is accepted, and re-validated on sensitive events.

---

## The question behind all of these

Every one of these is really asking: **did you understand what you were building, or did you implement tickets?**

The way to demonstrate the former is to volunteer the trade-off. Not *"I added a cache"* but *"I added a cache, which meant I had to decide what to do about staleness — I went with a short TTL rather than explicit invalidation because the data changed rarely and the complexity was not worth it."*

That one extra sentence is the difference between a mid-level and a senior-sounding answer.

---

**Next:** [Projects-DeepDive.md](Projects-DeepDive.md) for PostAgent and Zongovita.
