# Behavioural Questions and the STAR Method

---

## 1. What is STAR?

**Definition:** A structure for answering behavioural questions so they are specific and complete rather than vague.

| Letter | Meaning | Time to spend |
|---|---|---|
| **S** — Situation | The context, briefly | 15% |
| **T** — Task | What you specifically needed to do | 15% |
| **A** — Action | **What you did** — the detail goes here | 55% |
| **R** — Result | The outcome, with a number if possible | 15% |

**The two most common mistakes:**
1. Spending three minutes on Situation and thirty seconds on Action — they want to know what *you* did
2. Saying "we" throughout. The interviewer is assessing **you**. Use "I" for your contribution and "we" only for genuine team context.

**Add a fifth element:** what you **learned** or would do differently. It turns a good answer into a memorable one.

---

## 2. Your 2-minute introduction

> *"Tell me about yourself."*

This is not a biography. It is a 90-second pitch ending at why you are in this room.

**Structure:**
1. **Now** — what you do and your strongest area (15s)
2. **Path** — 2–3 highlights that build to the present (45s)
3. **Recent** — what you have been doing lately (20s)
4. **Why here** — why this role, specifically (20s)

**A version from your resume — adapt the wording to sound like you:**

> "I'm a full stack engineer with around three years of experience, mostly in Node.js and React on production SaaS.
>
> I started at Zongovita as the sole backend developer building an attendance system from scratch for 200+ employees — that taught me end-to-end ownership early, because there was nobody to escalate to.
>
> Then at Clodura.AI I worked across a sales intelligence platform. The work I'm proudest of is the contact search and entitlement layer over a 300 million record database, and a Twilio dialer used by 100+ paying customers. I also owned migrating 8+ modules from Angular to Next.js.
>
> Since July I've been going deep on AI engineering — I built PostAgent, a multi-tenant SaaS in Go that generates and publishes LinkedIn content on a schedule, with a pluggable pipeline across four LLM providers.
>
> I'm looking for a role where I can combine the production backend experience with the AI work — which is why this one interested me."

**Rules:** practise until it is natural but not memorised, stop at 90 seconds, and end on *them*, not you.

---

## 3. The questions you will actually get

### "Tell me about a challenging technical problem you solved."

**Your best material:** the credit entitlement race condition, or making search fast over 300M records.

**Structure:**
- **S:** Users unlock contacts by spending credits. `[what was going wrong]`
- **T:** I had to guarantee a user was charged exactly once, even with concurrent requests
- **A:** Explain what you investigated, what you ruled out, and the actual mechanism you used — atomic conditional update, transaction, idempotency key, unique constraint
- **R:** `[what changed — duplicate charges eliminated, support tickets dropped, etc.]`
- **Learned:** anything money-adjacent needs to be correct at the database level, not the UI level

### "Tell me about a time you failed or made a mistake."

**Do not dodge this.** "I work too hard" is a non-answer and interviewers notice.

**What a good answer contains:**
1. A real mistake with real consequences
2. That you owned it — no blaming others or circumstances
3. What you did immediately to fix it
4. **The systemic change** so it could not recur

**Good candidates from your background:** something breaking during the Angular→Next.js migration, a production issue at Zongovita (your resume mentions resolving production issues), or a design decision on the attendance schema you later regretted.

**The part that matters is step 4.** "I was more careful afterwards" is weak. "I added a check to the pipeline / changed the process so it could not happen again" is strong.

### "Tell me about a disagreement with a colleague or manager."

**They are testing:** can you disagree professionally and commit to a decision that goes against you?

**Structure:** the technical disagreement → how you made your case (with data, not opinion) → how it was resolved → **that you committed fully to the outcome even if you lost**.

**Avoid:** any story where you were obviously right and they were obviously foolish. That reads as inability to see other perspectives.

### "Tell me about a time you had to learn something quickly."

**Your strongest material:** Go and the AI stack since July, or Next.js during the migration.

Emphasise your **method** — how you learn, not just that you did. Building something real is the strongest answer, and you have PostAgent as proof.

### "Tell me about a time you disagreed with a requirement."

Good material: a feature request that would have been slow or unsafe at 300M records, or a business rule in the attendance system that did not work in practice.

**Structure:** understand *why* they wanted it → propose an alternative meeting the same goal → outcome.

### "How do you handle tight deadlines?"

**They want to hear:** you communicate early rather than going quiet and missing it.

