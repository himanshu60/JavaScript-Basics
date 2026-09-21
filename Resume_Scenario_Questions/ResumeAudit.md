# Resume Audit — What Each Claim Invites

Every strong claim on a resume is a question waiting to be asked. This file goes through yours line by line and marks which ones are **safe**, which need **preparation**, and which are **risky** if you cannot back them up.

---

## Legend

| Mark | Meaning |
|---|---|
| ✅ **Safe** | Easy to defend, likely to help you |
| ⚠️ **Prepare** | Will definitely be probed — have numbers and detail ready |
| 🔴 **Risky** | If you cannot substantiate this, it damages credibility |

---

## Professional summary

> "3+ years of experience building and scaling production SaaS applications using Node.js, React.js, Next.js, Angular and Go"

⚠️ **Prepare** — listing five technologies invites "which are you strongest in, and which are you weakest in?"

**How to answer:** be honest and ranked. Something like: *"Strongest in Node.js and React — that is where most of my production work is. Next.js I used heavily during the migration work. Angular I worked in daily but mostly maintaining and migrating away from it. Go is my newest — I built PostAgent in it, so I am productive but I would not claim depth yet."*

Ranking yourself honestly reads as confidence. Claiming equal expertise in five things reads as padding.

🔴 **"scaling"** — this word means something specific. Be ready for *"what did you actually scale, and from what to what?"* If the honest answer is "I worked on a platform that was already at scale rather than scaling it myself", say that. It is still impressive and far safer than being caught overstating.

---

## Highlights line

> "8+ Angular to Next.js migrations, load times cut 30%"

⚠️ **Prepare** — the 30% is the number they will grab.

Have ready: what you measured (LCP? TTFB? full page load?), how you measured it (Lighthouse, real user monitoring, network tab?), what the before and after values were, and on which pages. "30% faster" without a baseline is the most commonly challenged type of resume claim.

> "Sole Node.js backend owner, 200+ employees"

✅ **Safe and strong** — sole ownership is genuinely valuable signal. Expect deep questions on your design decisions, since there is no one else to attribute them to.

> "300M+ record contact database, 1000+ customers"

⚠️ **Prepare** — be clear about what *you* built versus what existed. If the database was already there and you built the search and entitlement layer on top, say exactly that. The work is impressive either way; ambiguity is what creates risk.

Expect: *"How do you query 300 million records fast?"* Have a real answer about indexes, pagination strategy and what was slow.

---

## Clodura.AI bullets

### "Built and maintained Node.js backend services and REST APIs"

✅ **Safe** — expect standard API design questions. See [Clodura-DeepDive.md](Clodura-DeepDive.md).

### "Owned the migration of 8+ Angular modules to Next.js"

⚠️ **Prepare** — "owned" is a strong word. Be ready for:
- Why migrate at all? (business reason, not "Next.js is better")
- How did you run two frameworks simultaneously?
- How did you avoid breaking existing users?
- What broke, and how did you find out?

"Owned" also means you should be able to describe the **decision**, not just the execution. If someone above you decided to migrate, say "I owned the execution of the migration" — that is accurate and still strong.

### "Improved page load and API response times by 30%"

⚠️ **Prepare** — two distinct claims in one bullet. Know which was which.

The stated causes — removing redundant API calls and adding a caching layer — are good, specific and defensible. Be ready for: *"What was cached, where, and how did you handle invalidation?"* Cache invalidation is the follow-up that catches people.

### "Twilio-based dialer with number purchase, call usage tracking and call recording management, used by 100+ paying customers"

✅ **Safe and distinctive** — telephony integration is uncommon and memorable. This is a good story to lead with.

Expect: call state handling, webhooks from Twilio, what happens when a call drops, how usage was tracked for billing, where recordings were stored, and any compliance considerations around recording calls.

### "Implemented unlock workflows, credit-based entitlement validation and bulk export ... with third-party enrichment APIs as fallback sources"

⚠️ **Prepare — this is your strongest technical bullet.** It contains a genuinely hard problem: credits are money-adjacent, so correctness under concurrency matters.

Expect: *"What happens if a user double-clicks unlock? What if two requests arrive at once? How did you prevent double-charging a credit?"*

If you used a transaction, an atomic `$inc` with a condition, or a lock — say which, and why. If you did **not** handle it, say what you would do now. Recognising the race condition is worth more than having solved it.

The fallback chain across three providers is also strong — it shows resilience thinking. Be ready for: how did you decide when to fail over? What if all three failed?

### "Built interactive React charts and graphs with Recharts and Shadcn UI"

✅ **Safe** — lighter bullet. Expect questions on performance with large datasets and responsive behaviour.

### "Built a reusable UI component library of 15+ React/Next.js components ... adopted across multiple modules"

