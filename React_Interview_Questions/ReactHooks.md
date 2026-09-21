# React Hooks - useState, useRef, useContext and the Full List

> Related files: [HooksRules.md](HooksRules.md) (the two rules + every hook defined) · [useEffectDeepDive.md](useEffectDeepDive.md) · [useReducer.md](useReducer.md) · [MemoUseMemoUseCallback.md](MemoUseMemoUseCallback.md) · [CustomHooks.md](CustomHooks.md)

## 1. What is a Hook?

**Definition:** A Hook is a special function that lets a **functional component** use React features such as state, lifecycle and context. Every hook's name starts with `use`.

**Why hooks exist:** before React 16.8, only class components could hold state or run lifecycle code. Hooks gave those abilities to plain functions, and made logic reusable through custom hooks.

**The two rules (must never be broken):**
1. Call hooks only at the **top level** — never inside a condition, loop, or after an early return.
2. Call hooks only from a **React component** or another **custom hook**.

React identifies hooks by their **call order**, which is why the order must be identical on every render.

---

## 2. `useState` — component state

**Definition:** `useState(initialValue)` declares a state variable. It returns an array with two items: the current value, and a setter function. Calling the setter schedules a re-render.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  //     ↑ value  ↑ setter      ↑ initial value

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Functional updates — the important one

**Definition:** Passing a **function** to the setter gives you the guaranteed-latest value. Use it whenever the new state depends on the previous state.

```jsx
// ❌ WRONG - all three read the same stale "count"
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);
// Result: count increases by 1, not 3

// ✅ CORRECT - each receives the latest value
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
// Result: count increases by 3
```

### Why state updates look "asynchronous"

**Definition of batching:** React groups multiple state updates that happen in the same event into a **single** re-render, for performance. This is why reading state immediately after setting it gives the old value.

```jsx
const handleClick = () => {
  setCount(count + 1);
  console.log(count);     // still the OLD value - the re-render has not happened yet
};
```

### Lazy initial state

**Definition:** Passing a **function** as the initial value makes React run it only on the **first** render. Use it when computing the initial value is expensive.

```jsx
// ❌ heavyCalculation() runs on EVERY render, and the result is thrown away
const [data, setData] = useState(heavyCalculation());

// ✅ runs only once, on mount
const [data, setData] = useState(() => heavyCalculation());

// Very common with localStorage
const [theme, setTheme] = useState(() => localStorage.getItem("theme") ?? "light");
```

### State must be updated immutably

**Definition:** React compares the **reference** of the old and new state. Mutating an object or array keeps the same reference, so React sees no change and skips the re-render.

```jsx
// ❌ Mutation - no re-render
items.push(newItem);
setItems(items);

// ✅ New reference - re-renders correctly
setItems([...items, newItem]);
setUser({ ...user, age: 26 });
setUser({ ...user, address: { ...user.address, city: "Mumbai" } });  // nested
```

---

## 3. `useRef` — values that survive renders

**Definition:** `useRef(initialValue)` returns a mutable object shaped `{ current: value }`. The object stays the **same** across every render, and changing `.current` does **not** trigger a re-render.

### Use 1 — accessing a DOM element

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();      // focus the input on mount
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

```jsx
// Other DOM uses
inputRef.current.value;
divRef.current.scrollIntoView({ behavior: "smooth" });
videoRef.current.play();
divRef.current.getBoundingClientRect();
```

### Use 2 — storing a value without re-rendering

```jsx
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);       // holds the timer id between renders

  const start = () => {
    if (intervalRef.current) return;      // already running
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => stop, []);              // cleanup on unmount

  return <button onClick={start}>{seconds}s</button>;
}
```

```jsx
// Counting renders without causing more renders
const renderCount = useRef(0);
renderCount.current++;

// Remembering the previous value
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;      // returns the value from the PREVIOUS render
}
```

### `useState` vs `useRef`

| Point | `useState` | `useRef` |
|---|---|---|
| Triggers a re-render | ✅ Yes | ❌ No |
| Value survives renders | ✅ Yes | ✅ Yes |
| Read during render | ✅ Safe | ⚠️ Avoid (not render-safe) |
| Updated | Asynchronously (batched) | Immediately |
| Use for | Anything shown in the UI | DOM nodes, timer ids, previous values |

