# Advanced React Questions — Part 2: Advanced Hooks (11–20)

[← Part 1: Rendering](01_Rendering.md) · [Back to the list](README.md) · [Part 3: Performance →](03_Performance.md)

---

## 11. `useEffect` vs `useLayoutEffect`?

**Short answer:** Both run after React updates the DOM. The difference is **when**:

- **`useEffect`** runs **after the browser paints** the screen. It does not block the user from seeing the update. Use it for almost everything.
- **`useLayoutEffect`** runs **after the DOM is updated but before the browser paints**. It blocks painting until it finishes. Use it only when you must **measure or change the layout** before the user sees it, to avoid a flicker.

```
Render → DOM updated → useLayoutEffect → 🖌️ Browser paints → useEffect
                        (blocks paint)                      (doesn't block)
```

**Example — a tooltip that must not jump:**

```jsx
function Tooltip({ targetRect, text }) {
  const ref = useRef(null);
  const [top, setTop] = useState(0);

  useLayoutEffect(() => {
    const { height } = ref.current.getBoundingClientRect(); // measure
    setTop(targetRect.top - height);                        // move above the target
  }, [targetRect]);
  // React re-renders with the new `top` BEFORE the browser paints,
  // so the user only ever sees the tooltip in the right place.

  return <div ref={ref} style={{ position: "absolute", top }}>{text}</div>;
}
```

With `useEffect`, the user may see the tooltip at `top: 0` for one frame, then see it jump.

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Runs | After paint (usually) | Before paint |
| Blocks the screen | No | Yes — slow code here makes the app feel frozen |
| Use for | Fetching data, subscriptions, timers, logging | Measuring DOM size/position, scroll position, stopping flicker |
| On the server (SSR) | Doesn't run | Doesn't run (older React versions also show a warning) |

**Advanced notes:**

- If an update was caused by a **user click**, React may run `useEffect` *before* paint too. Don't depend on the exact timing of `useEffect`.
- There is a third one, **`useInsertionEffect`**. It runs before layout effects and is only for **CSS-in-JS libraries** to insert `<style>` tags. You will almost never use it.

> 💡 **Tip:** "Start with `useEffect`. Switch to `useLayoutEffect` only when you see a visual flicker caused by measuring the DOM."

