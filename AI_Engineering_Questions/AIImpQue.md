# AI Engineering Interview Questions and Answers

## LLM Fundamentals

## 1. What is an LLM and how does it work?

A neural network trained on large amounts of text to predict the **next token**. Everything it does is that one operation repeated. It does not look facts up — it produces the most statistically plausible continuation, which is why hallucination happens.

## 2. What is a token?

The unit the model processes — roughly a word piece. About 4 characters or 0.75 words per token in English. Tokens drive pricing, context limits and latency. Code, JSON punctuation and non-Latin scripts cost more tokens.

## 3. What is a context window?

The maximum tokens a model can handle in one request, covering **both** the prompt and the response. It is the model's entire working memory for that call.

## 4. If LLMs are stateless, how does a chatbot remember?

It does not. The application re-sends the **entire conversation** on every request. This is why long chats get slower and more expensive, and why history eventually needs trimming or summarising.

## 5. What is temperature?

A randomness setting. `0` gives deterministic, repetitive output — correct for extraction and classification. Higher values give more creative, varied output. Tune temperature *or* `top_p`, not both.

## 6. Is temperature 0 fully deterministic?

No. Floating-point non-determinism in GPU batching means identical inputs can still produce slightly different outputs.

## 7. What is hallucination and how do you reduce it?

Fluent, confident, factually wrong output. It happens because the model optimises for plausibility, not truth. Reduce it with RAG grounding, an explicit instruction to abstain, required citations, low temperature and a verification pass. It cannot be eliminated — design for it.

## 8. What are embeddings?

Vectors representing the **meaning** of text. Similar meanings produce similar vectors, so "reset my password" matches "account recovery" despite sharing no words. Similarity is measured with cosine similarity.

## 9. What is "lost in the middle"?

Models attend most reliably to the start and end of a long context. Information buried in the middle is more likely to be missed — so put instructions first and the most important data last.

## 10. RAG vs fine-tuning vs prompting — when do you use each?

**Prompting** changes behaviour and costs nothing — always try it first. **RAG** adds *knowledge* and is the right answer for "the model needs to know our data". **Fine-tuning** teaches *style, format and behaviour* — it does not reliably add facts.

## 11. Can you fine-tune a model to learn your company's data?

Not reliably. The model learns the *style* of your examples, not their content, and will confidently invent similar-looking facts. Use RAG for knowledge.

## 12. How do you choose which model to use?

Match the model to the task: a small fast model for classification and routing, a mid-tier model for summarisation, a frontier model for complex reasoning and agents. Start with a capable model to prove the feature works, then test whether a cheaper one holds quality.

---

## Prompt Engineering

## 13. What makes a good prompt?

It specifies a function: role, task, context, constraints, **exact output format**, and examples if the task is subtle. Anything left ambiguous gets resolved randomly by the model.

## 14. What is few-shot prompting and when does it help most?

Including a few input→output examples so the model infers the pattern. It is the most reliable way to enforce a specific format or a subtle judgement. 3–5 examples is usually enough — and include your **edge cases**.

## 15. What is Chain of Thought prompting?

Instructing the model to reason step by step before answering. The intermediate steps become context for the final answer, which substantially improves accuracy on maths and multi-step logic. Reasoning models do this internally, so explicit CoT adds little there.

## 16. How do you get reliable JSON out of an LLM?

Use the provider's structured output / JSON mode, which constrains generation so invalid JSON is impossible. Specify the schema explicitly, set `temperature: 0`, and **still validate** with zod — schema-valid output can still be semantically wrong.

## 17. What is prompt injection?

User input containing instructions that hijack the model's behaviour — the LLM equivalent of SQL injection. **Indirect** injection is worse: the malicious instruction is hidden in a document or web page the model retrieves.

## 18. How do you defend against prompt injection?

Wrap user content in delimiters and state it is data not instructions, keep rules in the system message, validate output before acting on it, apply least privilege to tools, and require human approval for destructive actions. No defence is complete — the real protection is limiting what the model is allowed to do.

## 19. Why does giving the model an "escape hatch" matter?

Telling it exactly what to say when it cannot answer ("respond INSUFFICIENT_CONTEXT") removes a large share of hallucinations. Without permission to abstain, it invents something rather than producing nothing.

## 20. Why decompose a complex prompt into a chain?

Each step becomes simpler, individually testable and debuggable — when it fails you know *which* step failed. It costs more latency, but reliability improves substantially.

---

## RAG

## 21. What is RAG and what problem does it solve?

Retrieval Augmented Generation: retrieve relevant documents at query time and put them in the prompt. It solves private data, stale training data, hallucination and the lack of citations — without retraining anything.