Structure: assess what is actually required → identify what can be cut or phased → **raise the risk early** → deliver the core → follow up with the rest. The key beat is surfacing the problem before the deadline, not on it.

### "Tell me about working with a difficult stakeholder."

Reframe: rarely is someone difficult for no reason. Usually there is a pressure you cannot see. Good answers show you sought to understand the underlying concern.

### "How do you prioritise when everything is urgent?"

Good framing: impact vs effort, what is blocking others, what is genuinely reversible, and — critically — **asking the person who owns the priorities** rather than guessing silently.

### "Tell me about a time you improved something nobody asked you to."

Your resume has this: eliminating redundant API calls and adding caching for the 30% improvement. Frame it as noticing a problem, quantifying it, doing it, and measuring the result.

### "How do you handle code review feedback?"

Simple and honest: feedback is about the code, not you; ask questions when you do not understand the reasoning; push back with rationale when you disagree; and mention what you have learned from reviews.

### "Tell me about mentoring or helping someone."

Even without formal mentoring: onboarding someone onto the component library, documenting something so others could use it, or explaining the migration approach to the team.

### "Why are you leaving / why did you leave?"

See [TrickyQuestions.md](TrickyQuestions.md).

### "What are you looking for in your next role?"

Be specific and connect it to them. Vague answers ("growth", "challenges") are forgettable. Something like: *"Backend ownership with real AI product work, and a team where I'd learn from people more senior than me — at Clodura I was often the person figuring it out alone, and I'd like more of the opposite."*

### "Where do you see yourself in 3 years?"

Honest direction beats a title. Combining depth in backend engineering with AI product work is a coherent answer given your trajectory.

### "Why should we hire you?"

Match three things you have to three things the job description asks for. Do not list everything — pick the three that matter most for *their* role.

---

## 4. Preparing your story bank

Rather than preparing 15 answers, prepare **6 stories** you can reshape:

| # | Story | Answers questions about |
|---|---|---|
| 1 | Credit entitlement / concurrency | Hard problem, attention to detail, correctness |
| 2 | Angular → Next.js migration | Ownership, working incrementally, risk |
| 3 | Zongovita sole ownership | Autonomy, design decisions, learning fast |
| 4 | Twilio dialer | Integration, real customers, debugging |
| 5 | PostAgent | Self-directed learning, recent growth, AI |
| 6 | `[A real failure]` | Mistakes, resilience, process improvement |

Story 6 is the one people skip. **Prepare it properly** — it comes up in almost every behavioural round and an unprepared answer is obvious.

---

## 5. Delivery

| Do | Don't |
|---|---|
| Use "I" for your work | Say "we" throughout |
| Give concrete numbers | Say "significantly improved" |
| Name real trade-offs | Present everything as a clean success |
| Admit what you did not know | Bluff — it is always visible |
| Keep answers to ~2 minutes | Ramble until they interrupt |
| Ask if they want more depth | Assume they want the full history |
| Say "I don't know, but here's how I'd find out" | Invent an answer |

**On "I don't know":** it is a *good* answer when followed by reasoning. *"I haven't worked with Kafka directly. From what I understand it's a distributed log rather than a queue, so consumers can replay — but I'd want to actually build something with it before claiming I know it."* That is far better than a confident wrong answer.

---

## 6. Questions to ask them

Not asking questions reads as disinterest. Have 5 ready, since some get answered during the conversation.

**About the work:**
- What does the first 90 days look like for this role?
- What is the hardest technical problem the team is working on now?
- How much is new development versus maintaining existing systems?
- How are technical decisions made — who decides, and how?

**About the team:**
- How is the team structured, and where would I sit?
- What does code review look like here?
- How do you handle on-call and production incidents?

**About growth:**
- What separates someone doing well in this role from someone doing exceptionally?
- What happened to the last person in this role?

**Honest and useful:**
- What is the biggest frustration for engineers on this team right now?
- Is there anything about my background that makes you hesitant?

> That last one is uncomfortable but valuable — it surfaces an objection while you are still in the room to answer it.

---

## Key points

- **STAR**, with the majority of time on **Action**, and add what you learned.
- Use **"I"**, not "we" — they are assessing you.
- Prepare **6 stories**, not 15 answers — reshape them per question.
- The **failure story** is the one people skip and the one that gets asked.
- Numbers beat adjectives every time.
- "I don't know, but here's how I'd approach it" beats bluffing.
- Always have questions ready.
