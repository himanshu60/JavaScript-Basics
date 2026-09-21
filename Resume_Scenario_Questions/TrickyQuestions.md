# The Tricky Questions

The uncomfortable ones. These decide more interviews than the technical rounds, because an unprepared answer here is obvious.

> All answers below are **scaffolds**. Rewrite them in your own words — a memorised answer sounds memorised.

---

## 1. The employment gap

> *"Your last role ended in July 2026 and it's now September. What have you been doing?"*

**This is not a hostile question.** A two-month gap is short and completely normal. The only way to fail it is to sound defensive or vague.

**What not to do:** apologise, over-explain, or describe it as "taking a break to upskill" without evidence.

**What works — lead with the artifact:**

> "I've been going deep on AI engineering. The main thing I built is PostAgent — a multi-tenant SaaS in Go that researches trending topics, generates LinkedIn posts with an LLM and publishes them on a schedule per user. It's deployed and running.
>
> What I got out of it: designing a pluggable pipeline across four different LLM providers so it degrades gracefully, handling per-user OAuth tokens and data isolation, and a scheduler that recovers from missed runs. I also worked through RAG properly and automated a few workflows with n8n.
>
> I'd been doing backend and frontend work for three years and wanted to add AI engineering deliberately rather than picking it up incidentally — so I gave it focused time."

**Why this works:** it is short, it has a concrete deliverable, and it frames the gap as a **decision**, not a circumstance.

> **Prepare the demo.** If you mention PostAgent, they may open it. Check the live link works the morning of the interview.

---

## 2. Why did you leave Clodura?

**Rule one: never criticise them.** Even if it was genuinely bad. The interviewer hears "this is how he will talk about us".

**Safe, honest framings — pick whichever is actually true:**

- **Growth direction:** "I'd spent two and a half years there and learned a lot, especially owning the migration and the contact search work. I wanted to move toward AI product engineering, and that wasn't the direction the platform was going."
- **Scope:** "I was increasingly the person figuring things out alone. I'd like to work somewhere with more senior engineers to learn from."
- **Company circumstances:** if there were layoffs or restructuring, say so plainly and without drama — it is common and nobody holds it against you.

**Then pivot forward:** "...which is what drew me to this role, because [specific thing about their job]."

**If it ended badly:** keep it factual, short, and non-emotional. "It wasn't the right fit in the end, and we both recognised that" is enough. Do not elaborate unless pressed, and do not let the answer run long — length signals discomfort.

---

## 3. Why are you switching to AI / are you leaving full stack behind?

**The concern behind the question:** "Is this person chasing a trend, and will they leave when the next one comes?"

**The answer that lands:**

> "I'm not switching away from engineering — I'm adding to it. Most AI features still need someone who can build the actual product around them: the API, the auth, the data model, the deployment. PostAgent was as much a Go backend and multi-tenancy problem as an LLM one.
>
> What I want is roles where the AI part is real product work, not a demo. My backend experience is what makes that possible."

**Why this works:** it positions the AI work as an extension of existing strength rather than a pivot away from it — which is also true, and the most employable framing.

---

## 4. You list a lot of technologies. How deep is each?

**Answer with an honest ranking.** Claiming equal depth across React, Next.js, Angular, Node and Go is not credible.

> "Strongest in Node.js and React — that's most of my production work. Next.js I used heavily through the migration, so I'm solid on the App Router, rendering strategies and data fetching. Angular I worked in daily but mostly maintaining and migrating away from it, so I'd need a ramp-up for greenfield Angular. Go is newest — I built PostAgent in it and I'm productive, but I wouldn't claim depth yet."

**Volunteering your weakest area first, unprompted, buys enormous credibility.** It also means you control the framing rather than being caught out.

---

## 5. Explain your 30% improvement

Covered in detail in [Clodura-DeepDive.md](Clodura-DeepDive.md), but the short version: **know what you measured, how, and the before/after numbers.**

If you genuinely do not remember the exact figures:

> "I don't want to quote a number I can't stand behind precisely — what I remember clearly is the cause: the list view was making the same enrichment call per row, so I batched it and added a short-lived cache. `[Page]` went from feeling sluggish to loading in about `[X]`. The 30% figure came from `[Lighthouse / our APM]` on `[the main pages]`."

**Admitting imprecision about a number while being precise about the cause is a strong answer.** Bluffing a number you cannot defend is a weak one.

---

## 6. What's your biggest weakness?

**Never use a disguised strength** ("I'm a perfectionist"). Interviewers have heard it a thousand times and it reads as evasive.

**The formula:** a real weakness + what you are concretely doing about it + evidence of progress.

**Options that fit your profile honestly:**

- *"I've mostly worked without a lot of senior review — at Zongovita I was the only backend developer, and at Clodura I often figured things out alone. That made me self-sufficient, but I know my code would be better with more review. I've started being much more deliberate about asking for feedback early rather than presenting finished work."*
- *"Testing. I've been on teams where testing wasn't part of the culture, so my instinct is still to test manually. I've been forcing myself to write tests first on personal projects."*
- *"I sometimes go too deep on a technical detail before checking it matters. I'm getting better at asking 'what's the simplest version that would work?' first."*