## 22. Walk me through a RAG pipeline.

**Indexing:** load documents → chunk → embed → store in a vector database. **Query:** embed the question → vector search → rerank → build a grounded prompt → generate with citations.

## 23. How do you decide chunk size?

Start at 500–1000 tokens with 10–15% overlap, then measure. Too small loses context; too large dilutes the embedding and wastes tokens. **Chunking is the single biggest lever on RAG quality.**

## 24. Why do you need overlap between chunks?

So a sentence or idea split across a chunk boundary still appears intact in at least one chunk.

## 25. What is hybrid search and why use it?

Combining semantic (embedding) search with keyword (BM25) search. Semantic matches meaning but fails on exact identifiers like `ERR_4021` or a SKU; keyword catches those. Production systems use both.

## 26. What is reranking?

Retrieving a wide net with fast vector search (say top 50), then re-scoring with a slower, more accurate cross-encoder to keep the best 5. It is one of the highest-return improvements available.

## 27. Your RAG system gives wrong answers. How do you debug it?

**Check retrieval before the prompt.** Log what was actually retrieved. If the correct chunk was never fetched, no prompt change can fix it — the problem is chunking, the embedding model, or the lack of hybrid search. Only if retrieval is correct do you look at the grounding prompt.

## 28. How do you evaluate a RAG system?

Evaluate the two stages **separately**. Retrieval: recall@k (was the right chunk in the top k?), precision@k, MRR. Generation: faithfulness to the context, answer relevance, citation accuracy. Without separating them you cannot tell what is broken.

## 29. How do you handle conversational follow-ups in RAG?

Rewrite the query using the conversation history first. Embedding "what about digital products?" retrieves nothing — rewriting it to "what is the refund policy for digital products?" retrieves correctly.

## 30. Do you always need a vector database?

No. Below roughly 10,000 chunks, an in-memory array with cosine similarity is fast enough. If you already run Postgres, `pgvector` avoids new infrastructure entirely.

## 31. What happens if the user asks something your documents do not cover?

Apply a similarity score threshold. Without one, the search still returns the five "least unrelated" chunks and the model answers from them. Below the threshold, return the abstain message.

---

## Agents and Tools

## 32. What is an AI agent?

An LLM in a loop with tools, deciding its own next action until the goal is met. Unlike a single call, it is multi-step, non-deterministic, and has variable cost.

## 33. How does tool use / function calling actually work?

You send tool definitions with the request. The model returns a **structured request** to call a function — it never executes anything. **Your code** runs it and sends the result back. Every permission boundary lives in your execution layer.

## 34. What makes a good tool definition?

The description is a prompt. State when to use it **and when not to**, what it returns, use `enum` for fixed options, keep names clearly distinct, and keep the toolset under about 15 tools.

## 35. How should tool errors be handled?

Return them **as data**, not as thrown exceptions, so the model can read the error and retry sensibly: `{ error: "...", suggestion: "..." }`.

## 36. What guardrails does an agent need?

A maximum iteration count, a hard cost budget, and a wall-clock timeout. Without them a confused agent can loop until it exhausts your budget.

## 37. When should you NOT build an agent?

When the steps are always the same (write a chain), when it is a single lookup (use RAG), when output must be fully consistent, when latency must be low, or when errors are unacceptable. **If you can draw the flowchart, write the code.**

## 38. Is multi-agent better than single-agent?

Usually not. Every handoff loses context and multiplies cost and failure modes. One agent with well-designed tools beats five agents with vague roles. Multi-agent is justified only for genuinely separate domains.

## 39. What is MCP?

The Model Context Protocol — an open standard for connecting AI applications to tools and data. It turns M applications × N tools of custom integration work into M + N, by having each service expose one MCP server any client can use.

## 40. Which agent actions need human approval?

Reads can be automatic. Anything **irreversible, external-facing or financial** — sending email, deleting records, issuing refunds, publishing content — needs a human, regardless of how confident the model seems.

---

## Production

## 41. Why does chat cost grow so fast?

The whole conversation is re-sent every turn, so token usage grows **quadratically** with conversation length. Turn 50 might send 25,000 input tokens for a one-line question.

## 42. How do you reduce LLM costs?

Route by complexity so a small model handles most traffic, use prompt caching with static content first, cache identical requests, trim or summarise history, cap `max_tokens`, and shorten prompts. Model routing gives the biggest win.

## 43. What is prompt caching and how do you structure prompts for it?

Providers cache the processed form of a long unchanging prefix so it is not reprocessed each call. Put **static content first** (system prompt, few-shot examples) and variable content last to maximise the cacheable prefix.

