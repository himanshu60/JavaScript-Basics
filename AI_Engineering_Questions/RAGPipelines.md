# RAG — Retrieval Augmented Generation

## 1. What is RAG?

**Definition:** RAG is a technique where, instead of relying on what the model learned during training, you **retrieve relevant documents at query time** and put them into the prompt, so the model answers from real, current, verifiable source material.

**In simple words:** Instead of asking someone to answer from memory, you hand them the relevant pages first and say "answer using only this".

**The problems it solves:**

| Problem | How RAG fixes it |
|---|---|
| The model does not know your private data | Retrieve it from your own documents |
| Training data has a cutoff date | Retrieve current information |
| Hallucination | Ground the answer in real text |
| No citations | Return the source with the answer |
| Retraining is expensive | Just update the index |

---

## 2. The pipeline

```
INDEXING (offline, runs when documents change)
┌──────────┐  ┌───────┐  ┌────────┐  ┌──────────┐  ┌────────────┐
│ Documents│→ │ Load  │→ │ Chunk  │→ │  Embed   │→ │ Vector DB  │
└──────────┘  └───────┘  └────────┘  └──────────┘  └────────────┘

QUERY (online, per request)
┌───────┐  ┌────────┐  ┌──────────┐  ┌────────┐  ┌─────┐  ┌────────┐
│ Query │→ │ Embed  │→ │  Search  │→ │ Rerank │→ │ LLM │→ │ Answer │
└───────┘  └────────┘  └──────────┘  └────────┘  └─────┘  └────────┘
                                                     ↑
                                          retrieved chunks + question
```

---

## 3. Step 1 — Chunking

**Definition:** Splitting documents into smaller pieces, because you cannot embed a 200-page PDF as one vector and you do not want to send the whole thing to the model.

**Why chunk size matters:** too small and a chunk loses the context needed to make sense; too large and it contains mostly irrelevant text, diluting the embedding and wasting tokens.

| Strategy | Definition | Best for |
|---|---|---|
| **Fixed size** | Every N characters, with overlap | Simple baseline |
| **Recursive** | Split on paragraph → sentence → word until it fits | **Default choice** |
| **Semantic** | Split where the topic changes | Highest quality, slowest |
| **Document-aware** | Split on markdown headings, code functions | Structured content |
| **Sentence window** | Embed one sentence, retrieve its neighbours | Precise retrieval |

```js
// Recursive character splitting - try the biggest separator first
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const separators = ["\n\n", "\n", ". ", " "];   // paragraph → line → sentence → word
  // ...split on the largest separator that keeps chunks under chunkSize
}
```

**Definition of Overlap:** Repeating the last ~10–20% of one chunk at the start of the next, so a sentence split across a boundary still appears intact somewhere.

**Starting point:** 500–1000 tokens per chunk with 10–15% overlap. Then **measure** — chunking strategy is the single biggest lever on RAG quality.

**Always attach metadata:**

```js
{
  text: "The refund window is 30 days from delivery...",
  metadata: {
    source: "policy/refunds.pdf",
    page: 4,
    section: "Returns",
    updated_at: "2026-01-15",
    doc_id: "policy-refunds-v3",
  },
}
```
Metadata enables filtering, citations, and removing stale documents later.

---

## 4. Step 2 — Embedding

**Definition:** Converting each chunk into a vector that represents its meaning, so semantically similar text can be found by vector similarity.

```js
const response = await embeddings.create({
  model: "text-embedding-model",
  input: chunk.text,
});
// → [0.021, -0.45, 0.88, ...]  typically 768–3072 dimensions
```

**Rules:**
- Use the **same model** for indexing and querying — vectors from different models are not comparable
- Changing the embedding model means **re-indexing everything**
- Batch your embedding calls; it is far cheaper and faster than one at a time
- Larger dimensions are slightly more accurate but cost more to store and search

---

## 5. Step 3 — Vector database

**Definition:** A database that stores vectors and finds the nearest ones to a query vector quickly, using an approximate nearest neighbour (ANN) index rather than comparing against every vector.