Basics: [Most asked Q23](../Most_Asked_Questions/03_Advanced.md#23-what-is-the-difference-between-useeffect-and-uselayouteffect) · Deep dive: [useEffectDeepDive.md](../useEffectDeepDive.md)

---

## 12. How do stale closures occur in Hooks?

**Short answer:** Every render has its **own** props and state values. A function created during a render **remembers the values from that render** (this is a JavaScript closure). If that function runs **later** — in a `setInterval`, a `setTimeout`, an event listener added once, or a `useCallback` with missing dependencies — it still sees the **old** values. This is a **stale closure**.

**In simple words:** It's like taking a photo of a clock. The clock keeps moving, but your photo always shows the old time.

**Example — the counter that gets stuck at 1:**

```jsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1); // ❌ `count` is always 0 here — it's the first render's value
    }, 1000);
    return () => clearInterval(id);
  }, []); // the effect runs once, so the interval keeps the first render's closure

  return <h1>{count}</h1>; // shows 1 forever
}
```

Every second it runs `setCount(0 + 1)`.

**Fix 1 — use the updater function (best here):**

```jsx
setCount((c) => c + 1); // React gives you the latest value
```

**Fix 2 — add the value to the dependency array:**

```jsx
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]); // the effect is re-created with the fresh `count` each time
```

**Fix 3 — keep the latest value in a ref** (when you need to *read* it in a callback):

```jsx
const countRef = useRef(count);
useEffect(() => {
  countRef.current = count; // always holds the latest value
}, [count]);

useEffect(() => {
  const id = setInterval(() => {
    console.log("Latest count:", countRef.current); // never stale
  }, 1000);
  return () => clearInterval(id);
}, []);
```

**Fix 4 — `useEffectEvent` (React 19.2+):** a function that always sees the latest props and state, but doesn't need to be in the dependency array.

```jsx
import { useEffect, useEffectEvent } from "react";

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected!", theme); // always the latest theme
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("connected", () => onConnected());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // changing the theme does NOT reconnect
}
```

**Where stale closures usually happen:**

| Place | Why |
|---|---|
| `setInterval` / `setTimeout` inside `useEffect(..., [])` | The callback was created in the first render |
| `window.addEventListener` added once | The handler keeps the first render's values |
| `useCallback` / `useMemo` with missing dependencies | The cached function keeps old values |
| Async code after `await` | It uses the values from the render that started it |

> 💡 **Tip:** The ESLint rule `react-hooks/exhaustive-deps` warns about most stale closures. Don't turn it off — fix the dependencies instead.

Deep dive: [useEffectDeepDive.md](../useEffectDeepDive.md) · [Closure.md](../../JavaScript_Interview_Questions/Closure.md)

---

## 13. How do you prevent race conditions in `useEffect`?

**Short answer:** A race condition happens when **several requests are running** and an **old, slow response arrives after a newer one**, so it overwrites the correct data. To prevent it, use the **cleanup function** to either **ignore** the old response or **cancel** the old request with `AbortController`.

**The problem:**

```
User clicks user 1  →  request A starts (slow, 3s)
User clicks user 2  →  request B starts (fast, 1s)
                       B returns → shows user 2 ✅
                       A returns → shows user 1 ❌  (but user 2 is selected!)
```

```jsx
// ❌ Has a race condition
useEffect(() => {
  fetch(`/api/users/${userId}`)
    .then((res) => res.json())
    .then((data) => setUser(data)); // whichever request finishes LAST wins
}, [userId]);
```

**Fix 1 — an `ignore` flag:**

```jsx
useEffect(() => {
  let ignore = false;

  fetch(`/api/users/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!ignore) setUser(data); // only the latest request may update state
    });

  return () => {
    ignore = true; // runs when userId changes or the component unmounts
  };
}, [userId]);
```

**Fix 2 — cancel the request with `AbortController` (also saves bandwidth):**

```jsx
useEffect(() => {
  const controller = new AbortController();

  async function load() {
    try {
      const res = await fetch(`/api/users/${userId}`, { signal: controller.signal });
      const data = await res.json();
      setUser(data);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message); // aborts are expected
    }
  }

  load();
  return () => controller.abort(); // cancel the old request
}, [userId]);
```

**Fix 3 — use a data library (what real apps do):**

```jsx
const { data: user } = useQuery({
  queryKey: ["user", userId],          // each userId has its own cache entry
  queryFn: ({ signal }) =>
    fetch(`/api/users/${userId}`, { signal }).then((res) => res.json()),
});
```

TanStack Query (and RTK Query, SWR) always shows the data that matches the **current** key, so old responses can't overwrite new ones.

| Fix | Stops the wrong update | Cancels the network request |
|---|---|---|
| `ignore` flag | ✅ | ❌ |
| `AbortController` | ✅ | ✅ |
| TanStack Query / RTK Query | ✅ | ✅ (when you pass `signal`) |

> 💡 **Tip:** Strict Mode runs your effect twice in development (mount → cleanup → mount). If your fetch has no cleanup, this is how you'll notice the bug early.

Deep dive: [useEffectDeepDive.md](../useEffectDeepDive.md) · [DataFetchingPatterns.md](../DataFetchingPatterns.md)

---

## 14. When should you use `useMemo`?

**Short answer:** `useMemo` **caches the result of a calculation** between renders. It recalculates only when a dependency changes. Use it in two cases:

1. **The calculation is slow** — filtering, sorting or transforming big data.
2. **You need the same object/array reference** — to pass to a `React.memo` child, or to use as a dependency of another hook.

```jsx
const value = useMemo(() => calculate(a, b), [a, b]);
```

**Case 1 — a slow calculation:**

```jsx
function ProductList({ products, search, sortBy }) {
  const [darkMode, setDarkMode] = useState(false);

  // Without useMemo, toggling dark mode would filter + sort 10,000 items again
  const visibleProducts = useMemo(() => {
    return products
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a[sortBy] - b[sortBy]);
  }, [products, search, sortBy]);

  // ...
}
```

**Case 2 — a stable reference for a dependency:**

```jsx
function Chat({ roomId, serverUrl }) {
  // ❌ A new object every render, so the effect reconnects on EVERY render
  // const options = { roomId, serverUrl };

  // ✅ The same object until roomId or serverUrl changes
  const options = useMemo(() => ({ roomId, serverUrl }), [roomId, serverUrl]);

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]);
}
```

(Even simpler: create the object **inside** the effect and depend on `roomId` and `serverUrl` directly.)

**When NOT to use it:**

| ❌ Don't | Why |
|---|---|
| `useMemo(() => a + b, [a, b])` | Adding is faster than the memo check itself |
| Wrapping everything "just in case" | Each `useMemo` costs memory and makes code harder to read |
| Using it to fix a bug | It's only a performance hint. React may throw the cache away |

**How to know if a calculation is slow:**

```jsx
console.time("filter");
const result = products.filter(/* ... */);
console.timeEnd("filter"); // if it's around 1ms or more, consider useMemo
```

> 💡 **Tip:** With the **React Compiler**, React adds memoization for you, so manual `useMemo` is needed much less. Interviewers still expect you to know when it helps.

Deep dive: [MemoUseMemoUseCallback.md](../MemoUseMemoUseCallback.md)

---

## 15. When should you use `useCallback`?

**Short answer:** `useCallback` **caches a function**, so you get the **same function reference** on every render until a dependency changes. It is useful only when the function's identity matters:

1. You pass it to a child wrapped in **`React.memo`**.
2. It is a **dependency** of `useEffect`, `useMemo` or another `useCallback`.
3. You **return it from a custom hook**, so users of the hook can safely put it in their dependency arrays.

```jsx
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**Why it's needed:** in JavaScript, `() => {} !== () => {}`. A component creates **new functions on every render**. For a `React.memo` child, a new function means "the props changed", so it re-renders anyway.

