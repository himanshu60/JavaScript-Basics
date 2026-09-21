# FDE — Forward Deployed Engineer

> **Note on the term:** FDE most commonly means **Forward Deployed Engineer** — a role popularised by Palantir and now common at AI companies (Anthropic, OpenAI, Scale, Sierra). If you meant something else by "FDE", tell me and I will rewrite this file.

---

## 1. What is a Forward Deployed Engineer?

**Definition:** An FDE is a software engineer who works **directly with a customer**, embedded in their context, to build and ship a working solution on top of the company's platform. They write real production code, but they sit at the boundary between engineering and the customer.

**In simple words:** a normal engineer builds the product. An FDE takes that product to one customer, works out what they actually need, builds it, and makes it work in that customer's messy real environment.

**What it is not:**
- Not a solutions architect drawing diagrams — you ship code
- Not customer support — you build, you do not just triage
- Not a salesperson — though you will be in customer meetings constantly
- Not a consultant who leaves a slide deck — you own whether it works

---

## 2. Where the FDE sits

```
Product Engineering ←→  FDE  ←→  Customer
   (builds the          (builds      (has a messy
    platform)            on it)       real problem)
```

**The dual role:**
1. **To the customer:** you are the engineer who makes the platform solve their problem
2. **To your own company:** you are the highest-fidelity signal about what the product is missing

That second half is what makes the role valuable. FDEs discover the gaps that become the next quarter's roadmap, because they are the only people who see the product colliding with reality.

---

## 3. What an FDE actually does day to day

| Activity | Reality |
|---|---|
| **Discovery** | Sit with users and work out the real problem, which is rarely the stated one |
| **Prototyping** | Build something crude in days, not a spec in weeks |
| **Integration** | Connect to the customer's undocumented legacy systems |
| **Data wrangling** | Their data is messy, inconsistent and incomplete. Always |
| **Shipping** | Deploy into *their* environment, with *their* constraints |
| **Debugging in the dark** | Limited logging, restricted access, "it worked yesterday" |
| **Teaching** | Hand over so their team can maintain it |
| **Feeding back** | Turn recurring customer pain into product requirements |

**The typical week:** two customer calls, three days building, one day firefighting something in their environment, and a write-up for the product team on what keeps breaking.

---

## 4. The skills that matter

### Technical

| Skill | Why it matters for an FDE specifically |
|---|---|
| **Full-stack breadth** | You cannot pick your stack — you use whatever the customer has |
| **APIs and integration** | Most of the job is connecting systems that were never designed to connect |
| **Data handling** | Real data is dirty; you will write a lot of transformation code |
| **Debugging unfamiliar systems** | You will read more code than you write |
| **Speed over perfection** | A working prototype on Friday beats a beautiful architecture next month |
| **Deployment** | Docker, CI/CD, cloud — you own it end to end |
| **AI/LLM fluency** (at AI companies) | RAG, agents, evals, prompt engineering |

### Non-technical — the actual differentiator

| Skill | What it looks like |
|---|---|
| **Listening past the stated request** | "We need a dashboard" usually means "I cannot answer my boss's question" |
| **Communicating with non-engineers** | Explaining a trade-off to an operations manager without jargon |
| **Managing expectations** | Saying "that will take 3 weeks, here is what I can do by Friday" |
| **Comfort with ambiguity** | No spec, no PM, unclear success criteria — start anyway |
| **Judgement on scope** | Knowing what to build, what to fake and what to refuse |
| **Patience** | Their security team takes 3 weeks to grant database access |

> **The defining trait:** an FDE is comfortable being the only engineer in a room full of people who do not think like engineers, and can still ship something that works.

---

## 5. The FDE mindset

**Solve the problem, not the ticket.**
The customer asks for a CSV export. You discover they export to CSV so they can paste into Excel to compute one number they check daily. The real fix is a single number on a screen, not a better CSV.

**Prototype first, architect later.**
Build the ugly version in three days. Show it. Their reaction teaches you more than three weeks of requirements gathering. Most of what you build first will be wrong — find that out cheaply.

**Their constraints are real constraints.**
"Just use Postgres" is not an option when their security policy forbids new datastores. Work within the constraints or get them formally changed — do not ignore them.

**Generalise deliberately, not reflexively.**
The first customer gets a bespoke solution. The second reveals the pattern. Building a generic framework for a single customer is the classic FDE failure.