| Option | Notes |
|---|---|
| **pgvector** (Postgres) | Use your existing database — no new infrastructure. Best default |
| **Qdrant / Weaviate** | Purpose-built, strong filtering, self-hostable |
| **Pinecone** | Fully managed, scales easily, costs more |
| **Chroma** | Great for local development and prototypes |
| **MongoDB Atlas Vector Search** | If you already run Atlas |
| **In-memory array** | Perfectly fine under ~10,000 chunks |

```sql
-- pgvector: vectors alongside your normal relational data
CREATE EXTENSION vector;

CREATE TABLE documents (
  id         SERIAL PRIMARY KEY,
  content    TEXT,
  metadata   JSONB,
  embedding  VECTOR(1536)
);

CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Nearest neighbours, with metadata filtering
SELECT content, metadata, 1 - (embedding <=> $1) AS similarity
FROM documents
WHERE metadata->>'department' = 'engineering'
ORDER BY embedding <=> $1          -- <=> is cosine distance
LIMIT 5;
```

> **Start simple.** Below ~10k chunks you do not need a vector database at all — an array plus cosine similarity in memory is fast enough. Do not add infrastructure you cannot justify.

---

## 6. Step 4 — Retrieval

**Definition of Semantic Search:** Finding chunks whose embedding is closest to the query embedding — matches meaning, not keywords.

**Definition of Keyword Search (BM25):** Traditional term matching — matches exact words, which semantic search can miss.

**Definition of Hybrid Search:** Combining both and merging the rankings. This is what production systems use, because each covers the other's weakness.

```
Query: "How do I reset my password?"

Semantic finds:  "Account recovery procedure" ✅  (no shared words)
Keyword finds:   "password reset token expiry" ✅  (exact term match)

Hybrid finds both.
```

**Where pure semantic search fails:** exact identifiers. Searching for error code `ERR_4021` or a product SKU needs keyword matching — the embedding of a code is meaningless.

**Definition of Reranking:** Retrieving a wide net (say top 50) with fast vector search, then using a slower, more accurate **cross-encoder** model to re-score and keep the best 5. This is one of the highest-return improvements you can make.

```
Vector search (fast, approximate) → top 50
Reranker (slow, accurate)         → top 5
LLM                               → answer
```

---

## 7. Step 5 — Generation

**Definition:** Assembling the retrieved chunks into a prompt with strict grounding instructions.

```js
const prompt = `Answer the question using ONLY the context below.

Rules:
- If the context does not contain the answer, reply exactly: "I don't have
  that information in my sources."
- Cite the source for each claim using [Source N]
- Do not use any outside knowledge
- Quote directly where possible

Context:
${chunks.map((c, i) => `[Source ${i + 1}] (${c.metadata.source} p.${c.metadata.page})
${c.text}`).join("\n\n")}

Question: ${question}`;
```

**The three instructions that matter most:**
1. "ONLY the context" — blocks training-data answers
2. The explicit abstain phrase — removes most hallucination
3. Citation requirement — makes answers verifiable and builds user trust

---

## 8. Why RAG systems fail

| Failure | Cause | Fix |
|---|---|---|
| **Retrieves nothing relevant** | Chunks too large/small; wrong embedding model | Tune chunking; try hybrid search |
| **Right document, wrong chunk** | Boundary split the answer in half | Increase overlap; sentence-window retrieval |
| **Correct chunk retrieved, wrong answer** | Prompt not strict enough; buried in the middle | Tighten grounding; rerank; send fewer chunks |
| **Exact IDs never found** | Semantic search cannot match codes | Add keyword/hybrid search |
| **Stale answers** | Index not refreshed | Re-index on document change; filter by date |
| **Contradictory sources** | Multiple document versions indexed | Version metadata; prefer the newest |
| **Too slow** | Too many chunks, reranking everything | Retrieve fewer; cache; stream the response |

> **The most common mistake:** debugging the *prompt* when the problem is *retrieval*. Always log what was retrieved first. If the right chunk was never fetched, no prompt can save it.

---

## 9. Evaluating a RAG system

**Definition:** RAG has two independently measurable stages. Evaluate them separately, or you cannot tell what is broken.

**Retrieval metrics:**
- **Recall@k** — was the correct chunk in the top k? (the single most important number)
- **Precision@k** — how much of what was retrieved was actually relevant?
- **MRR** — how highly was the correct chunk ranked?