**Rule:** it must be real enough to be believable, but not the core competency of the job you are applying for.

---

## 7. What's your expected salary?

**Try to defer once, politely:**

> "I'd like to understand the role a bit better first. Do you have a range budgeted for this position?"

**If pressed, give a range, not a number** — and make your floor a number you would genuinely accept:

> "Based on my experience and what I've seen for similar roles, I'm looking at ₹X to ₹Y. But I'm more focused on the role and the team, so there's room to discuss."

**Preparation:**
- Research actual ranges (Glassdoor, AmbitionBox, levels.fyi, people in your network)
- Know your **walk-away number** before the call
- Your current CTC is not the ceiling — you are being paid for the next role, not the last one
- In India, expect to be asked for current CTC. Answering with your **expected** range is normal and acceptable

**Do not** give a number you would resent accepting. You will be anchored to it.

---

## 8. Why should we hire you over other candidates?

**Do not list everything.** Pick **three** things that match *their* job description.

> "Three things. First, I've owned backend systems end to end — at Zongovita I was the only backend developer on a system 200+ people used daily, so I'm comfortable with full ownership. Second, I've worked on things where correctness actually mattered — credit-based entitlements over a 300 million record database, where charging someone twice is a real problem. Third, the AI work is hands-on, not theoretical — PostAgent is deployed and I can walk you through the design decisions.
>
> Given `[the specific thing in their JD]`, that combination seems like a good fit."

---

## 9. You've only been at companies for 1–2 years. Are you a job hopper?

**If asked, answer directly without defensiveness:**

> "Zongovita was around five months — I joined as the sole backend developer, built the attendance system, and left when the Clodura opportunity came up, which was a significant step up in scope. Clodura was about two and a half years, which is where most of my experience is. I'm looking for somewhere I can stay and grow — that's part of what I'm evaluating."

**Note:** your Clodura tenure is ~2.5 years, which is solid. Lead with that rather than the shorter role.

---

## 10. What do you know about our company?

**Never wing this.** It is the easiest question to prepare and the most damaging to fumble.

**Before every interview, know:**
- What the product does, in one sentence — ideally having used it
- Who their customers are
- Something recent: a funding round, a launch, a blog post, an engineering post
- Their tech stack, if public (job posts, GitHub, engineering blog)
- **One genuine question** that shows you looked

> "I read your engineering post about `[X]` — I was curious about `[specific follow-up]`."

That single sentence puts you ahead of most candidates.

---

## 11. Do you have any questions for us?

**Always yes.** "No, I think you covered everything" reads as disinterest.

Have **5 prepared** (some will get answered naturally). See the full list in [BehavioralSTAR.md](BehavioralSTAR.md).

**The highest-value one to end on:**

> "Is there anything about my background that gives you hesitation? I'd rather address it now than have it be a question mark."

It is uncomfortable, but it surfaces objections while you can still answer them — and it signals confidence.

---

## 12. Questions with no good answer — how to handle them

Occasionally you get something unreasonable: a trivia question, an impossible brainteaser, or a topic you genuinely have not touched.

**The move:**

> "I haven't worked with that directly. What I do know is `[adjacent knowledge]`, and my instinct would be `[reasoning]` — but I'd want to actually build something with it before saying I know it. Is it central to the role?"

**Three things this does:** it is honest, it shows reasoning, and it gathers information about whether the gap matters.

**What never works:** guessing confidently. Interviewers can tell, and a confident wrong answer is far worse than an honest gap.

---

## 13. The interview is going badly. What now?

It happens. You blank on something, or the coding round goes wrong.

- **Do not spiral.** One bad answer does not decide it — visible panic might.
- **Name it and recover:** "I'm overcomplicating this, let me restart with the simpler approach."
- **Think out loud.** A partial solution with clear reasoning often scores better than silence.
- **Ask for a hint.** It is not a penalty in most companies — it mirrors real collaboration.
- **Follow up after.** If you realise the answer an hour later, a short email mentioning it is fine and occasionally saves an interview.

---

## Your specific preparation checklist

Before any interview, be able to answer these without hesitating:

- [ ] The two-month gap — with PostAgent as the concrete answer
- [ ] Why you left Clodura — forward-looking, no criticism
- [ ] The 30% claim — what, measured how, before/after
- [ ] Your honest skill ranking across the five technologies you list
- [ ] The credit/concurrency question — it is your best technical story
- [ ] One real failure, with the systemic fix
- [ ] Your salary range and your walk-away number
- [ ] Three specific things about the company
- [ ] Five questions for them
- [ ] PostAgent's live demo actually works today

---

## The underlying principle

Every one of these questions is really testing the same thing: **can you be honest about something uncomfortable without becoming defensive?**

Candidates lose these questions by bluffing, over-explaining, or getting emotional — not by having an imperfect answer. A two-month gap, a shorter first role, or a number you cannot recall precisely are all completely survivable. Sounding evasive about them is not.

---

**Related:** [BehavioralSTAR.md](BehavioralSTAR.md) · [ResumeAudit.md](ResumeAudit.md)
