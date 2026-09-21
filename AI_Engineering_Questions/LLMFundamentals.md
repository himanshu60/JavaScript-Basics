# LLM Fundamentals

## 1. What is an LLM?

**Definition:** A Large Language Model is a neural network trained on very large amounts of text to predict the **next token** in a sequence. Everything it does — answering, summarising, writing code — is that one operation repeated.

**In simple words:** It is an extremely sophisticated autocomplete. It has no database of facts it looks things up in; it produces the most statistically plausible continuation based on patterns learned during training.

**Why that matters practically:** the model does not "know" things, it predicts them. This single fact explains hallucination, why it cannot tell you what it does not know, and why grounding it with real data (RAG) works so well.

---

## 2. Tokens

**Definition:** A token is the unit an LLM actually processes — roughly a word piece. Common English words are usually one token; rarer words, code and other languages split into several.

```
"Hello world"          → 2 tokens
"Understanding"        → 2 tokens  ("Under" + "standing")
"नमस्ते"                → several tokens (non-Latin scripts cost more)
{"key": "value"}       → ~7 tokens (JSON punctuation costs tokens)
```

**Rules of thumb (English):** ~4 characters per token, ~0.75 words per token. 1,000 tokens ≈ 750 words.

**Why it matters:** you are billed per token, limits are measured in tokens, and latency scales with tokens generated. Verbose prompts and verbose output both cost money.

---

## 3. Context window

**Definition:** The maximum number of tokens the model can process at once — the prompt **plus** the generated response. It is the model's entire working memory for a request.

**Critical point:** LLMs are **stateless**. They do not remember previous messages. A chat application works by re-sending the whole conversation on every request. That is why long conversations get slower and more expensive, and why they eventually need trimming or summarising.

```js
// Every API call sends the entire history again
messages: [
  { role: "system",    content: "You are a helpful assistant" },
  { role: "user",      content: "What is React?" },
  { role: "assistant", content: "React is a JavaScript library..." },
  { role: "user",      content: "How does it differ from Vue?" },   // the new message
]
```

**Definition of "lost in the middle":** Models attend most reliably to the **beginning** and **end** of a long context. Information buried in the middle of a 100k-token prompt is more likely to be missed. Put instructions at the start and the most important data near the end.

> A large context window is not a substitute for retrieval. Stuffing 200k tokens into every request is slow, expensive, and often less accurate than retrieving the right 2k tokens.

---

## 4. Generation parameters

| Parameter | Definition | Typical use |
|---|---|---|
| **temperature** | Randomness, usually 0–2. Low = deterministic and repetitive, high = creative and erratic | `0` for extraction/classification, `0.7` for writing |
| **top_p** (nucleus sampling) | Considers only the smallest set of tokens whose probabilities sum to `p` | Alternative to temperature — tune one, not both |
| **max_tokens** | Cap on the **output** length | Controls cost and prevents runaway generation |
| **stop sequences** | Strings that halt generation immediately | Ending at a delimiter |
| **frequency_penalty** | Reduces the chance of repeating tokens already used | Avoiding repetitive text |
| **presence_penalty** | Pushes the model toward new topics | Encouraging variety |
| **seed** | Makes sampling reproducible (best effort) | Testing and debugging |

```js
// Structured extraction - you want the same answer every time
{ temperature: 0, max_tokens: 500 }

// Creative writing
{ temperature: 0.8, presence_penalty: 0.6 }
```

> **Temperature 0 is not fully deterministic.** Floating-point non-determinism in GPU batching means identical inputs can still produce slightly different outputs.

---

## 5. Message roles

| Role | Definition |
|---|---|
| **system** | Instructions defining behaviour, persona and rules. Highest priority, applies to the whole conversation |
| **user** | Input from the person |
| **assistant** | The model's previous replies (part of the history you send back) |
| **tool** / **function** | The result returned from a tool the model asked to call |

```js
const messages = [
  { role: "system", content: "You are a SQL expert. Return only SQL, no explanation." },
  { role: "user",   content: "Find users who ordered more than 5 times" },
];
```

**Practical rule:** put durable rules and output format in the **system** message, and the specific task in the **user** message.

---

## 6. Hallucination

**Definition:** When a model generates content that is fluent, confident and **factually wrong** — invented citations, non-existent API methods, made-up statistics.

**Why it happens:** the model optimises for plausibility, not truth. "I don't know" is rarely the most statistically likely continuation, so it produces something that *looks* right instead.

**How to reduce it:**

| Technique | How it helps |
|---|---|
| **RAG** | Ground answers in retrieved real documents |
| Explicit permission to abstain | "If the context does not contain the answer, say you don't know" |
| Require citations | "Quote the source sentence for each claim" |
| Lower temperature | Less creative drift |
| Structured output | Constrains the shape of the response |
| Verification pass | A second call checks the first against the source |