**Generation metrics:**
- **Faithfulness** — is every claim supported by the retrieved context?
- **Answer relevance** — does it actually address the question?
- **Citation accuracy** — do the cited sources really say that?

```js
// A minimal eval set - 30-50 real questions is enough to catch regressions
const evalSet = [
  {
    question: "What is the refund window?",
    expectedChunkIds: ["policy-refunds-v3#4"],
    expectedAnswer: "30 days from delivery",
  },
];

// Measure retrieval separately from generation
const recall = evalSet.filter((c) =>
  retrieve(c.question).some((r) => c.expectedChunkIds.includes(r.id))
).length / evalSet.length;
```

**Tools:** RAGAS, TruLens, DeepEval, LangSmith, or a simple hand-rolled script — which is often enough.

---

## 10. Advanced patterns

| Pattern | Definition | When to use |
|---|---|---|
| **Query rewriting** | An LLM rewrites a vague query into a better search query | Conversational follow-ups ("what about that one?") |
| **HyDE** | Generate a hypothetical answer, embed **that**, and search with it | Short or vague queries |
| **Multi-query** | Generate several phrasings, retrieve for each, merge | Improves recall |
| **Parent document retrieval** | Search small chunks, return the larger parent | Precision plus context |
| **Contextual retrieval** | Prepend a chunk's document context before embedding | Large gain for chunks lacking context |
| **Agentic RAG** | The model decides *whether* and *what* to retrieve | Mixed general/specific questions |
| **Graph RAG** | Build a knowledge graph of entities and relationships | "How are X and Y connected?" questions |

**Handling conversational follow-ups** — a common production bug:

```
User: "What is the refund policy?"
Bot:  "30 days from delivery."
User: "What about for digital products?"    ← embedding "What about for
                                               digital products?" retrieves nothing

Fix: rewrite it using history first
→ "What is the refund policy for digital products?"
```

---

## 11. A minimal working implementation

```js
// ---------- Indexing (offline) ----------
async function indexDocuments(docs) {
  for (const doc of docs) {
    const chunks = chunkText(doc.content, 800, 100);

    // Batch the embedding calls
    const vectors = await embed(chunks.map((c) => c.text));

    await db.insertMany(chunks.map((chunk, i) => ({
      text: chunk.text,
      embedding: vectors[i],
      metadata: { source: doc.source, page: chunk.page, updatedAt: doc.updatedAt },
    })));
  }
}

// ---------- Query (online) ----------
async function answer(question, history = []) {
  // 1. Rewrite the query if this is a follow-up
  const searchQuery = history.length
    ? await rewriteQuery(question, history)
    : question;

  // 2. Retrieve widely
  const queryVector = await embed([searchQuery]);
  const candidates = await db.vectorSearch(queryVector[0], { limit: 30 });

  // 3. Rerank and keep the best few
  const topChunks = await rerank(searchQuery, candidates, { topK: 5 });

  // 4. Guard against retrieving nothing useful
  if (!topChunks.length || topChunks[0].score < MIN_SCORE) {
    return { answer: "I don't have that information in my sources.", sources: [] };
  }

  // 5. Generate, grounded
  const response = await llm.complete({
    system: GROUNDED_SYSTEM_PROMPT,
    user: buildPrompt(topChunks, question),
    temperature: 0,
  });

  return { answer: response, sources: topChunks.map((c) => c.metadata) };
}
```

Note step 4 — a **score threshold**. Without it, an unrelated question still retrieves the five "least unrelated" chunks and the model answers from them.

---

## Key points

- RAG retrieves real documents at query time instead of relying on training data.
- The pipeline is **chunk → embed → store → retrieve → rerank → generate**.
- **Chunking is the biggest quality lever** — start at 500–1000 tokens with 10–15% overlap.
- Use the **same embedding model** for indexing and querying; changing it means re-indexing.
- **Hybrid search** (semantic + keyword) beats either alone, especially for codes and IDs.
- **Reranking** is one of the highest-return improvements available.
- Ground the prompt strictly and always give an **abstain option**.
- **Debug retrieval before the prompt** — log what was actually fetched.
- Evaluate retrieval (recall@k) and generation (faithfulness) **separately**.
- Start simple: no vector database is needed below ~10k chunks.
