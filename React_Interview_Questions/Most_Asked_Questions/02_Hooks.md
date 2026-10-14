# Most Asked React Questions — Part 2: Hooks (11–20)

[← Part 1: Basics](01_Basics.md) · [Back to the list](README.md) · [Part 3: Advanced →](03_Advanced.md)

---

## 11. What are Hooks? What are the Rules of Hooks?

**Short answer:** Hooks are special functions (their names start with `use`) that let functional components use React features like state (`useState`), side effects (`useEffect`) and context (`useContext`). They were added in React 16.8.

**The 2 rules:**

1. **Only call hooks at the top level** — never inside `if`, loops, nested functions, or after an early `return`.
2. **Only call hooks from React functions** — inside function components or custom hooks. Not in regular JavaScript functions or class components.

```jsx
// ❌ Wrong — hook inside a condition
function Profile({ userId }) {
  if (userId) {
    const [user, setUser] = useState(null);
  }
  // ...
}

// ✅ Right — hook always at the top, the condition goes inside it
function Profile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (userId) fetchUser(userId).then(setUser);
  }, [userId]);
  // ...
}
```

**Why these rules?** React does not know your hooks by name. It remembers them by their **call order** (1st hook, 2nd hook, 3rd hook...). If a hook is skipped in one render, the order shifts and React gives the wrong state to the wrong hook.

**Common hooks:** `useState`, `useEffect`, `useContext`, `useRef`, `useMemo`, `useCallback`, `useReducer`, `useLayoutEffect`, `useId`, `useTransition`.

