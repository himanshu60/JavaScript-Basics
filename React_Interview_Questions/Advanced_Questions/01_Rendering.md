# Advanced React Questions — Part 1: Rendering & Reconciliation (1–10)

[Back to the list](README.md) · [Part 2: Advanced Hooks →](02_Hooks.md)

---

## 1. How does React Fiber work?

**Short answer:** Fiber is React's internal engine (since React 16). It does the work of figuring out what changed in your UI. Every component becomes a **fiber** — a small JavaScript object that is one **unit of work**. Because the work is split into small units, React can **pause** it, **continue** later, give urgent updates **priority**, or **throw away** work that is no longer needed.

**In simple words:** The old engine (the "stack reconciler") was like reading a whole book in one sitting — once it started, it could not stop, even if someone called you. Fiber is like reading with a **bookmark**: React reads a few pages, checks if something more important came up (like the user typing), handles it, then comes back to the bookmark.

**What a fiber looks like (simplified):**

```js
const fiber = {
  type: Counter,           // the component function, or "div" for DOM elements
  key: null,
  props: { start: 0 },
  stateNode: null,         // the real DOM node (for DOM elements)
  memoizedState: {...},    // this component's hooks (useState, useEffect...)

  child: firstChildFiber,  // first child
  sibling: nextFiber,      // next brother/sister
  return: parentFiber,     // parent

  flags: "Update",         // what DOM work is needed: Placement, Update, Deletion
  lanes: "...",            // priority of this work
  alternate: oldFiber,     // the same fiber from the previous render
};
```

**The tree is a linked list.** React walks it one fiber at a time using `child`, `sibling` and `return`. It does not use deep recursion, so it can stop at any fiber and continue later.

```
        App
         │ child
         ▼
       Header ──sibling──► Main ──sibling──► Footer
                            │ child
                            ▼
                          List
```

**Two trees (double buffering):**

- **Current tree** — what is on the screen right now.
- **Work-in-progress tree** — the new version React is building in the background.

When the new tree is ready, React swaps them in one step. The user never sees a half-finished UI.

**What Fiber made possible:**

| Feature | Why it needs Fiber |
|---|---|
| Priorities (typing is more urgent than a big list) | Each fiber has a priority (`lanes`) |
| `useTransition`, `useDeferredValue` (Q9) | React can pause low-priority work |
| Suspense (Q46) | React can stop at a fiber that is waiting for data |
| Concurrent rendering (Q10) | Work can be interrupted and restarted |

> 💡 **Tip:** You never use Fiber directly. In an interview, say: "Fiber breaks rendering into small units of work so React can pause, prioritize and resume it. This is the base for all concurrent features."

Deep dive: [Reconciliation-And-Fiber.md](../Reconciliation-And-Fiber.md)

---

## 2. What triggers a component re-render?

**Short answer:** A component re-renders in these cases:

1. **Its state changes** — `setState` with a different value.
2. **Its parent re-renders** — by default, all children re-render too, even with the same props.
3. **A context it reads changes** — any component that calls `useContext(SomeContext)`.
4. **A hook it uses changes its state** — the state of a custom hook belongs to the component.

**Things that do NOT trigger a re-render:**

| Change | Re-render? | Why |
|---|---|---|
| `ref.current = 5` | ❌ No | Refs are not tracked by React |
| A normal variable (`let x = 1; x++`) | ❌ No | React doesn't know about it, and it resets on every render anyway |
| `setState` with the **same value** | ❌ No | React compares with `Object.is` and skips |
| Mutating an object in state (`user.name = "A"`) | ❌ No | Same reference, so React thinks nothing changed |
| Changing the `key` | ⚠️ Remount | Not a re-render: the old component is destroyed and a new one is created, so state resets |

**Example — see who renders:**

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  console.log("Parent rendered");

  return (
    <>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <Child />          {/* re-renders on every click */}
      <MemoChild />      {/* does NOT re-render — props did not change */}
    </>
  );
}

function Child() {
  console.log("Child rendered");
  return <p>I am a child</p>;
}