**Example — with a memoized child:**

```jsx
const TodoItem = React.memo(function TodoItem({ todo, onToggle }) {
  console.log("render", todo.id);
  return (
    <li onClick={() => onToggle(todo.id)}>
      {todo.done ? "✅" : "⬜"} {todo.text}
    </li>
  );
});

function TodoList() {
  const [todos, setTodos] = useState(initialTodos);
  const [input, setInput] = useState("");

  // Same function every render, so typing in the input doesn't re-render every TodoItem
  const handleToggle = useCallback((id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []); // no dependencies needed, thanks to the updater function

  return (
    <>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <ul>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
        ))}
      </ul>
    </>
  );
}
```

**Common mistake — `useCallback` without a memo child does nothing useful:**

```jsx
// ❌ Pointless: <button> is not memoized, so it re-renders anyway
const handleClick = useCallback(() => setOpen(true), []);
return <button onClick={handleClick}>Open</button>;
```

**`useCallback` vs `useMemo`:**

```jsx
useCallback(fn, deps)
// is the same as
useMemo(() => fn, deps)
```

`useCallback` caches **the function**. `useMemo` caches **the value the function returns**.

> 💡 **Tip:** `useCallback` and `React.memo` work as a pair. Using only one of them usually gives no benefit.

Deep dive: [MemoUseMemoUseCallback.md](../MemoUseMemoUseCallback.md)

---

## 16. How does `useRef` differ from `useState`?

**Short answer:** Both keep a value between renders. The difference:

- **`useState`** — changing it **re-renders** the component. Use it for anything shown on the screen.
- **`useRef`** — a box with a `.current` property. Changing it **does not re-render**. Use it for values the UI doesn't show (timer IDs, previous values) and for **DOM elements**.