> 💡 **Tip:** The ESLint plugin `eslint-plugin-react-hooks` catches these mistakes for you. (One exception: React 19's `use()` API is allowed inside conditions.)

Deep dive: [HooksRules.md](../HooksRules.md)

---

## 12. What is `useState`? Why doesn't state update immediately?

**Short answer:** `useState` adds state to a functional component. It returns `[value, setValue]`. Calling `setValue` does **not** change the value right away. It **schedules a re-render**, and the new value is available in the **next** render.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    console.log(count); // ❌ still 0 — this render's value
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

**Why?** Every render has its own "snapshot" of state. Inside `handleClick`, `count` is a fixed value from that render. React also **batches** many updates into a single re-render to be faster.

**The classic trick question:**

```jsx
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}
// Result: count goes up by 1, not 3!
// All three lines read the same old count (0), so all three set it to 0 + 1.
```

**Fix — use a functional update** when the new value depends on the old one:

```jsx
function handleClick() {
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
}
// Result: count goes up by 3 ✅ — each update gets the latest value.
```

> 💡 **Tip:** Since React 18, batching happens everywhere — in event handlers, `setTimeout`, promises and `fetch` callbacks.

Deep dive: [ReactHooks.md](../ReactHooks.md)

---

## 13. What is `useEffect`? Explain the dependency array.

**Short answer:** `useEffect` runs **side effects** after the component renders. Side effects are things outside React, like fetching data, timers, subscriptions, or changing `document.title`. The **dependency array** controls **when** the effect runs.

```jsx
useEffect(() => {
  // side-effect code
}, [dependencies]);
```

**The 3 cases:**

| Code | When it runs |
|---|---|
| `useEffect(fn)` — no array | After **every** render |
| `useEffect(fn, [])` — empty array | **Once**, after the first render (mount) |
| `useEffect(fn, [a, b])` | After the first render, then again whenever `a` or `b` changes |

**Example:**

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // Runs on mount, and again every time userId changes
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, [userId]);

  // Runs whenever user changes
  useEffect(() => {
    document.title = user ? user.name : "Loading...";
  }, [user]);

  return <h1>{user?.name}</h1>;
}
```

**Common mistakes:**

- **Missing dependency** — you use a value inside the effect but don't put it in the array. The effect keeps using an old (stale) value.
- **Infinite loop** — setting state in an effect that has no array:

```jsx
useEffect(() => {
  setCount(count + 1); // ❌ render → effect → setState → render → effect → ... forever
});
```

> 💡 **Tip — "Why does my effect run twice?"** In development, `<StrictMode>` mounts, unmounts and mounts every component again once, to help you find missing cleanup code. This does **not** happen in production.

Deep dive: [useEffectDeepDive.md](../useEffectDeepDive.md)

---

## 14. What is the cleanup function in `useEffect`?

**Short answer:** The function you **return** from `useEffect` is the cleanup. React calls it **before the component is removed** (unmount) and **before the effect runs again**. Use it to stop timers, remove event listeners, cancel requests and unsubscribe.

```jsx
function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);

    return () => clearInterval(id); // 🧹 cleanup — stop the timer
  }, []);

  return <p>{time.toLocaleTimeString()}</p>;
}
```

Without the cleanup, the interval keeps running even after `Clock` is removed from the screen. That is a **memory leak**.

**Another common example — an event listener:**

```jsx
useEffect(() => {
  function handleResize() {
    console.log(window.innerWidth);
  }

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

**Order when a dependency changes:** old cleanup runs → then the new effect runs.

| Setup | Cleanup |
|---|---|
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| `addEventListener` | `removeEventListener` |
| `fetch` with `AbortController` | `controller.abort()` |
| WebSocket / subscription | `socket.close()` / `unsubscribe()` |

> 💡 **Tip:** In class components, the cleanup is the same as `componentWillUnmount`.

Deep dive: [useEffectDeepDive.md](../useEffectDeepDive.md)

---

## 15. What is `useRef`? How is it different from `useState`?

**Short answer:** `useRef` gives you a box (`{ current: value }`) that **keeps its value between renders**, but **changing it does NOT re-render** the component. It has two main uses: **accessing a DOM element**, and **storing a value the UI doesn't need to show**.

**Use 1 — access a DOM element:**

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>Focus input</button>
    </>
  );
}
```

**Use 2 — store a value without re-rendering (a timer id):**

```jsx
function Stopwatch() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  function start() {
    clearInterval(intervalRef.current); // avoid running two timers
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stop() {
    clearInterval(intervalRef.current);
  }

  return (
    <>
      <p>{seconds}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}
```

| | `useState` | `useRef` |
|---|---|---|
| Keeps value between renders | ✅ Yes | ✅ Yes |
| Changing it re-renders | ✅ Yes | ❌ No |
| How you update it | `setValue(x)` | `ref.current = x` |
| When the new value is readable | In the next render | Immediately |
| Use for | Data shown on screen | DOM elements, timer ids, previous values |

> 💡 **Tip:** Simple rule — if the value is shown on screen, use state. If it isn't, a ref is enough. Don't read or write `ref.current` while rendering; do it in event handlers or effects.

Deep dive: [ReactHooks.md](../ReactHooks.md)

---

## 16. What is the difference between `useMemo` and `useCallback`?

**Short answer:** Both **cache** something between renders so it isn't created again every time.

- `useMemo` caches a **value** (the result of a calculation).
- `useCallback` caches a **function**.

```jsx
// useMemo — remember the RESULT
const sortedProducts = useMemo(() => {
  return products.slice().sort((a, b) => a.price - b.price); // expensive
}, [products]); // recalculates only when products changes

// useCallback — remember the FUNCTION itself
const handleDelete = useCallback((id) => {
  setProducts((prev) => prev.filter((p) => p.id !== id));
}, []); // the same function on every render
```

**Why cache a function?** In JavaScript, a function created during a render is a **new object every time**. If you pass it to a child wrapped in `React.memo`, the child sees a "new" prop and re-renders anyway. `useCallback` keeps the same function, so `React.memo` can do its job (see Q17).

**Easy way to remember:**

```jsx
useCallback(fn, deps)
// is the same as
useMemo(() => fn, deps)
```

| | `useMemo` | `useCallback` |
|---|---|---|
| Returns | A cached **value** | A cached **function** |
| Use for | Expensive calculations, keeping objects/arrays stable | Functions passed to memoized children or used in effect dependencies |

**When NOT to use them:** for cheap calculations and simple components. Memoization has its own cost. Use it when you can see a real slowdown.

> 💡 **Tip:** The **React Compiler** (stable since 2025) adds this memoization automatically, so new projects need far less manual `useMemo` / `useCallback`.

Deep dive: [MemoUseMemoUseCallback.md](../MemoUseMemoUseCallback.md)

---

## 17. What is `React.memo`?

**Short answer:** `React.memo` wraps a component and **skips re-rendering it when its props are the same** as last time. Normally, a child re-renders every time its parent re-renders. `React.memo` stops that when the props haven't changed.

```jsx
const UserCard = React.memo(function UserCard({ name }) {
  console.log("UserCard rendered");
  return <p>{name}</p>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Clicked {count}</button>
      <UserCard name="Priya" />  {/* ✅ does NOT re-render when count changes */}
    </>
  );
}
```

**The common trap — new objects and functions break `React.memo`:**

React compares each prop with a **shallow** check (`Object.is`). A new object, array or function counts as a "different" prop on every render:

```jsx
<UserCard user={{ name: "Priya" }} />      // ❌ new object every render → re-renders
<UserCard onSelect={() => select(id)} />  // ❌ new function every render → re-renders
```

**Fix:** keep the value stable with `useMemo` / `useCallback`, or move it outside the component.

| | What it does |
|---|---|
| `React.memo` | Skips re-rendering a **component** |
| `useMemo` | Caches a **value** inside a component |
| `useCallback` | Caches a **function** inside a component |

> 💡 **Tip:** `React.memo` only checks props. If the component's own state, or a context it uses, changes — it still re-renders.

Deep dive: [MemoUseMemoUseCallback.md](../MemoUseMemoUseCallback.md)

---

## 18. What is the Context API? What problem does it solve?

**Short answer:** Context lets you share data with **any component in the tree without passing props through every level**. It solves **prop drilling** — passing a prop through many components that don't use it, only to reach a deep child.

**The prop drilling problem:**

```
App (has theme) → Layout → Sidebar → Menu → MenuItem (needs theme)

Layout, Sidebar and Menu don't use theme — they only pass it down.
```

**The fix with Context — 3 steps:**

```jsx
import { createContext, useContext, useState } from "react";

// 1. Create the context
const ThemeContext = createContext("light");

// 2. Provide a value at the top
function App() {
  const [theme, setTheme] = useState("dark");

  return (
    <ThemeContext.Provider value={theme}>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        Toggle theme
      </button>
      <Layout />
    </ThemeContext.Provider>
  );
}

// 3. Use it anywhere below — no props needed
function MenuItem() {
  const theme = useContext(ThemeContext);
  return <li className={theme}>Home</li>;
}
```

**Good for:** theme, logged-in user, language, app settings — data that many components need and that doesn't change often.

**Downside:** when the context value changes, **every component that uses that context re-renders**. For large state that changes often, use Redux Toolkit or Zustand (Q24).

> 💡 **Tip:** In React 19 you can write `<ThemeContext value={theme}>` directly — `.Provider` is no longer required.

Deep dive: [ContextAPI.md](../ContextAPI.md) · [propDrilling.md](../propDrilling.md)

---

## 19. What is `useReducer`? When should you use it instead of `useState`?

**Short answer:** `useReducer` manages state with a **reducer function**: `(state, action) => newState`. You `dispatch` an **action** that says *what happened*, and the reducer decides *how* the state changes. Use it when state is **complex** or has **many related values**.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return { count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </>
  );
}
```

| Use `useState` when | Use `useReducer` when |
|---|---|
| State is simple (number, string, boolean) | State is an object with many fields |
| Updates are independent | One action changes several values together |
| There are few ways to update it | There are many update types (add, edit, delete, reset) |
| — | You want all update logic in one place (easy to test) |

> 💡 **Tip:** `useReducer` + Context together give you a small Redux-like store without any library.

Deep dive: [useReducer.md](../useReducer.md)

---

## 20. What is a custom hook?

**Short answer:** A custom hook is your own function whose name starts with **`use`** and which calls other hooks inside it. It lets you **reuse stateful logic** in many components. Each component that uses it gets its **own separate state**.

**Example — track the window width:**

```jsx
// useWindowWidth.js
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

// Use it in any component
function Navbar() {
  const width = useWindowWidth();
  return width < 768 ? <MobileMenu /> : <DesktopMenu />;
}

function Footer() {
  const width = useWindowWidth();
  return <p>Screen width: {width}px</p>;
}
```

Without the custom hook, you would copy the same `useState` + `useEffect` code into both `Navbar` and `Footer`.

**Remember:**

- The name must start with `use`, so React and ESLint apply the Rules of Hooks.
- It shares **logic**, not **state** — `Navbar` and `Footer` each have their own `width`.
- Popular examples: `useFetch`, `useLocalStorage`, `useDebounce`, `useToggle`, `useOnlineStatus`.

> 💡 **Tip:** Custom hooks replaced HOCs and render props as the main way to share logic between components.

Deep dive: [CustomHooks.md](../CustomHooks.md)

---

[← Part 1: Basics](01_Basics.md) · [Back to the list](README.md) · [Part 3: Advanced →](03_Advanced.md)