const MemoChild = React.memo(function MemoChild() {
  console.log("MemoChild rendered");
  return <p>I am memoized</p>;
});
```

Clicking the button logs:

```
Parent rendered
Child rendered
```

**Common trap:** "A component re-renders when its props change." This is only half true. Props can only change because the **parent re-rendered** — and when the parent re-renders, the child re-renders anyway (unless it uses `React.memo`).

> 💡 **Tip:** "Re-render" means React calls your function again. It does **not** mean the DOM is updated. React only touches the DOM where the output actually changed.

Basics: [Most asked Q21](../Most_Asked_Questions/03_Advanced.md#21-when-does-a-react-component-re-render)

---

## 3. How does reconciliation work internally?

**Short answer:** Reconciliation is how React compares the **new** UI tree with the **old** one to find the **smallest set of DOM changes**. A perfect comparison of two trees is very slow (O(n³)), so React uses two simple rules to do it in **O(n)**:

1. **Different element type → replace the whole subtree.** If `<div>` becomes `<section>`, or `<Profile>` becomes `<Settings>`, React destroys the old part (including all state) and builds a new one.
2. **Keys identify items in a list.** React uses `key` to know which item is which between renders (Q5).

**What React does in each case:**

| Old | New | What React does |
|---|---|---|
| `<div className="a">` | `<div className="b">` | Same type → keeps the DOM node, only updates `className` |
| `<Counter count={1} />` | `<Counter count={2} />` | Same component → keeps its state, re-renders with new props |
| `<div>` | `<span>` | Different type → removes the `<div>` and everything inside, creates a `<span>` |
| `<Counter />` | `<Timer />` | Different component → unmounts `Counter` (state lost), mounts `Timer` |

**The steps inside React:**

```
1. Render phase
   beginWork    → go DOWN the tree: call each component, compare its children
   completeWork → go back UP: prepare DOM nodes, collect changes
   Each changed fiber gets a flag: Placement (add), Update, Deletion

2. Commit phase
   Apply all flagged changes to the real DOM in one go
```

**Example 1 — state lost because the parent type changed:**

```jsx
function App({ isAdmin }) {
  return isAdmin ? (
    <div>
      <Counter />
    </div>
  ) : (
    <section>
      <Counter />
    </section>
  );
}
```

When `isAdmin` changes, `<div>` becomes `<section>`. React throws away the whole subtree, so `Counter` **loses its count**.

**Example 2 — the classic bug: a component defined inside a component:**

```jsx
// ❌ Bad
function Form() {
  const [text, setText] = useState("");

  // A NEW function is created on every render, so React sees a NEW component type
  function Input() {
    return <input value={text} onChange={(e) => setText(e.target.value)} />;
  }

  return <Input />;
}
```

On every key press, `Input` is a new type, so React **unmounts and remounts** the input. The input **loses focus** after each letter.

```jsx
// ✅ Good — define components at the top level of the file
function Input({ value, onChange }) {
  return <input value={value} onChange={onChange} />;
}

function Form() {
  const [text, setText] = useState("");
  return <Input value={text} onChange={(e) => setText(e.target.value)} />;
}
```

> 💡 **Tip:** Say the two rules (type and key). Then give the "component inside a component" example. It shows you understand reconciliation in practice.

Deep dive: [Reconciliation-And-Fiber.md](../Reconciliation-And-Fiber.md) · [VirtualDOM.md](../VirtualDOM.md)

---

## 4. What is the difference between render and commit phases?

**Short answer:** React updates the screen in two phases:

- **Render phase** — React **calls your components** and works out *what* should change. It does **not** touch the DOM. It can be paused, restarted or thrown away.
- **Commit phase** — React **applies the changes to the real DOM**, then runs layout effects and refs. It is fast, synchronous and **cannot be interrupted**.

```
 setState()
    │
    ▼
┌─────────────── RENDER PHASE ───────────────┐
│ Call components → build new tree → diff    │   pure, no DOM changes
│ (can pause, restart, run twice in Strict)  │
└────────────────────────────────────────────┘
    │
    ▼
┌─────────────── COMMIT PHASE ───────────────┐
│ 1. Update the real DOM                     │
│ 2. Attach refs                             │   synchronous, can't stop
│ 3. Run useLayoutEffect                     │
└────────────────────────────────────────────┘
    │
    ▼
 Browser paints the screen
    │
    ▼
 useEffect runs
```

| | Render phase | Commit phase |
|---|---|---|
| What happens | Components are called, trees compared | Real DOM is changed |
| Touches the DOM | ❌ No | ✅ Yes |
| Can be interrupted | ✅ Yes (concurrent mode) | ❌ No |
| Can run more than once | ✅ Yes (Strict Mode calls it twice in development) | ❌ No |
| Your code that runs here | The component body | `useLayoutEffect`, ref callbacks; then `useEffect` after paint |
| Must be pure | ✅ Yes | Side effects are fine |

**Why the render phase must be pure:** React may call your component and then throw the result away. Any side effect in the body could run many times.

```jsx
// ❌ Bad — side effect in the render phase
function Product({ id }) {
  analytics.track("product_view", id); // may run 2+ times per real view
  return <ProductCard id={id} />;
}