| | `useState` | `useRef` |
|---|---|---|
| Changing it re-renders | ✅ Yes | ❌ No |
| How you update it | `setValue(newValue)` | `ref.current = newValue` |
| When the new value is visible | In the next render | Immediately |
| Value inside a render | A fixed snapshot | Always the latest (it's mutable) |
| Use for | Data shown in the UI | DOM access, timer IDs, previous values, "latest value" for callbacks |

**Example — a stopwatch uses both:**

```jsx
function Stopwatch() {
  const [seconds, setSeconds] = useState(0); // shown on screen → state
  const intervalRef = useRef(null);          // only needed for clearInterval → ref

  function start() {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }

  function stop() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  useEffect(() => stop, []); // clear the interval on unmount

  return (
    <>
      <h1>{seconds}s</h1>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}
```

**Example — a ref does not update the screen:**

```jsx
function Counter() {
  const countRef = useRef(0);

  function handleClick() {
    countRef.current += 1;
    console.log(countRef.current); // 1, 2, 3... (the value really changes)
  }

  return <button onClick={handleClick}>{countRef.current}</button>; // always shows 0
}
```

**Other common uses of `useRef`:**

```jsx
// 1. Focus an input
const inputRef = useRef(null);
<input ref={inputRef} />;
inputRef.current.focus();

// 2. Remember the previous value
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current; // the value from the previous render
}
```

**Rule:** don't read or write `ref.current` **during rendering** (in the component body). Do it in event handlers and effects. Otherwise your component's output becomes unpredictable.

> 💡 **Tip:** Ask yourself: "Does the screen need to show this value?" Yes → `useState`. No → `useRef`.

Basics: [Most asked Q15](../Most_Asked_Questions/02_Hooks.md#15-what-is-useref-how-is-it-different-from-usestate) · Deep dive: [ReactHooks.md](../ReactHooks.md)

---

## 17. How would you design a custom Hook?

**Short answer:** A custom Hook is a function whose name starts with **`use`** and which calls other Hooks. It lets you **reuse stateful logic** (not state itself) between components. A good custom Hook:

| Principle | Meaning |
|---|---|
| **Named `useSomething`** | Required, so React and the lint rules treat it as a Hook |
| **Does one job** | `useDebounce`, `useLocalStorage` — not `useEverything` |
| **Simple inputs** | A few arguments, or one options object when there are many |
| **Familiar output** | An array `[value, setValue]` for 2 values (like `useState`), an object `{ data, error, isLoading }` for more |
| **Cleans up after itself** | Removes listeners, clears timers, aborts requests |
| **Returns stable functions** | Wraps returned functions in `useCallback`, so users can put them in dependency arrays |
| **SSR-safe** | Doesn't touch `window` or `localStorage` during render on the server |
| **Easy to test** | Can be tested alone with `renderHook` (Q49) |

**Example 1 — `useDebounce`:**

```jsx
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cancel if the value changes again
  }, [value, delay]);

  return debounced;
}

// Usage: call the API only after the user stops typing for 500ms
function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) searchApi(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

**Example 2 — `useLocalStorage` (works just like `useState`):**

```jsx
function useLocalStorage(key, initialValue) {
  // Lazy initial state: read localStorage only once, on the first render
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue; // SSR-safe
    try {
      const saved = window.localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue; // bad JSON or storage is blocked
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage is full or blocked — ignore
    }
  }, [key, value]);

  return [value, setValue]; // same shape as useState
}

// Usage
const [theme, setTheme] = useLocalStorage("theme", "light");
```

**Important:** each component that calls a Hook gets its **own separate state**. Two components calling `useLocalStorage("theme")` do not share one `useState`. To share state, use Context or a store.

> 💡 **Tip:** Interviewers like it when you mention **cleanup**, **SSR safety** and **returning the same shape as built-in hooks**.

Deep dive: [CustomHooks.md](../CustomHooks.md)

---

## 18. What are the rules of Hooks, and why do they exist?

**Short answer:** There are two rules:

1. **Call Hooks only at the top level** — not inside `if`, loops, nested functions, or after an early `return`.
2. **Call Hooks only from React functions** — function components or custom Hooks. Not from normal JavaScript functions or class components.

**Why:** React does **not** store Hooks by name. It stores them in a **list, in the order they are called**. On every render, React walks the list in the same order: "the 1st Hook gets slot 1, the 2nd Hook gets slot 2..." If the order changes, React gives the wrong state to the wrong Hook.

**Example — what goes wrong:**

```jsx
function Profile({ showAge }) {
  const [name, setName] = useState("Asha");

  if (showAge) {
    const [age, setAge] = useState(25); // ❌ Hook inside a condition
  }

  const [city, setCity] = useState("Pune");
  // ...
}
```

```
Render 1 (showAge = true):          Render 2 (showAge = false):
  slot 0 → name = "Asha"              slot 0 → name = "Asha"
  slot 1 → age  = 25                  slot 1 → city reads slot 1 → gets 25 ❌
  slot 2 → city = "Pune"              slot 2 → nobody reads it
```

React also throws an error: *"Rendered fewer hooks than expected."*

**Fix — always call the Hook, put the condition inside or around its use:**

```jsx
function Profile({ showAge }) {
  const [name, setName] = useState("Asha");
  const [age, setAge] = useState(25);       // always called
  const [city, setCity] = useState("Pune");

  return (
    <>
      <p>{name}</p>
      {showAge && <p>{age}</p>}               {/* condition here instead */}
      <p>{city}</p>
    </>
  );
}
```

**Common mistakes:**

```jsx
// ❌ After an early return
if (!user) return null;
const [x, setX] = useState(0);

// ❌ Inside a loop
items.forEach(() => useEffect(() => {}));

// ❌ Inside an event handler
<button onClick={() => useState(0)}>

// ❌ In a normal function (doesn't start with "use")
function getUser() { return useContext(UserContext); }
```

**Exception:** the React 19 **`use()`** API can be called inside conditions and loops. It's the only one.

> 💡 **Tip:** Install `eslint-plugin-react-hooks`. It catches these mistakes as you type.

Deep dive: [HooksRules.md](../HooksRules.md)

---

## 19. When would you use `useReducer` over `useState`?

**Short answer:** Use `useReducer` when state is **complex**: several values that change **together**, many different ways to update the state, or when the next state depends on the previous one in non-trivial ways. You move all the update logic into **one pure function** (the reducer), outside the component.

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
// dispatch({ type: "something" }) → reducer(state, action) → new state
```

