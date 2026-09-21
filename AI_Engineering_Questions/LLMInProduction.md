# Running LLMs in Production

The gap between a working demo and a production feature is almost entirely **cost, latency, reliability and evaluation**.

---

## 1. Cost

**Definition:** You pay per token, with **input** (prompt) and **output** (completion) priced differently — output is typically 3–5× more expensive because it is generated one token at a time.

```
cost = (input_tokens × input_rate) + (output_tokens × output_rate)
```

**The trap:** a chat application re-sends the whole conversation on every turn, so cost grows **quadratically** with conversation length.

```
Turn 1:  500 tokens in
Turn 10: 5,000 tokens in     ← the same history, re-sent every time
Turn 50: 25,000 tokens in
```

### Reducing cost

| Technique | Typical saving |
|---|---|
| **Use a smaller model** where quality allows | 10–60× |
| **Prompt caching** on a stable system prompt | Up to 90% on cached tokens |
| **Cache identical requests** (exact or semantic) | 100% on hits |
| **Trim / summarise history** | Large on long chats |
| **Cap `max_tokens`** | Prevents runaway generation |
| **Batch offline work** | ~50% on some providers |
| **Shorter prompts** | Direct and immediate |

**Definition of Prompt Caching:** Providers can cache the processed form of a long, unchanging prefix (your system prompt, few-shot examples, a document) so it is not reprocessed each call. Put **static content first** and variable content last to maximise the cacheable prefix.

```js
// ✅ Cacheable prefix first
[
  { role: "system", content: LONG_STATIC_INSTRUCTIONS },   // cached
  { role: "user",   content: retrievedDocs },              // cached if repeated
  { role: "user",   content: userQuestion },               // varies
]
```

**Model routing** — the highest-leverage cost technique:

```js
async function route(query) {
  const complexity = await classify(query);       // one cheap, small-model call
  return complexity === "simple"
    ? smallModel.complete(query)                  // handles ~80% of traffic
    : largeModel.complete(query);
}
```

**Always track cost per request** and alert on anomalies. A prompt change that adds 2,000 tokens is invisible until the invoice arrives.

---

## 2. Latency

**Definition of TTFT (Time To First Token):** How long before the first character appears. This is what users actually perceive as speed.
**Definition of TPS (Tokens Per Second):** How fast the rest streams out.

**What drives latency:**

| Factor | Effect |
|---|---|
| Output length | **Dominant** — each token is generated sequentially |
| Model size | Bigger is slower |
| Input length | Moderate (processed in parallel) |
| Reasoning models | Much slower — they generate hidden reasoning tokens |
| Chained calls | Additive — 3 calls = 3× the latency |

### Streaming

**Definition:** Sending tokens to the client as they are produced rather than waiting for the complete response. It does not reduce total time, but it cuts *perceived* latency enormously — text starts appearing in ~300ms instead of after 8 seconds.

```js
// Server: stream via Server-Sent Events
app.get("/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");

  const stream = await llm.stream({ messages });

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
  }
  res.write("data: [DONE]\n\n");
  res.end();
});
```

**Streaming is effectively mandatory for any chat interface.** Users tolerate a slow stream far better than a fast blank screen.

### Other latency techniques

```js
// Run independent calls in parallel, never sequentially
const [summary, sentiment, entities] = await Promise.all([
  summarize(text), analyzeSentiment(text), extractEntities(text),
]);

// Start retrieval before you need it
const docsPromise = retrieveDocs(query);     // begins immediately
const rewritten = await rewriteQuery(query);
const docs = await docsPromise;              // already done

// Show progress during long agent runs
onStep: (step) => sendToClient({ status: `Searching ${step.tool}...` })
```

---

## 3. Caching

| Layer | Definition | Hit rate |
|---|---|---|
| **Exact match** | Same prompt string → cached response | Low but free |
| **Semantic cache** | Similar question (by embedding) → cached response | Higher, riskier |
| **Prompt cache** | Provider caches the static prefix | Very effective |
| **Embedding cache** | Never re-embed unchanged text | Near 100% |

```js
// Exact-match cache with a TTL
const key = hash(model + JSON.stringify(messages) + temperature);
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);

const result = await llm.complete({ messages });
await redis.setex(key, 3600, JSON.stringify(result));
```

> ⚠️ **Never cache across users** unless the request contains no user-specific data. A semantic cache serving user A's answer to user B is a data leak, and it is an easy mistake to make.

---

## 4. Reliability

**Definition:** LLM APIs fail — rate limits, timeouts, overloaded servers, malformed output. Production code must assume failure.

```js
async function completeWithRetry(params, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await llm.complete({ ...params, timeout: 30_000 });
    } catch (err) {
      // Do not retry errors that will fail identically
      if (err.status === 400 || err.status === 401) throw err;

      if (attempt === maxRetries - 1) throw err;

      // Exponential backoff with jitter to avoid a thundering herd
      const delay = Math.min(1000 * 2 ** attempt, 10_000) + Math.random() * 1000;
      await sleep(delay);
    }
  }
}
```

**Fallback chain:**

```js
async function robustComplete(messages) {
  try {
    return await primaryModel.complete({ messages });
  } catch (err) {
    logger.warn({ err }, "Primary failed, trying fallback");
    try {
      return await fallbackProvider.complete({ messages });
    } catch {
      return { text: "I'm having trouble right now. Please try again shortly.",
               degraded: true };          // degrade gracefully, never 500
    }
  }
}
```

> Your resume's PostAgent used a **pluggable provider pipeline** (Gemini, OpenRouter, Ollama, Pollinations) — that is exactly this pattern, and it is a strong thing to talk about in an interview.

