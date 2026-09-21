# AI Agents, Tool Use and MCP

## 1. What is an AI Agent?

**Definition:** An agent is an LLM placed in a **loop**, given **tools** it can call, that decides for itself which actions to take to achieve a goal — continuing until the task is done or it gives up.

**The difference from a normal LLM call:**

| | Single call | Agent |
|---|---|---|
| Steps | One request → one response | Many iterations |
| Decides what to do | You do | The model does |
| Can act on the world | No | Yes, via tools |
| Predictable | Yes | No |
| Cost | Fixed | Variable — can spiral |

**In simple words:** a normal call answers a question. An agent is given a goal, works out the steps, uses tools, checks the results and keeps going.

---

## 2. Tool use (function calling)

**Definition:** Tool use is giving the model a set of function descriptions. The model cannot execute anything itself — it returns a **structured request** saying which function to call with which arguments, and **your code** runs it and sends back the result.

**The flow:**

```
1. You send: the user message + available tool definitions
2. Model replies: "call get_weather({ city: 'Delhi' })"
3. YOUR CODE executes that function
4. You send back: the tool's result
5. Model replies: the final natural-language answer
```

> **The critical security point:** the model never runs code. It only *asks*. Every permission boundary is in your execution layer, which is exactly where it should be.

```js
const tools = [
  {
    name: "get_weather",
    description: "Get the current weather for a city. Use when the user asks about weather conditions.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. 'Delhi'" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"], default: "celsius" },
      },
      required: ["city"],
    },
  },
];

// The loop
let messages = [{ role: "user", content: "What's the weather in Delhi?" }];

while (true) {
  const response = await llm.complete({ messages, tools });

  if (response.stop_reason !== "tool_use") {
    return response.content;              // the model is done
  }

  messages.push({ role: "assistant", content: response.content });

  // Execute every tool the model requested
  const results = [];
  for (const call of response.tool_calls) {
    const result = await executeTool(call.name, call.input);   // YOUR code
    results.push({ tool_use_id: call.id, content: JSON.stringify(result) });
  }

  messages.push({ role: "user", content: results });
}
```

---

## 3. Writing good tool definitions

**Definition:** The tool description **is a prompt**. The model chooses tools purely from their names, descriptions and schemas — a vague description causes the wrong tool to be called.

```js
// ❌ Weak - when should this be used? What does it return?
{ name: "search", description: "Searches things" }

// ✅ Strong
{
  name: "search_orders",
  description: `Search a customer's order history by date range or status.
Use when the user asks about past orders, deliveries or order status.
Do NOT use for product catalogue searches — use search_products for that.
Returns up to 20 orders, newest first.`,
  input_schema: {
    type: "object",
    properties: {
      customer_id: { type: "string", description: "The customer's UUID" },
      status: { type: "string", enum: ["pending", "shipped", "delivered", "cancelled"] },
      from_date: { type: "string", description: "ISO 8601 date, e.g. 2026-01-15" },
    },
    required: ["customer_id"],
  },
}
```

**Rules for good tools:**

| Rule | Why |
|---|---|
| Say **when to use it** and when not to | Prevents wrong-tool selection |
| Describe what it **returns** | The model plans better |
| Use `enum` for fixed options | Eliminates invalid arguments |
| Keep the toolset small (under ~15) | Accuracy degrades with too many similar tools |
| Make names clearly distinct | `search_orders` vs `search_products`, not `search1`/`search2` |
| Return **errors as data**, not exceptions | The model can read the error and retry sensibly |

```js
// ✅ Errors the model can actually recover from
async function executeTool(name, input) {
  try {
    return await tools[name](input);
  } catch (err) {
    return { error: err.message, suggestion: "Check the customer_id format" };
  }
}
```

---

## 4. The agent loop

**Definition:** The repeating cycle of **think → act → observe** that continues until the goal is met.

```
┌─────────────────────────────────────┐
│  1. THINK   what should I do next?  │
│  2. ACT     call a tool             │
│  3. OBSERVE read the result         │
│  4. Done? → answer. Not done? → 1   │
└─────────────────────────────────────┘
```

**Definition of ReAct (Reason + Act):** The pattern where the model explicitly states its reasoning before each action, which improves reliability and makes the trace debuggable.

```
Thought: I need the customer's ID before I can search their orders.
Action:  find_customer({ email: "amit@example.com" })
Observation: { customer_id: "c_8823" }

Thought: Now I can search their recent orders.
Action:  search_orders({ customer_id: "c_8823", status: "shipped" })
Observation: [{ order_id: "o_121", ... }]

Thought: I have what I need.
Answer:  You have 1 shipped order, #o_121, arriving Thursday.
```

**Guardrails every production agent needs:**

```js
const MAX_ITERATIONS = 10;      // prevent infinite loops
const MAX_COST_USD = 0.50;      // hard budget per run
const TIMEOUT_MS = 60_000;      // wall-clock limit

let iterations = 0;
while (iterations++ < MAX_ITERATIONS) {
  if (totalCost > MAX_COST_USD) throw new Error("Budget exceeded");
  // ...loop
}
```

Without these, a confused agent can loop until it burns your monthly budget in an afternoon.

---

## 5. Agent architectures