## 44. Why does streaming matter?

It does not reduce total time, but text starts appearing in ~300ms instead of after 8 seconds. Users tolerate a slow stream far better than a fast blank screen. It is effectively mandatory for chat interfaces.

## 45. What drives LLM latency?

Output length dominates, because tokens are generated sequentially. Then model size, then input length (processed in parallel, so cheaper). Chained calls add up linearly.

## 46. How do you make LLM calls reliable?

Retry with exponential backoff and jitter (but not on 400/401), set timeouts, keep a fallback provider or model, degrade gracefully rather than returning a 500, and validate output against a schema with a retry that feeds the parse error back.

## 47. What is the danger of caching LLM responses?

Serving one user's answer to another. Never share a cache across users for anything containing user-specific data — it is a data leak and an easy mistake to make with semantic caching.

## 48. What are evals and why do they matter?

A test suite for non-deterministic output — 30–50 real cases with expected results, run on every prompt or model change. Without them, prompt engineering is guesswork and you cannot detect regressions. **This is the strongest seniority signal in an AI interview.**

## 49. How do you evaluate output that has no single correct answer?

Deterministic checks where possible (contains required facts, valid schema, correct citations), an LLM-as-judge with explicit criteria for subjective quality, human review of sampled production traffic, and A/B testing against a business metric.

## 50. What guardrails do you put around an LLM feature?

**Input:** length limits, rate limiting, PII redaction, injection detection. **Output:** schema validation, secret-leak checks, citation verification, and business rules enforced in code regardless of what the model said.

## 51. Why is LLM output treated as untrusted input?

Because it can be influenced by anything in the context, including injected instructions. Never pass it unvalidated into SQL, a shell command, `eval`, or a privileged API call.

## 52. When would you run a local model instead of an API?

When data cannot leave your network, for high-volume simple tasks where per-token cost adds up, when you need offline capability, or when prototyping without API costs. The trade-off is lower quality than frontier models and you manage the infrastructure.

## 53. What should you log for every LLM request?

Prompt version, model, full input and output (with PII redacted), token counts, cost, latency, and for agents the full step trace. Without this you cannot debug non-deterministic behaviour.

---

## Automation

## 54. When do you use a workflow tool like n8n versus writing code?

n8n for internal glue, connecting SaaS tools, and prototypes — especially where non-engineers need to read it. Code for core product logic, anything latency-sensitive or customer-facing, and anything needing tests and code review.

## 55. What is idempotency and why does it matter in automation?

An operation is idempotent if running it twice has the same effect as once. Retries and duplicate webhook deliveries are normal, so without idempotency keys or existence checks you double-charge customers and send duplicate emails.

## 56. What commonly breaks in automated workflows?

Rate limits, third-party schema changes, expired credentials, duplicate webhooks, partial failures leaving inconsistent state, silent failures nobody notices, and two workflows triggering each other in a loop.

## 57. How do you secure a webhook trigger?

Verify an HMAC signature or shared secret on every request. A webhook URL is public and callable by anyone who discovers it.

---

## Scenario

## 58. Design a customer support bot over our documentation.

Ingest and chunk the docs with metadata; embed and index; on a query, rewrite it using conversation history, retrieve with hybrid search, rerank, and generate grounded with citations and an abstain path. Add a similarity threshold, escalate to a human when confidence is low or the user asks, log everything, and build an eval set from real support tickets. Measure deflection rate and satisfaction, not model metrics.

## 59. Your LLM feature costs 10× the projection. What do you investigate?

Check token usage per request first — is history growing unbounded? Then: is a frontier model handling requests a small one could? Is prompt caching being defeated by putting variable content first? Are retries silently multiplying calls? Is there any caching at all? Is `max_tokens` capped? Usually it is unbounded history or the wrong model.

## 60. How would you take an AI prototype to production?

Add evals first so you can measure changes. Then: schema validation on output, retries with fallback, streaming, cost and latency tracking per request, rate limiting, PII redaction, prompt versioning in code, full logging, guardrails on input and output, and human approval for irreversible actions. The prototype proves it *can* work; production is making it work reliably and affordably at volume.

---

**Related:** [LLMFundamentals.md](LLMFundamentals.md) · [PromptEngineering.md](PromptEngineering.md) · [RAGPipelines.md](RAGPipelines.md) · [AgentsToolsAndMCP.md](AgentsToolsAndMCP.md) · [LLMInProduction.md](LLMInProduction.md) · [AutomationAndN8N.md](AutomationAndN8N.md) · [FDE-ForwardDeployedEngineer.md](FDE-ForwardDeployedEngineer.md)