**The rule:** if changing the value should update the screen, use `useState`. If it should not, use `useRef`.

---

## 4. `useContext` — shared data without prop drilling

**Definition of prop drilling:** Passing props down through many intermediate components that do not use them, just to reach a deep child.

**Definition of `useContext`:** A hook that reads the current value from a React Context, letting any component at any depth access shared data directly.

```jsx
import { createContext, useContext, useState, useMemo } from "react";

// 1. Create the context
const ThemeContext = createContext(null);

// 2. Provide a value
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // useMemo keeps the value reference stable, so consumers do not
  // re-render on every provider render
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// 3. A custom hook for clean access + a helpful error
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

// 4. Use it anywhere below the provider
function Button() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme("dark")}>Theme: {theme}</button>;
}
```

**The performance catch:** every component calling `useContext` re-renders whenever the context **value** changes — even if it only uses one field. Fix it by memoizing the value and splitting large contexts into smaller ones.

---

## 5. Every built-in hook at a glance

| Hook | Definition | Detail file |
|---|---|---|
| `useState` | Adds state to a component | this file |
| `useReducer` | State via dispatched actions and a reducer | [useReducer.md](useReducer.md) |
| `useEffect` | Side effects after the browser paints | [useEffectDeepDive.md](useEffectDeepDive.md) |
| `useLayoutEffect` | Side effects **before** paint (avoids flicker) | [useEffectDeepDive.md](useEffectDeepDive.md) |
| `useInsertionEffect` | Runs before DOM changes; for CSS-in-JS libraries | — |
| `useContext` | Reads a context value | this file |
| `useRef` | Mutable value that does not re-render | this file |
| `useImperativeHandle` | Controls what a parent's ref receives | — |
| `useMemo` | Caches a computed **value** | [MemoUseMemoUseCallback.md](MemoUseMemoUseCallback.md) |
| `useCallback` | Caches a **function** reference | [MemoUseMemoUseCallback.md](MemoUseMemoUseCallback.md) |
| `useTransition` | Marks an update as non-urgent | [PerformanceOptimization.md](PerformanceOptimization.md) |
| `useDeferredValue` | A lagging copy of a value | [PerformanceOptimization.md](PerformanceOptimization.md) |
| `useId` | A stable unique id for accessibility attributes | — |
| `useSyncExternalStore` | Subscribes to an external store safely | — |
| `useDebugValue` | Labels a custom hook in DevTools | — |
| `useActionState` | Manages a form action's state and pending flag | [ServerComponents.md](ServerComponents.md) |
| `useFormStatus` | Reads the parent form's pending state | [ServerComponents.md](ServerComponents.md) |
| `useOptimistic` | Shows a predicted result while an action runs | [ServerComponents.md](ServerComponents.md) |
| `use` | Reads a Promise or Context (can be conditional) | [ServerComponents.md](ServerComponents.md) |

---

## 6. The three most common hook mistakes

```jsx
// 1. Stale closure - missing dependency
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []);                              // ❌ always logs the first count
// ✅ Fix: add [count], or use a functional update

// 2. Object dependency recreated every render → infinite loop
const options = { page: 1 };
useEffect(() => { fetchData(options); }, [options]);   // ❌ new object each render
const options = useMemo(() => ({ page }), [page]);     // ✅ stable

// 3. Conditional hook
if (isLoggedIn) {
  const [user] = useState(null);     // ❌ breaks the call order
}
```

---

## Key points

- Hooks let functional components use state, lifecycle and context; names start with `use`.
- `useState` returns `[value, setter]`; use a **functional update** when the new value depends on the old.
- State updates are **batched**, so reading state right after setting it gives the old value.
- State must be updated **immutably** or React will not re-render.
- `useRef` persists a value across renders **without** re-rendering — for DOM nodes, timer ids and previous values.
- `useContext` removes prop drilling, but memoize the provider value to avoid extra re-renders.
- Never call hooks conditionally — React tracks them by call order.