| Pattern | Definition | Use when |
|---|---|---|
| **Chain** | Fixed sequence of LLM calls | The steps are known in advance |
| **Router** | One call classifies, then dispatches to a specialist | Distinct request categories |
| **Single agent + tools** | One agent, one toolset, one loop | **Most cases** |
| **Multi-agent** | Specialised agents coordinated by an orchestrator | Genuinely separate domains |
| **Reflection** | The agent critiques and revises its own output | Quality matters more than latency |
| **Plan and execute** | Plan all steps first, then execute them | Long multi-step tasks |

> **Start with a chain, not an agent.** Agents are non-deterministic, hard to debug and expensive. If the steps are known, hard-code them. Reach for an agent only when the path genuinely depends on intermediate results.

> **Multi-agent is usually premature.** Each handoff loses context and multiplies cost and failure modes. One agent with good tools beats five agents with vague roles.

---

## 6. Memory

**Definition:** LLMs are stateless, so "memory" is entirely your application's job — deciding what to store and what to put back into the context.

| Type | Definition | Implementation |
|---|---|---|
| **Short-term** | The current conversation | The messages array |
| **Summary** | Compressed older turns | Summarise when the history grows long |
| **Long-term** | Facts remembered across sessions | A database, retrieved via RAG |
| **Scratchpad** | Working notes within one task | A file or state object the agent writes to |

```js
// Keep the window manageable: summarise old turns, keep recent ones verbatim
async function manageContext(messages) {
  if (countTokens(messages) < 8000) return messages;

  const old = messages.slice(0, -6);
  const recent = messages.slice(-6);
  const summary = await llm.complete({
    messages: [{ role: "user", content: `Summarise this conversation, keeping
decisions, facts and open questions:\n${format(old)}` }],
  });

  return [{ role: "system", content: `Earlier context: ${summary}` }, ...recent];
}
```

---

## 7. What is MCP?

**Definition:** MCP (Model Context Protocol) is an open standard for connecting AI applications to external tools and data sources. Instead of every application writing custom integrations for every service, a service exposes **one MCP server** that any MCP-compatible client can use.

**The problem it solves:**

```
WITHOUT MCP: M applications × N tools = M×N custom integrations
WITH MCP:    M applications + N servers = M+N
```

**What an MCP server exposes:**

| Primitive | Definition |
|---|---|
| **Tools** | Functions the model can call (actions) |
| **Resources** | Data the client can read (files, records) |
| **Prompts** | Reusable prompt templates the user can invoke |

**Why it matters:** it is the USB-C of AI tooling. Write a GitHub MCP server once and every compatible assistant can use it — no bespoke integration per product.

---

## 8. Agent failure modes

| Failure | Cause | Mitigation |
|---|---|---|
| **Infinite loop** | Repeating a failing action | Iteration cap; detect repeated calls |
| **Wrong tool chosen** | Vague or overlapping descriptions | Sharpen descriptions; reduce tool count |
| **Hallucinated arguments** | Missing information invented | Strict schemas; validate before executing |
| **Lost context** | History trimmed too aggressively | Summarise instead of truncating |
| **Cost explosion** | Long loop, large context each turn | Budget caps; smaller model for simple steps |
| **Destructive action** | Given write access it should not have | Human approval for irreversible operations |
| **Silent failure** | Tool error swallowed | Return errors as readable data |

**The permission principle:**

```js
const TOOL_PERMISSIONS = {
  search_orders:   { auto: true },                       // read - safe
  send_email:      { auto: false, requiresApproval: true },   // external effect
  delete_customer: { auto: false, requiresApproval: true },   // destructive
  process_refund:  { auto: false, requiresApproval: true, maxAmount: 5000 },
};
```

> **Rule:** reads can be automatic. Anything that is **irreversible, external-facing or financial** needs a human in the loop — regardless of how confident the model seems.

---

## 9. Observability

**Definition:** Because agents are non-deterministic, you cannot debug them by reading code. You need a full trace of every step.

```js
// Log every iteration
logger.info({
  runId,
  iteration,
  toolCalled: call.name,
  toolInput: call.input,
  toolOutput: truncate(result),
  tokensUsed: response.usage,
  costSoFar,
  latencyMs,
});
```

**What to track:** full traces, tool-call success rate, average iterations per run, cost per run, latency percentiles, and how often the agent fails to complete the task.

**Tools:** LangSmith, Langfuse, Helicone, Braintrust — or structured logs plus a dashboard, which is often enough to start.

---

## 10. When NOT to build an agent

Be honest about this in an interview — it signals judgement:

| Situation | Better approach |
|---|---|
| The steps are always the same | A hard-coded chain |
| The task is a single lookup | RAG or a direct API call |
| Output must be 100% consistent | Deterministic code |
| Latency must be under ~2 seconds | A single call |
| The task is purely classification | One small, cheap model call |
| Errors are unacceptable | Code with an LLM only for the fuzzy part |

**The rule of thumb:** *if you can write the flowchart, write the code instead.* Use an agent only when the path genuinely cannot be known in advance.

---

## Key points

- An **agent** is an LLM in a loop with tools, deciding its own next action.
- In **tool use**, the model only *requests* a call — **your code executes it**, which is where all permissions live.
- The tool **description is a prompt**: say when to use it, when not to, and what it returns.
- Keep toolsets small and names clearly distinct.
- Return tool errors **as data** so the model can recover.
- Always cap **iterations, cost and wall-clock time**.
- Start with a **chain**; use an agent only when the path is genuinely dynamic. Multi-agent is usually premature.
- Memory is your application's job — summarise rather than truncate.
- **MCP** standardises tool integration, turning M×N custom integrations into M+N.
- Reads can be automatic; irreversible or financial actions need human approval.