// ✅ Good — side effects go in useEffect (commit phase)
function Product({ id }) {
  useEffect(() => {
    analytics.track("product_view", id);
  }, [id]);

  return <ProductCard id={id} />;
}
```

> 💡 **Tip:** "Rendering" in React does **not** mean painting the screen. Render = calling your functions. Commit = changing the DOM. Paint = the browser drawing pixels.

Deep dive: [Reconciliation-And-Fiber.md](../Reconciliation-And-Fiber.md)

---

## 5. How do keys affect reconciliation?

**Short answer:** In a list, React uses `key` to match each new item with its old item:

- **Same key** → keep the component and its state (move it if needed).
- **New key** → create a new component.
- **Key gone** → remove that component.

Without good keys, React matches items **by position**. Then state (input text, checkbox, focus) can stay with the **wrong item**.

**Example — the index-as-key bug:**

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Learn React" },
    { id: 2, text: "Learn Redux" },
  ]);

  function addToTop() {
    setTodos([{ id: Date.now(), text: "New task" }, ...todos]);
  }

  return (
    <>
      <button onClick={addToTop}>Add to top</button>
      {todos.map((todo, index) => (
        <div key={index}>                  {/* ❌ index as key */}
          {todo.text} <input placeholder="notes" />
        </div>
      ))}
    </>
  );
}
```

Type "hello" in the notes for "Learn React", then click **Add to top**:

```
Before:  key=0 "Learn React" [hello]    key=1 "Learn Redux" [ ]
After:   key=0 "New task"    [hello] ❌  key=1 "Learn React" [ ]   key=2 "Learn Redux" [ ]
```

React sees `key=0` still exists, so it keeps the old input (with "hello") and only changes the text. The note is now next to the wrong task.

**Fix:** use a stable, unique ID.

```jsx
{todos.map((todo) => (
  <div key={todo.id}>
    {todo.text} <input placeholder="notes" />
  </div>
))}
```

**Key rules:**

| ✅ Good key | ❌ Bad key |
|---|---|
| ID from the database (`user.id`) | `Math.random()` — new key every render, so everything remounts |
| ID created once when the item is created (`crypto.randomUUID()`) | Array index — when the list is reordered, filtered or added to at the top |
| Unique among siblings only (not across the whole app) | Duplicate keys |

**Bonus trick — use a key to reset a component:**

```jsx
// When userId changes, React destroys the old form and creates a fresh one.
// All the form's state resets — no useEffect needed.
<EditProfileForm key={userId} userId={userId} />
```

> 💡 **Tip:** Index as a key is OK only if the list is **static**: never reordered, filtered, or added to in the middle or at the top.

Deep dive: [KeysInLists.md](../KeysInLists.md)

---

## 6. What causes unnecessary re-renders?

**Short answer:** An unnecessary re-render is when a component renders again but its output is the same. The most common causes:

| Cause | Fix |
|---|---|
| State is kept **higher** in the tree than needed | Move the state down to where it is used |
| A **new object, array or function** is passed as a prop on every render, so `React.memo` doesn't help | `useMemo` / `useCallback`, or move constants outside the component |
| The **Context value** is a new object on every render | Wrap the value in `useMemo` (Q27) |
| **One big Context** holds many unrelated values | Split it into smaller contexts |
| **Derived data** is stored in state and synced with `useEffect` (2 renders instead of 1) | Calculate it during render |
| A Redux `useSelector` returns a **new object** every time | Select primitive values, or use `shallowEqual` |
| Children are rendered **inside** a component that changes often | Pass them as `children` (they are created by the parent and don't re-render) |

**Example 1 — a new function breaks `React.memo`:**

```jsx
const Row = React.memo(function Row({ item, onDelete }) {
  return <li>{item.name} <button onClick={() => onDelete(item.id)}>X</button></li>;
});

function List({ items }) {
  const [filter, setFilter] = useState("");

  // ❌ A new function on every render, so every Row re-renders on each key press
  const handleDelete = (id) => { /* ... */ };

  // ✅ The same function every render, so Rows skip re-rendering
  // const handleDelete = useCallback((id) => { /* ... */ }, []);

  return (
    <>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {items.map((item) => <Row key={item.id} item={item} onDelete={handleDelete} />)}
    </>
  );
}
```

**Example 2 — derived state with `useEffect` (an extra render):**

```jsx
// ❌ Renders twice: once with the old fullName, then again after the effect
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(first + " " + last);
}, [first, last]);

// ✅ Renders once — just calculate it
const fullName = first + " " + last;
```

**How to find them:**

- React DevTools → ⚙️ Settings → **"Highlight updates when components render"** — components flash when they render.
- React DevTools **Profiler** → turn on **"Record why each component rendered"**.

> 💡 **Tip:** Most re-renders are cheap. Fix them only when the Profiler shows a real slowdown. The **React Compiler** removes most of these problems automatically.

Deep dive: [PerformanceOptimization.md](../PerformanceOptimization.md) · [MemoUseMemoUseCallback.md](../MemoUseMemoUseCallback.md)

---

## 7. How does React batching work?

**Short answer:** Batching means React **groups several state updates into one re-render**. When you call `setState`, React does not re-render right away. It puts the update in a **queue**, waits until your event handler finishes, then re-renders **once** with all the updates.

**In simple words:** A waiter doesn't run to the kitchen after every dish you name. They write down the whole order, then go once.

```jsx
function Form() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [saved, setSaved] = useState(false);

  console.log("render");

  function handleClick() {
    setName("Asha");
    setAge(25);
    setSaved(true);
    // No re-render yet. React re-renders ONCE after this function ends.
  }

  return <button onClick={handleClick}>Save</button>;
}
```

Clicking logs `render` **once**, not three times.

**Why `count` doesn't go up by 3 here:**

```jsx
function handleClick() {
  setCount(count + 1); // count is 0 → queue "set to 1"
  setCount(count + 1); // count is still 0 → queue "set to 1"
  setCount(count + 1); // count is still 0 → queue "set to 1"
}
// Result: 1, not 3
```

`count` is a fixed value for this render. Use the **updater function** to work from the latest queued value:

```jsx
function handleClick() {
  setCount((c) => c + 1); // 0 → 1
  setCount((c) => c + 1); // 1 → 2
  setCount((c) => c + 1); // 2 → 3
}
// Result: 3
```

**Opting out (rarely needed):** `flushSync` forces React to update the DOM right away, for example before measuring or scrolling.

```jsx
import { flushSync } from "react-dom";

function addMessage(msg) {
  flushSync(() => {
    setMessages((m) => [...m, msg]); // DOM updated immediately
  });
  listRef.current.lastChild.scrollIntoView(); // the new message is already in the DOM
}
```

> 💡 **Tip:** Batching is why "state doesn't update immediately". The new value is visible in the **next render**, not on the next line.

Deep dive: [ReactHooks.md](../ReactHooks.md)

---

## 8. What is automatic batching in React 18+?

**Short answer:** Before React 18, React batched updates **only inside React event handlers** (like `onClick`). Updates inside `setTimeout`, promises, `fetch().then()` or native event listeners caused **one re-render per `setState`**. In React 18+, batching happens **everywhere automatically** — this is called **automatic batching**.

```jsx
function UserPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);      // React 17: re-render #1
        setLoading(false);  // React 17: re-render #2
      });                   // React 18+: ONE re-render for both
  }, []);

  // ...
}
```

| Where the update happens | React 17 | React 18+ |
|---|---|---|
| React event handler (`onClick`) | ✅ Batched | ✅ Batched |
| `setTimeout` / `setInterval` | ❌ Not batched | ✅ Batched |
| Promise / `async` function / `fetch` | ❌ Not batched | ✅ Batched |
| Native `addEventListener` | ❌ Not batched | ✅ Batched |

**Important condition:** automatic batching only works when you use the new root API:

```jsx
// ✅ React 18+ — automatic batching
import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")).render(<App />);

// ❌ Old API (removed in React 19) — old batching behavior
ReactDOM.render(<App />, document.getElementById("root"));
```

**Why it matters:** fewer renders means better performance. It also avoids a "half-updated" render, for example where `user` is set but `loading` is still `true`.

**Opt out with `flushSync`** (Q7) if you really need the DOM updated between two updates.

> 💡 **Tip:** Say it simply: "React 17 batched only in event handlers. React 18 batches everywhere — timeouts, promises, native events — as long as you use `createRoot`."

---

## 9. How do transitions improve UI responsiveness?

**Short answer:** A **transition** marks a state update as **not urgent**. React then:

1. Handles **urgent** updates first (typing, clicking) so they feel instant.
2. Renders the **non-urgent** update in the background. This work can be **interrupted** — if the user types again, React drops the old work and starts with the new value.

You create transitions with **`useTransition`** (or `startTransition`). It also gives you `isPending` to show a loading hint.

**The problem:** filtering 10,000 items on every key press freezes the input, because React must finish rendering the big list before it can show the next letter.

**The fix:**

```jsx
import { useState, useTransition, memo } from "react";

function SearchPage({ allItems }) {
  const [query, setQuery] = useState("");     // urgent: what the input shows
  const [filter, setFilter] = useState("");   // not urgent: what the list uses
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    setQuery(e.target.value);       // update the input right away
    startTransition(() => {
      setFilter(e.target.value);    // the list can wait
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <p>Updating list...</p>}
      <SlowList items={allItems} filter={filter} />
    </>
  );
}

// memo is important: during the urgent render, SlowList gets the same props, so it skips
const SlowList = memo(function SlowList({ items, filter }) {
  const visible = items.filter((item) => item.name.includes(filter));
  return <ul>{visible.map((item) => <li key={item.id}>{item.name}</li>)}</ul>;
});
```

**`useDeferredValue` — when you don't own the `setState`** (for example, the value comes from props):

```jsx
function Results({ query }) {
  const deferredQuery = useDeferredValue(query); // lags behind when React is busy
  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      <SlowList filter={deferredQuery} />
    </div>
  );
}
```

| | `useTransition` | `useDeferredValue` |
|---|---|---|
| You wrap | The **state update** (`setFilter`) | The **value** (`query`) |
| Use when | You control the setter | You only get the value (e.g. from props) |
| Pending flag | `isPending` | Compare `value !== deferredValue` |

**Remember:**

- Transitions **don't make code faster**. They keep the page **responsive** while slow work happens.
- Don't put the controlled input's own value in a transition — the input must update urgently.
- In React 19, `startTransition` also accepts **async functions** (called "Actions"), so `isPending` stays `true` until the request finishes.

> 💡 **Tip:** Good examples: search filtering, switching tabs, navigating to a heavy page. Bad example: the text inside an input.

Deep dive: [PerformanceOptimization.md](../PerformanceOptimization.md)

---

## 10. What is concurrent rendering?

**Short answer:** Concurrent rendering means React can **work on more than one version of the UI at the same time**, and rendering can be **interrupted**. React renders in small chunks and gives control back to the browser between chunks, so the page stays responsive to clicks and typing even during heavy rendering.

**In simple words:** A chef is cooking a big order (a slow render). A customer wants a quick coffee (the user types). A concurrent chef pauses the big order, makes the coffee, then continues. A blocking chef makes the customer wait until the big order is done.

**Before (blocking) vs now (concurrent):**

```
Blocking (React 17 and older):
[======== render big list (300ms) ========] → user's key press handled only now 😖

Concurrent (React 18+ with a transition):
[== chunk ==] key press ✅ [== chunk ==] key press ✅ [== chunk ==] done
```

**Key points:**

- It is **not multi-threading**. JavaScript is still single-threaded. Concurrency is about **scheduling** — doing work in small pieces (about 5ms each) and choosing what to do next.
- It is **opt-in per update**. You turn it on by using concurrent features. Normal updates are still urgent.
- It needs `createRoot` (React 18+).

**Features built on concurrent rendering:**

| Feature | What it does |
|---|---|
| `useTransition` / `startTransition` (Q9) | Marks updates as low priority and interruptible |
| `useDeferredValue` (Q9) | Shows an old value while rendering the new one in the background |
| Suspense for data (Q46) | Shows a fallback while waiting, without blocking the rest of the page |
| Streaming SSR + selective hydration (Q46) | Sends and hydrates parts of the page as they become ready |
| `<Activity>` (React 19.2) | Keeps hidden parts of the UI (like inactive tabs) prepared in the background |

**What it means for your code:**

1. **The render phase must be pure** (Q4). React may start rendering, throw the work away and start again.
2. **External stores can "tear".** If a store outside React changes in the middle of a paused render, some components could show the old value and some the new one. Libraries use `useSyncExternalStore` (Q20) to prevent this.

> 💡 **Tip:** One-line answer: "Concurrent rendering makes rendering interruptible, so React can handle urgent updates like typing in the middle of a slow, non-urgent render."

Deep dive: [Reconciliation-And-Fiber.md](../Reconciliation-And-Fiber.md) · [PerformanceOptimization.md](../PerformanceOptimization.md)

---

[Back to the list](README.md) · [Part 2: Advanced Hooks →](02_Hooks.md)
