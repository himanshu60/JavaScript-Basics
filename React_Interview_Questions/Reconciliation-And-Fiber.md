# Reconciliation, the Diffing Algorithm and React Fiber

## 1. What is the Virtual DOM?

**Definition:** The Virtual DOM (VDOM) is a lightweight **JavaScript object representation** of the real DOM. React keeps this copy in memory, makes all changes to it first, and then updates only the parts of the real DOM that actually changed.

**Why it exists:** Real DOM operations are slow because each one can trigger the browser to recalculate styles, layout and repaint. Comparing plain JavaScript objects is far cheaper.

```jsx
// This JSX...
<div className="card">
  <h1>Hello</h1>
</div>

// ...becomes this plain JavaScript object (the Virtual DOM)
{
  type: "div",
  props: {
    className: "card",
    children: { type: "h1", props: { children: "Hello" } }
  }
}
```

---

## 2. What is Reconciliation?

**Definition:** Reconciliation is the process React uses to **compare the new Virtual DOM tree with the previous one**, work out the minimum set of changes needed, and apply only those changes to the real DOM.

**The three steps of an update:**

```
1. State changes → React re-runs the component function
2. A NEW Virtual DOM tree is created
3. React DIFFS the new tree against the old one, then updates only what changed
```

---

## 3. The Diffing Algorithm

**Definition:** Diffing is the comparison step of reconciliation. A perfect tree-comparison algorithm would take **O(n³)** time, which is far too slow. React uses a **heuristic O(n)** algorithm based on two assumptions.

### Assumption 1 — Different element types produce different trees

**Definition:** If the element type changes, React does not try to match anything inside. It destroys the entire old subtree (losing all state) and builds a fresh one.

```jsx
// Before
<div><Counter /></div>

// After - type changed from div to span
<span><Counter /></span>

// Result: the div and Counter are DESTROYED, a new span and Counter are created.
// Counter's state is completely lost.
```

```jsx
// Same type → React keeps the node and only updates the changed attribute
<div className="before" title="x" />
<div className="after"  title="x" />
// Only className is updated in the real DOM
```

### Assumption 2 — Keys identify which children are stable

**Definition:** For lists, React uses the `key` prop to match old children with new children. Without keys, it compares by position, which causes unnecessary re-creation.

```
Without keys:              With keys:
[A, B] → [X, A, B]         [A, B] → [X, A, B]
position 0: A→X (update)   key X is new → insert only
position 1: B→A (update)   keys A, B unchanged → reuse
position 2: -- →B (insert)
= 3 operations             = 1 operation
```

---

## 4. Reconciliation rules summary

| Situation | What React does |
|---|---|
| Same element type | Keeps the DOM node, updates only changed props |
| Different element type | Destroys the whole subtree, rebuilds it |
| Same component type | Keeps the instance and its state, updates props |
| Different component type | Unmounts the old one (state lost), mounts the new one |
| List with stable keys | Reuses, moves, inserts and deletes efficiently |
| List without keys | Compares by index — often recreates everything |

**Practical consequence — conditional rendering can destroy state:**

```jsx
// ❌ Input state is lost every time isEditing flips,
//    because the element type changes between input and p
{isEditing ? <input value={text} /> : <p>{text}</p>}

// ✅ Same type → state preserved
<input value={text} readOnly={!isEditing} />
```

```jsx
// ❌ Two separate JSX branches = React sees different positions
{showA ? <div><Form /></div> : <span><Form /></span>}

// ✅ Deliberately force a reset when you WANT it
<Form key={userId} />
```

---

## 5. What is React Fiber?

**Definition:** React Fiber is the **reconciliation engine** introduced in React 16. It rewrote React's internals so that rendering work can be **split into small units, paused, prioritised, resumed and abandoned**.

**The problem Fiber solved:** the old "stack reconciler" processed the whole component tree in one **synchronous, uninterruptible** pass. For a large tree, that blocked the main thread for hundreds of milliseconds — the page froze, animations stuttered and typing lagged.

**In simple words:** Old React was like a person who starts a task and refuses to be interrupted until it is done. Fiber can pause mid-task, handle something urgent, and come back.

---

## 6. What is a Fiber node?

**Definition:** A Fiber is a JavaScript object representing **one unit of work** — usually one component. Fibers form a linked list structure that React can walk through step by step, stopping whenever it wants.