**Example — data fetching. With `useState`, it's easy to get impossible states:**

```jsx
// ❌ 3 separate states can disagree — e.g. loading = true AND error is set
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

**With `useReducer`, every change is one clear step:**

```jsx
const initialState = { status: "idle", data: null, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { status: "loading", data: null, error: null };
    case "FETCH_SUCCESS":
      return { status: "success", data: action.payload, error: null };
    case "FETCH_ERROR":
      return { status: "error", data: null, error: action.error };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function UserProfile({ userId }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let ignore = false;
    dispatch({ type: "FETCH_START" });

    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => !ignore && dispatch({ type: "FETCH_SUCCESS", payload: data }))
      .catch((err) => !ignore && dispatch({ type: "FETCH_ERROR", error: err.message }));

    return () => { ignore = true; };
  }, [userId]);

  if (state.status === "loading") return <p>Loading...</p>;
  if (state.status === "error") return <p>Error: {state.error}</p>;
  return <h1>{state.data?.name}</h1>;
}
```

**When to choose which:**

| Use `useState` when | Use `useReducer` when |
|---|---|
| Values are simple and independent (`isOpen`, `name`) | Several values change together |
| One or two simple ways to update | Many actions (`add`, `remove`, `edit`, `reset`...) |
| Logic is short | You want to **test** the logic alone (the reducer is a pure function) |
| | You pass updates deep down — `dispatch` **never changes**, so it's safe in Context and dependency arrays |

**Bonus:** `useReducer` + Context gives you a simple Redux-like store without a library.

> 💡 **Tip:** A good rule: when you start writing `setA(...); setB(...); setC(...)` together in many handlers, switch to `useReducer`.

Deep dive: [useReducer.md](../useReducer.md)

---

## 20. What is `useSyncExternalStore` used for?

**Short answer:** `useSyncExternalStore` lets a component **subscribe to data that lives outside React** — a state library's store, or browser values like `navigator.onLine` or the window width — **safely with concurrent rendering**. It prevents **"tearing"**, where different components show **different values of the same data** during one render.

```jsx
const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);
```

| Argument | What it does |
|---|---|
| `subscribe(callback)` | Start listening to the store. Call `callback` when it changes. Return an unsubscribe function |
| `getSnapshot()` | Return the store's current value |
| `getServerSnapshot()` | Optional. The value to use during SSR and hydration |

**Example 1 — online/offline status:**

```jsx
import { useSyncExternalStore } from "react";

// Defined OUTSIDE the component, so it's the same function every render
function subscribe(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine, // value in the browser
    () => true              // value on the server (there is no navigator there)
  );
}

function StatusBar() {
  const isOnline = useOnlineStatus();
  return <p>{isOnline ? "✅ Online" : "❌ Offline"}</p>;
}
```

**Example 2 — a tiny store (this is how libraries like Zustand work inside):**

```jsx
let count = 0;
const listeners = new Set();

const counterStore = {
  increment() {
    count++;
    listeners.forEach((listener) => listener()); // tell React it changed
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return count;
  },
};

function Counter() {
  const value = useSyncExternalStore(counterStore.subscribe, counterStore.getSnapshot);
  return <button onClick={counterStore.increment}>{value}</button>;
}
```

**What is tearing?** In concurrent rendering (Q10), React can pause in the middle of a render. If the external store changes during the pause, components rendered **before** the pause show the old value and components rendered **after** show the new one. `useSyncExternalStore` notices this and re-renders synchronously, so the whole UI shows the same value.

**Two common mistakes:**

1. **`getSnapshot` returns a new object every time** (`() => ({ ...store })`) → React thinks it changed on every check → infinite loop. Return the **same** value if nothing changed.
2. **`subscribe` is defined inside the component** → a new function every render → React unsubscribes and resubscribes on every render. Define it outside, or wrap it in `useCallback`.

> 💡 **Tip:** Most app developers don't call it directly. Libraries use it — Redux's `useSelector` and Zustand are built on it. Say: "It's for library authors and for subscribing to browser APIs."

---

[← Part 1: Rendering](01_Rendering.md) · [Back to the list](README.md) · [Part 3: Performance →](03_Performance.md)