**Validating output:**

```js
import { z } from "zod";

const Schema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  confidence: z.number().min(0).max(1),
});

async function extract(text, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const raw = await llm.complete({ messages: buildPrompt(text), temperature: 0 });
    const parsed = Schema.safeParse(tryParseJSON(raw));

    if (parsed.success) return parsed.data;

    // Feed the error back so the model can correct itself
    messages.push({ role: "user", content: `Invalid output: ${parsed.error.message}. Return valid JSON only.` });
  }
  throw new Error("Failed to get valid structured output");
}
```

---

## 5. Guardrails

**Definition:** Checks on input and output that run outside the model, because you cannot rely on prompting alone for safety or correctness.

**Input guardrails:**
- Length limits (a 500k-character paste is an attack or a bug)
- Rate limiting per user
- PII detection and redaction before sending to a third party
- Prompt-injection pattern detection

**Output guardrails:**
- Schema validation (zod)
- Check for leaked secrets or system-prompt text
- Verify citations actually exist in the retrieved context
- Business rules — a discount over 50% needs approval regardless of what the model said

```js
function validateOutput(output, context) {
  if (output.includes(process.env.SYSTEM_PROMPT_MARKER)) throw new Error("Prompt leak");

  for (const citation of extractCitations(output)) {
    if (!context.some((c) => c.id === citation)) {
      throw new Error(`Hallucinated citation: ${citation}`);
    }
  }
  return output;
}
```

> **Golden rule:** treat LLM output as **untrusted user input**. Never pass it unvalidated into SQL, a shell command, `eval`, or a privileged API call.

---

## 6. Evaluation

**Definition:** An eval is a test suite for non-deterministic output. Without one you are changing prompts and guessing whether things improved.

**Build it in this order:**

```js
// 1. Collect 30-50 REAL cases (from actual usage, not invented)
const evalSet = [
  { input: "What is the refund window?", expected: "30 days", mustContain: ["30"] },
  { input: "asdfgh",                     expectBehaviour: "asks for clarification" },
];

// 2. Grade - deterministic checks where possible, LLM judge where not
async function grade(testCase, output) {
  if (testCase.mustContain) {
    return testCase.mustContain.every((s) => output.includes(s));   // cheap and exact
  }
  return await llmJudge(testCase, output);                          // for subjective cases
}

// 3. Run on every prompt or model change
// 4. Block the deploy if the score drops
```

**Types of eval:**

| Type | Definition |
|---|---|
| **Deterministic** | Exact match, regex, schema valid, contains-required-string |
| **LLM as judge** | A model scores the output against criteria |
| **Human review** | Sampling real production traffic |
| **A/B test** | Compare variants on live traffic with a business metric |

**What to measure in production:** task success rate, user thumbs up/down, retry rate, escalation-to-human rate, cost per resolved request, and p95 latency.

> **Interview point:** "we added evals so prompt changes stopped being guesswork" signals seniority more than any model-name knowledge.

---

## 7. Security

| Risk | Mitigation |
|---|---|
| **Prompt injection** | Delimiters; treat retrieved content as untrusted; validate output |
| **Data leakage to the provider** | Redact PII; check data-retention terms; use a local model for sensitive data |
| **Cross-user cache leak** | Never share a cache across users for personalised content |
| **Excessive agency** | Human approval for destructive/financial actions |
| **Cost attack** | Per-user rate limits and hard spend caps |
| **Model output in privileged context** | Parameterise everything; never `eval` model output |

---

## 8. Local models

**Definition:** Running an open-weight model on your own hardware (commonly via **Ollama**) instead of calling a hosted API.

```js
const response = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  body: JSON.stringify({ model: "llama3", prompt, stream: false }),
});
```

| | Hosted API | Local (Ollama) |
|---|---|---|
| Quality | Highest | Good, not frontier |
| Cost | Per token | Hardware + electricity |
| Privacy | Data leaves your network | **Fully private** |
| Latency | Network round trip | No network hop |
| Scaling | Automatic | You manage it |
| Offline | ❌ | ✅ |

**Use local when:** data cannot leave your network, volume is high and the task is simple, you need offline capability, or you are prototyping without API costs.

---

## 9. A production checklist

- [ ] Streaming enabled for user-facing text
- [ ] Retry with exponential backoff and jitter
- [ ] Fallback model or graceful degradation — never a raw 500
- [ ] Timeouts on every call
- [ ] `max_tokens` set on every call
- [ ] Output validated against a schema
- [ ] Cost tracked and alerted per request
- [ ] Rate limiting per user
- [ ] Prompt caching for static prefixes
- [ ] Prompts versioned in code
- [ ] Eval suite run on every prompt/model change
- [ ] Full request/response logging (with PII redacted)
- [ ] Human approval for irreversible actions
- [ ] Model and prompt version recorded with every request

---

## Key points

- **Output tokens cost most and drive latency**; chat history growth makes cost quadratic.
- **Route by complexity** — a small model handles most traffic at a fraction of the price.
- **Prompt caching** rewards putting static content first.
- **Streaming** does not reduce total time but transforms perceived speed.
- Retry with **backoff**, keep a **fallback provider**, and degrade gracefully.
- **Validate output with a schema** and feed parse errors back for a retry.
- Treat model output as **untrusted input** — never into SQL, shells or `eval`.
- **Never cache across users** for personalised content.
- **Evals turn prompt changes from guesswork into engineering** — this is the senior signal.
- Local models via Ollama win on privacy, offline use and high-volume simple tasks.