> You cannot eliminate hallucination — only reduce it and design around it. Anything high-stakes needs a human check or a deterministic validation step.

---

## 7. Embeddings

**Definition:** An embedding is a list of numbers (a vector) representing the **meaning** of a piece of text. Texts with similar meaning have vectors that point in similar directions, even with no words in common.

```js
"dog"    → [0.21, -0.45, 0.88, ...]      // typically 768–3072 dimensions
"puppy"  → [0.23, -0.41, 0.85, ...]      // very close to "dog"
"laptop" → [-0.67, 0.12, -0.33, ...]     // far away
```

**Definition of Cosine Similarity:** A measure of the angle between two vectors, from -1 to 1. It is how "relatedness" is calculated. 1 means identical direction, 0 means unrelated.

```js
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (magA * magB);
}
```

**What embeddings are used for:** semantic search, RAG retrieval, clustering, recommendations, deduplication, classification.

**Key difference from keyword search:** searching "how do I reset my password" matches a document titled "Account recovery steps" — because the *meaning* is close, even though no words overlap.

---

## 8. Model choice

**Definition:** Models trade capability against cost and latency. Using the largest model for everything is the most common and most expensive beginner mistake.

| Task | Sensible choice |
|---|---|
| Classification, routing, extraction | A small, fast model |
| Summarisation, straightforward Q&A | A mid-tier model |
| Complex reasoning, code generation, agents | A frontier model |
| High-volume, cost-sensitive, simple | Small model, or fine-tune one |
| Privacy-critical / offline | A local model via Ollama |

**Definition of a Reasoning Model:** A model trained to produce internal reasoning before answering. Much better at maths, logic and multi-step planning, but slower and more expensive — overkill for simple extraction.

**The practical approach:** start with a capable model to prove the feature works, then try downgrading to a cheaper one and measure whether quality actually drops. Often it does not.

---

## 9. Fine-tuning vs RAG vs prompting

**Definition of Prompting:** Changing the instructions you send. No training involved.
**Definition of RAG:** Retrieving relevant documents at query time and putting them in the prompt.
**Definition of Fine-tuning:** Further training the model's weights on your own examples.

| | Prompting | RAG | Fine-tuning |
|---|---|---|---|
| **Teaches** | Behaviour | **Knowledge** | **Style / format / behaviour** |
| Setup cost | Minutes | Days | Weeks + training cost |
| Update speed | Instant | Instant (re-index) | Retrain |
| Good for facts | ❌ | ✅ **Yes** | ❌ Not reliable |
| Good for consistent format | Partly | ❌ | ✅ **Yes** |
| Reduces hallucination | Slightly | ✅ Significantly | ❌ Can worsen it |

**The decision rule:**
- Need the model to **know your data** → **RAG**
- Need it to **behave or format consistently** → fine-tuning (after prompting fails)
- Anything else → **better prompting first**

> Fine-tuning is not a way to add facts. The model learns the *style* of your examples, not their content, and will confidently invent similar-looking facts.

---

## 10. Common terminology

| Term | Definition |
|---|---|
| **Zero-shot** | Asking with no examples |
| **Few-shot** | Providing a handful of examples in the prompt |
| **Chain of Thought (CoT)** | Prompting the model to reason step by step before answering |
| **Grounding** | Constraining answers to supplied source material |
| **Inference** | Running the model to produce output (as opposed to training) |
| **Prompt injection** | User input that hijacks the model's instructions |
| **Guardrails** | Checks on input and output that block unsafe or invalid results |
| **Eval** | A test suite measuring output quality |
| **Latency (TTFT)** | Time To First Token — what the user perceives as responsiveness |
| **Quantisation** | Compressing model weights to run on smaller hardware |
| **Distillation** | Training a small model to imitate a large one |
| **Context stuffing** | Dumping everything into the prompt instead of retrieving selectively |
| **Multimodal** | Handling images, audio or video as well as text |

---

## Key points

- An LLM predicts the next **token** — it does not look up facts. This explains hallucination.
- **Tokens** drive cost, limits and latency; ~4 characters per token in English.
- The **context window** holds prompt + response; models are **stateless**, so history is re-sent each time.
- `temperature: 0` for extraction and classification, higher for creative work.
- **Hallucination** can be reduced (RAG, citations, permission to abstain) but never eliminated.
- **Embeddings** turn meaning into vectors; cosine similarity measures relatedness.
- **RAG adds knowledge, fine-tuning shapes behaviour, prompting is always the first thing to try.**
- Match model size to task — do not use a frontier model for classification.