**You own the outcome, not just the code.**
"I deployed it" is not done. "They are using it daily and it survives without me" is done.

---

## 6. Common FDE interview questions

### "Why FDE rather than a standard engineering role?"

Answer honestly, with something specific. Good material: you like seeing the impact of what you build, you are energised by talking to users, you are comfortable with ambiguity, you like breadth over depth. Bad answer: anything implying you want it because it is easier or a route to something else.

### "Tell me about a time you built something for a specific user's problem."

They are testing whether you can discover a real need rather than implement a spec. Use STAR and emphasise the **discovery** — how you learned what was actually needed, and how it differed from what was asked.

### "A customer says the product is broken. How do you handle it?"

Structure the answer:
1. **Acknowledge quickly** — silence is what makes customers angry, not bugs
2. **Reproduce** — get the exact request, timestamp, input, environment
3. **Isolate** — their config, their data, or a genuine product bug?
4. **Unblock now** — a workaround today beats a proper fix next week
5. **Fix properly** — and add the test or monitor that catches it next time
6. **Close the loop** — tell them what happened and what changed

### "The customer wants a feature the platform does not support. What do you do?"

Understand the underlying need first — often an existing feature solves it from a different angle. If not: can you build it on top as a customer-specific layer? Is it a genuine product gap worth escalating with evidence? Be honest about the timeline. **Never promise a roadmap item you do not control.**

### "How do you handle a customer asking for something you think is a bad idea?"

Ask why until you understand the underlying goal. Propose an alternative that meets the goal. If they still want it and it is their call to make, build it — while documenting your concern. The line is drawn at anything unsafe, insecure or actively harmful.

### "How do you balance a customer's needs against the product roadmap?"

Build what unblocks the customer now; feed the pattern back to the product team with evidence. Watch for the trap: building so much custom code that you have created an unmaintainable fork nobody else can support.

### "Tell me about the messiest data or system you have worked with."

They want to know you do not freeze when things are not clean. Describe the mess honestly and what you did — profiling the data, handling the edge cases, deciding what to drop, and what you shipped despite it.

---

## 7. Mapping a full-stack background to FDE

If you are coming from a product engineering role, these translate directly:

| Your experience | The FDE framing |
|---|---|
| Migrating modules between frameworks | Working inside constraints you did not choose, without breaking users |
| Being the sole backend owner | End-to-end ownership, no one else to escalate to |
| Integrating third-party APIs with fallbacks | Real-world integration where services fail |
| Building on a very large dataset | Handling scale and messy real data |
| Building a reusable component library | Spotting the pattern across cases and generalising it |
| Shipping features used by paying customers | Understanding that shipped ≠ done; adoption matters |
| A pluggable multi-provider AI pipeline | Designing for constraints that vary per environment |

**The reframe that matters:** stop describing *what you built* and start describing *whose problem it solved and how you knew it worked*. That single shift is what separates an FDE answer from a standard engineering answer.

---

## 8. Questions worth asking them

Asking these signals that you understand the role:

- How many customers would I be working with at once?
- How much time is customer-facing versus building?
- Where does FDE-written code live — in the customer's repo, or does it graduate into the product?
- How does feedback from FDEs actually reach the product roadmap?
- What does success look like at 6 months? Deployments, adoption, retention?
- How much travel or on-site time is involved?
- What is the biggest source of friction for FDEs here today?
- Is there a path between FDE and core product engineering in either direction?

---

## 9. Red flags to listen for

| Signal | What it may mean |
|---|---|
| "You'll own 15 customers" | Firefighting, not building |
| No path for FDE work to reach the product | You are writing throwaway code forever |
| "Whatever it takes to close the deal" | Engineering used as a sales concession |
| No one can describe what FDE success looks like | The role is undefined and you will absorb everything |
| Entirely reactive, no building | This is support with a better title |

---

## Key points

- An FDE is an engineer **embedded with a customer**, shipping real code against their real constraints.
- The dual role: solve the customer's problem, and carry what you learn back into the product.
- Breadth beats depth — you use whatever stack the customer has.
- **Communication and judgement matter as much as coding ability.**
- Solve the underlying problem, not the literal request.
- Prototype fast, generalise only once the pattern is proven across customers.
- You own the **outcome** — adoption, not deployment.
- In interviews, lead with the problem and the user, not the technology.