```js
// A simplified Fiber node
{
  type: "div",           // component type
  key: null,
  stateNode: domNode,    // the actual DOM node or class instance
  child: fiber,          // first child
  sibling: fiber,        // next sibling
  return: fiber,         // parent
  pendingProps: {},      // incoming props
  memoizedProps: {},     // props from the last render
  memoizedState: {},     // state / hooks from the last render
  effectTag: "UPDATE",   // what needs to be done
  alternate: fiber,      // the other tree (current vs work-in-progress)
}
```

The `child` / `sibling` / `return` pointers are what allow React to traverse the tree **without recursion**, so it can stop and resume at any point.

---

## 7. The two phases of rendering

**Definition (Render / Reconciliation phase):** React builds the new Fiber tree and works out what changed. This phase is **interruptible** — React can pause it, throw it away, or restart it. Nothing is shown on screen yet, so it must be free of side effects.

**Definition (Commit phase):** React applies all the calculated changes to the real DOM in one go. This phase is **synchronous and cannot be interrupted**, so the user never sees a half-updated UI.

```
RENDER PHASE (interruptible, no side effects allowed)
  - Run component functions
  - Build the work-in-progress Fiber tree
  - Mark which nodes need changes

COMMIT PHASE (synchronous, uninterruptible)
  - Apply DOM changes
  - Run useLayoutEffect
  - Browser paints
  - Run useEffect
```

**This is why render must be pure:** React may run your component function multiple times or discard the result entirely. Side effects during render would run unpredictably.

---

## 8. Double buffering — the two trees

**Definition:** React keeps two Fiber trees at all times:
- **current** — what is on the screen right now.
- **work-in-progress** — the new tree being built.

When the work-in-progress tree is finished, React simply **swaps the pointer** — an instant switch, with no intermediate state ever visible. The `alternate` property links each node to its counterpart, so nodes are reused instead of recreated.

---

## 9. Priority levels (Concurrent React)

**Definition:** Fiber assigns a priority to each update, so urgent work (like typing) can interrupt less urgent work (like rendering a huge filtered list).

| Priority | Examples |
|---|---|
| **Immediate** | Direct user input, clicks, typing |
| **User-blocking** | Hover, scroll, drag |
| **Normal** | Data fetching results, general updates |
| **Low** | Analytics, offscreen content |
| **Idle** | Work that can wait indefinitely |

**How you control it in your code:**

```jsx
// useTransition - marks an update as non-urgent
const [isPending, startTransition] = useTransition();

function handleChange(e) {
  setInput(e.target.value);              // urgent - the input must feel instant
  startTransition(() => {
    setSearchResults(filter(e.target.value));  // non-urgent - can be interrupted
  });
}

// useDeferredValue - lets an expensive render lag behind
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => search(deferredQuery), [deferredQuery]);
```

Without this, typing into a search box that filters 10,000 rows feels laggy. With it, the input stays perfectly responsive while the list catches up.

---

## 10. Features Fiber made possible

| Feature | What it does |
|---|---|
| **Concurrent rendering** | Prepare multiple versions of the UI at once |
| **Time slicing** | Split rendering into ~5ms chunks so the browser stays responsive |
| **Suspense** | Pause rendering while waiting for data or code |
| **Transitions** | Mark updates as low priority |
| **Selective hydration** | Hydrate the parts the user interacts with first |
| **Error boundaries** | Catch errors and recover instead of crashing |
| **Streaming SSR** | Send HTML progressively as it is ready |

---

## 11. What this means for your everyday code

1. **Keep components pure.** No side effects during render — React may run it twice or discard it.
2. **Use stable keys.** They are the entire basis of efficient list diffing.
3. **Do not change element types** unnecessarily, or you silently destroy state.
4. **Use `key` deliberately** when you *want* to reset a component.
5. **Use transitions** for expensive updates triggered by fast user input.
6. **Do not fight the VDOM.** Manual DOM manipulation confuses React's bookkeeping.

---

## Key points

- The **Virtual DOM** is a JS object copy of the UI, cheap to compare.
- **Reconciliation** is comparing the new and old trees and applying minimal changes.
- The **diffing algorithm** is O(n) thanks to two heuristics: different types rebuild, and keys identify children.
- **Fiber** is the engine that makes rendering interruptible and prioritised.
- Rendering has two phases: **render** (interruptible, pure) and **commit** (synchronous).
- React keeps two trees (**current** and **work-in-progress**) and swaps them instantly.
- Fiber is what enables Suspense, transitions, concurrent rendering and streaming SSR.
