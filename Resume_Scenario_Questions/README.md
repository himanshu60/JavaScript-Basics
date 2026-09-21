# Resume-Based Scenario Questions

Interview questions generated from your actual resume, plus a structure for answering each one.

> **How to use this folder:** the questions are real — these are what an interviewer will ask after reading your resume. The **answers are scaffolds, not scripts.** Only you know the real numbers, the names of the systems and what actually went wrong. Fill in the gaps marked `[…]` before you rely on any of this.

---

## Files

| File | Covers |
|---|---|
| [ResumeAudit.md](ResumeAudit.md) | Every claim on your resume that invites a follow-up question — and the ones that are risky |
| [Clodura-DeepDive.md](Clodura-DeepDive.md) | Questions on each Clodura.AI bullet: migration, 30% improvement, Twilio dialer, 300M records, UI library, RBAC, WebSockets |
| [Projects-DeepDive.md](Projects-DeepDive.md) | PostAgent and the Zongovita attendance system |
| [BehavioralSTAR.md](BehavioralSTAR.md) | STAR method plus the 15 behavioural questions you will actually get |
| [SystemDesignScenarios.md](SystemDesignScenarios.md) | Design questions matched to your background |
| [TrickyQuestions.md](TrickyQuestions.md) | The career gap, why you left, salary, weaknesses, the Angular→Next.js "why" |

---

## Your resume in one table

Interviewers will anchor on these. Know each one cold.

| Claim | Where the questions will come from |
|---|---|
| 3+ years, full stack | Breadth vs depth — expect "which are you strongest at?" |
| **8+ Angular → Next.js migrations** | Why migrate? How did you avoid breaking users? |
| **Load times cut 30%** | How did you measure it? Before and after what? |
| **Sole Node.js backend owner, 200+ employees** | Full ownership — schema design, decisions, mistakes |
| **300M+ record contact database** | Scale, indexing, query performance, pagination |
| **1000+ customers, 100+ paying on the dialer** | Real users, real consequences |
| **15+ component React UI library** | API design, adoption, versioning |
| Twilio dialer, call recording | Third-party integration, telephony, billing |
| Credit-based entitlement validation | Race conditions, transactions, correctness under concurrency |
| Third-party enrichment with fallbacks | Resilience, provider failover |
| WebSockets / Socket.io | Real-time, scaling, reconnection |
| RBAC across the platform | Security design |
| **PostAgent** (Go, MongoDB, LLM, Docker) | Your strongest AI story — multi-tenant, OAuth, cron, pluggable providers |
| RAG, Gemini/Ollama, n8n | Recent AI work — expect depth checks |
| Go | You list it twice — expect a Go question |

---

## The three stories to prepare properly

Interviewers remember stories, not bullet lists. Prepare these three until you can tell each in 2 minutes:

### 1. Your hardest technical problem
**Best candidates from your resume:** the credit-based entitlement system (correctness under concurrency), or querying 300M records fast.
**Structure:** what made it hard → what you tried → what worked → how you verified it.

### 2. Something you owned end to end
**Best candidate:** the Zongovita attendance system — sole backend developer, built from scratch, 200+ daily users.
**Structure:** the constraint (alone, from zero) → the decisions you made → what you would do differently now.

### 3. Something you built recently that shows you are still growing
**Best candidate:** PostAgent — Go, multi-tenant, OAuth, pluggable LLM providers, deployed.
**Structure:** why you built it → the interesting design decision → what it taught you.

> Every one of these should end with something you learned or would change. Interviewers trust candidates who can critique their own work far more than those who present everything as a success.

---

## The single most important preparation step

For each resume bullet, be able to answer **four questions**:

1. **What exactly did you do?** (your part, not the team's)
2. **Why that approach?** (what else did you consider?)
3. **How do you know it worked?** (the measurement)
4. **What would you do differently?** (self-awareness)

Bullets where you cannot answer all four are the ones that will expose you. Go through [ResumeAudit.md](ResumeAudit.md) and mark them.

---

## Interview day structure

| Round | What they test | Your prep |
|---|---|---|
| **Screening** | Can you communicate? Is the resume real? | The 2-minute intro, the three stories |
| **DSA / coding** | Problem solving | [../DSA_Questions/](../DSA_Questions/) |
| **Tech deep dive** | Do you understand what you built? | [Clodura-DeepDive.md](Clodura-DeepDive.md), [Projects-DeepDive.md](Projects-DeepDive.md) |
| **System design** | Can you think at scale? | [SystemDesignScenarios.md](SystemDesignScenarios.md) |
| **Behavioural / culture** | Will you work well here? | [BehavioralSTAR.md](BehavioralSTAR.md) |
| **Your questions** | Are you serious about this role? | End of [TrickyQuestions.md](TrickyQuestions.md) |

---

**Technical revision:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md) · **AI depth:** [../AI_Engineering_Questions/](../AI_Engineering_Questions/)
