# AI Engineering Interview Questions

LLMs, RAG, agents, production concerns, automation, and the Forward Deployed Engineer role.

📄 **[AIImpQue.md](AIImpQue.md)** — all 60 questions with answers in one file.

---

## Topic files

| Topic | File | Covers |
|---|---|---|
| **LLM Fundamentals** | [LLMFundamentals.md](LLMFundamentals.md) | Tokens, context window, parameters, hallucination, embeddings, RAG vs fine-tuning vs prompting |
| **Prompt Engineering** | [PromptEngineering.md](PromptEngineering.md) | Few-shot, CoT, structured output, injection defence, prompt versioning, debugging checklist |
| **RAG Pipelines** | [RAGPipelines.md](RAGPipelines.md) | Chunking, embeddings, vector DBs, hybrid search, reranking, failure modes, evaluation |
| **Agents, Tools & MCP** | [AgentsToolsAndMCP.md](AgentsToolsAndMCP.md) | Function calling, the agent loop, tool design, architectures, MCP, when NOT to build an agent |
| **LLMs in Production** | [LLMInProduction.md](LLMInProduction.md) | Cost, latency, streaming, caching, reliability, guardrails, evals, local models |
| **Automation & n8n** | [AutomationAndN8N.md](AutomationAndN8N.md) | Workflow concepts, the item model, AI pipelines, error handling, idempotency |
| **FDE (Forward Deployed Engineer)** | [FDE-ForwardDeployedEngineer.md](FDE-ForwardDeployedEngineer.md) | What the role is, skills, mindset, interview questions, mapping a full-stack background |

---

## All 60 questions ([AIImpQue.md](AIImpQue.md))

**LLM Fundamentals (1–12)**
1. What is an LLM and how does it work?
2. What is a token?
3. What is a context window?
4. If LLMs are stateless, how does a chatbot remember?
5. What is temperature?
6. Is temperature 0 fully deterministic?
7. What is hallucination and how do you reduce it?
8. What are embeddings?
9. What is "lost in the middle"?
10. RAG vs fine-tuning vs prompting — when do you use each?
11. Can you fine-tune a model to learn your company's data?
12. How do you choose which model to use?

**Prompt Engineering (13–20)**
13. What makes a good prompt?
14. What is few-shot prompting and when does it help most?
15. What is Chain of Thought prompting?
16. How do you get reliable JSON out of an LLM?
17. What is prompt injection?
18. How do you defend against prompt injection?
19. Why does giving the model an "escape hatch" matter?
20. Why decompose a complex prompt into a chain?

**RAG (21–31)**
21. What is RAG and what problem does it solve?
22. Walk me through a RAG pipeline.
23. How do you decide chunk size?
24. Why do you need overlap between chunks?
25. What is hybrid search and why use it?
26. What is reranking?
27. Your RAG system gives wrong answers. How do you debug it?
28. How do you evaluate a RAG system?
29. How do you handle conversational follow-ups in RAG?
30. Do you always need a vector database?
31. What happens if the user asks something your documents do not cover?

**Agents and Tools (32–40)**
32. What is an AI agent?
33. How does tool use / function calling actually work?
34. What makes a good tool definition?
35. How should tool errors be handled?
36. What guardrails does an agent need?
37. When should you NOT build an agent?
38. Is multi-agent better than single-agent?
39. What is MCP?
40. Which agent actions need human approval?

**Production (41–53)**
41. Why does chat cost grow so fast?
42. How do you reduce LLM costs?
43. What is prompt caching and how do you structure prompts for it?
44. Why does streaming matter?
45. What drives LLM latency?
46. How do you make LLM calls reliable?
47. What is the danger of caching LLM responses?
48. What are evals and why do they matter?
49. How do you evaluate output that has no single correct answer?
50. What guardrails do you put around an LLM feature?
51. Why is LLM output treated as untrusted input?
52. When would you run a local model instead of an API?
53. What should you log for every LLM request?

**Automation (54–57)**
54. When do you use a workflow tool like n8n versus writing code?
55. What is idempotency and why does it matter in automation?
56. What commonly breaks in automated workflows?
57. How do you secure a webhook trigger?

**Scenario (58–60)**
58. Design a customer support bot over our documentation.
59. Your LLM feature costs 10× the projection. What do you investigate?
60. How would you take an AI prototype to production?

---

## The answers that signal seniority

Most candidates can define RAG. These are what actually separate people:

| Topic | The senior answer |
|---|---|
| **Debugging RAG** | Check **retrieval first**, not the prompt. Log what was fetched. |
| **Evals** | "We built an eval set so prompt changes stopped being guesswork." |
| **Agents** | Knowing **when not to build one** — if you can draw the flowchart, write code. |
| **Cost** | Model routing and prompt caching, not just "use a cheaper model". |
| **Fine-tuning** | Understanding it teaches *style*, not *facts*. |
| **Security** | Treating LLM output as untrusted input. |
| **Multi-agent** | Recognising it is usually premature complexity. |
| **Human-in-the-loop** | Knowing which actions must never be automatic. |

---

**Related:** [Node.js & Backend](../Node_Backend_Questions/) for API design · [CI/CD](../CICD_DevOps_Questions/) for deploying AI services · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