⚠️ **Prepare** — "adopted across multiple modules" is the interesting part.

Expect: how did you design the component API? How did you handle a breaking change once other teams depended on it? How did you get people to actually use it rather than writing their own? Adoption is the hard part of a component library, and interviewers know it.

### "Implemented authentication, authorization and role-based access control across the platform"

⚠️ **Prepare** — security claims get probed properly.

Know: where tokens were stored and **why**, how sessions expired and refreshed, how permissions were checked (per route? per resource?), and how you prevented a user from accessing another user's data by changing an ID in the URL. That last one — IDOR — is the question that separates people who implemented auth from people who understood it.

### "Developed real-time communication features using WebSockets and Socket.io"

⚠️ **Prepare** — expect: what did you use real-time for? What happens on reconnection? How would this behave behind a load balancer with multiple server instances?

The multi-instance question is the one people miss. If you did not solve it, the honest answer is *"we ran a single instance, so it did not come up — but with multiple instances you need a Redis adapter so sockets on different servers can reach each other."*

---

## Zongovita bullets

> "Sole Node.js backend developer ... designed and built the entire backend architecture from scratch, used daily by 200+ employees"

✅ **Safe and strong.** This is your clearest "I owned something" story.

Expect deep design questions, because there is nobody else to credit: how did you model attendance and leave? What was the trickiest rule? What would you design differently now?

**Prepare one honest mistake from this project.** Sole ownership with no acknowledged mistakes reads as either inexperience or spin.

---

## PostAgent

> "Built a full-stack, multi-tenant SaaS ... in Go, backed by MongoDB, containerized with Docker and deployed on Render"

✅ **Safe and your best AI story.** Recent, self-directed, deployed, and it demonstrates several things at once.

Strong elements to lead with:
- **Multi-tenant with per-user data isolation** — a real architectural concern
- **Per-user OAuth tokens** — token storage, refresh, revocation
- **Self-healing cron scheduler** — what does "self-healing" mean concretely?
- **Pluggable provider pipeline** — this is the fallback/resilience pattern, and it is exactly what production AI systems need

⚠️ **"Self-healing"** — be ready to define it precisely. If it means "it retries failed jobs and recovers missed schedules after a restart", say that. Vague adjectives invite scepticism.

---

## Continued professional development

> "AI Engineering & Workflow Automation, Aug 2026 – Present"

⚠️ **Prepare** — this covers your employment gap, so it will be examined. See [TrickyQuestions.md](TrickyQuestions.md).

**Make it concrete.** "Building hands-on AI engineering experience" is vague. In the interview, replace it with: what you built, what you learned, what surprised you. PostAgent is your evidence — lead with the artifact, not the activity.

🔴 **"RAG Pipelines" in your skills list** — if you list RAG, expect [these questions](../AI_Engineering_Questions/RAGPipelines.md). Specifically: chunking strategy, why chunk size matters, how you would debug bad retrieval. Listing RAG without being able to discuss chunking is the fastest way to lose credibility in an AI interview.

---

## The skills section

> "Python (Basics)"

✅ **Safe** — marking it as basics is honest and protects you. Keep the qualifier.

> "Go" — listed in both Languages and the summary

⚠️ **Expect a Go question.** Not necessarily hard, but something: goroutines vs threads, channels, error handling conventions, why you chose Go for PostAgent. "Because I wanted to learn it" is a perfectly good answer — just have one.

> "Prompt Engineering", "LLM API Integration (Gemini, Ollama)"

✅ **Safe** — backed by a real project, which is what makes these credible rather than buzzwords.

> "Linux (Basics)", "CI/CD Pipelines"

⚠️ **CI/CD has no qualifier**, unlike Linux. Expect to be asked what your pipeline actually did. See [../CICD_DevOps_Questions/](../CICD_DevOps_Questions/). If your experience is "I used the pipeline someone else set up", say so and describe what it ran.

---

## The three claims to rehearse most

If you only prepare three things from this file:

1. **The 30% improvement** — what, measured how, before and after
2. **Credit-based entitlement validation** — the concurrency question
3. **The employment gap and AI pivot** — what you built, not what you studied

---

## A general principle

For every bullet, the interviewer is silently asking: **"Did this person do this, or were they nearby when it happened?"**

The way to pass that test is specificity. Not *"I improved performance"* but *"the contact list page was making the same enrichment call once per row, so 50 rows meant 50 requests — I batched them into one and added a short-lived cache, which took the page from about 4 seconds to under 1.5."*

You do not need to have solved hard problems perfectly. You need to demonstrate that you understood what you were doing and why.

---

**Next:** [Clodura-DeepDive.md](Clodura-DeepDive.md) for the specific questions on each bullet.
