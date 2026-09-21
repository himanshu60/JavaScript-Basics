# React Hooks - Rules and All Built-in Hooks

## 1. What is a Hook?

**Definition:** A Hook is a special function provided by React that lets you "hook into" React features — like state, lifecycle and context — from inside a **functional component**. Every hook name starts with the word `use`.

**In simple words:** Before Hooks, only class components could have state and lifecycle methods. Hooks gave those powers to simple functions.

**Why Hooks were introduced:**
- Class components required `this`, binding and lots of boilerplate.
- Related logic was split across different lifecycle methods.
- Reusing stateful logic needed complicated patterns (HOCs, render props).
- Hooks let you extract and share logic as simple **custom hooks**.

---

## 2. The Rules of Hooks

There are only **two rules**, but breaking them causes very confusing bugs.

### Rule 1 — Only call Hooks at the top level

**Definition:** Never call a Hook inside a loop, condition, or nested function. Hooks must be called in **exactly the same order on every render**.

**Why:** React does not know hook *names* — it tracks them by **call order**. It keeps an internal list: "first hook = state A, second hook = state B". If the order changes between renders, React hands back the wrong values.

```jsx
// ❌ WRONG - conditional hook
function Bad({ isLoggedIn }) {
  if (isLoggedIn) {
    const [user, setUser] = useState(null);   // sometimes called, sometimes not
  }
  const [count, setCount] = useState(0);      // its position shifts!
}

// ✅ CORRECT - hook always called, condition inside
function Good({ isLoggedIn }) {
  const [user, setUser] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isLoggedIn) fetchUser();    // put the condition INSIDE the hook
  }, [isLoggedIn]);
}

// ❌ WRONG - hook in a loop
items.forEach(() => { const [x] = useState(0); });

// ❌ WRONG - hook after an early return
function Bad2({ data }) {
  if (!data) return null;          // return before the hook
  const [state] = useState();      // sometimes never reached
}
```

### Rule 2 — Only call Hooks from React functions

**Definition:** Hooks can only be called from inside a React **functional component** or from another **custom hook**. Never from a plain JavaScript function, a class, or an event handler.

```jsx
// ❌ WRONG - plain function
function calculateTotal() {
  const [total] = useState(0);
}

// ❌ WRONG - inside an event handler
function Component() {
  const handleClick = () => {
    const [x] = useState(0);   // not allowed
  };
}

// ✅ CORRECT - custom hook (name starts with "use")
function useTotal() {
  const [total, setTotal] = useState(0);
  return { total, setTotal };
}
```

> The **ESLint plugin `eslint-plugin-react-hooks`** automatically catches both rule violations. Always keep it enabled.

---

## 3. All built-in Hooks (each one defined)

### State Hooks

**`useState(initialValue)`**
**Definition:** Declares a state variable in a component. Returns an array with the current value and a setter function. Updating it triggers a re-render.

```jsx
const [count, setCount] = useState(0);
setCount(count + 1);
setCount((prev) => prev + 1);    // functional update - safer
```

**`useReducer(reducer, initialState)`**
**Definition:** An alternative to `useState` for complex state logic. You dispatch actions and a reducer function decides the next state.

```jsx
const [state, dispatch] = useReducer(reducer, { count: 0 });
dispatch({ type: "increment" });
```

---

### Effect Hooks

**`useEffect(fn, deps)`**
**Definition:** Runs a side effect **after** the browser has painted the screen. Used for data fetching, subscriptions, timers and manual DOM changes.

```jsx
useEffect(() => {
  document.title = `Count: ${count}`;
  return () => { /* cleanup runs before the next effect and on unmount */ };
}, [count]);
```

**`useLayoutEffect(fn, deps)`**
**Definition:** The same as `useEffect`, but it runs **synchronously before** the browser paints. Used when you must measure or change the DOM before the user sees it, to avoid a visual flicker.

**`useInsertionEffect(fn, deps)`**
**Definition:** Runs before any DOM changes. Meant only for CSS-in-JS libraries that need to inject `<style>` tags.

---

### Context Hook

**`useContext(MyContext)`**
**Definition:** Reads the current value from a React Context, letting a deeply nested component access shared data without prop drilling.

```jsx
const theme = useContext(ThemeContext);
```

---

### Ref Hooks

**`useRef(initialValue)`**
**Definition:** Creates a mutable object `{ current: value }` that **survives re-renders** but does **not** trigger a re-render when changed. Used for DOM access and for storing values between renders.

```jsx
const inputRef = useRef(null);
inputRef.current.focus();

const renderCount = useRef(0);
renderCount.current++;         // changing this does NOT re-render
```

**`useImperativeHandle(ref, createHandle, deps)`**
**Definition:** Customises what a parent receives when it attaches a ref to your component — lets you expose only specific methods.

```jsx
useImperativeHandle(ref, () => ({
  focus: () => inputRef.current.focus(),
  clear: () => setValue(""),
}));
```

---

### Performance Hooks

**`useMemo(fn, deps)`**
**Definition:** Caches the **result of a calculation** between renders and only recomputes it when a dependency changes.

```jsx
const sorted = useMemo(() => items.sort(compareFn), [items]);
```

**`useCallback(fn, deps)`**
**Definition:** Caches a **function definition** between renders so its reference stays the same, which prevents unnecessary re-renders of memoized children.

```jsx
const handleClick = useCallback(() => doSomething(id), [id]);
```

**`useTransition()`**
**Definition:** Marks a state update as **non-urgent**, so React can keep the UI responsive while a slow update renders in the background. Returns `[isPending, startTransition]`.

```jsx
const [isPending, startTransition] = useTransition();
startTransition(() => setSearchQuery(input));  // low priority update
```

**`useDeferredValue(value)`**
**Definition:** Returns a delayed copy of a value, letting the urgent UI update immediately while the expensive part catches up later.

```jsx
const deferredQuery = useDeferredValue(query);
```

---

### Other Hooks

**`useId()`**
**Definition:** Generates a unique, stable ID that matches between the server and the client. Used for accessibility attributes, never for list keys.

```jsx
const id = useId();
<label htmlFor={id}>Name</label>
<input id={id} />
```

**`useSyncExternalStore(subscribe, getSnapshot)`**
**Definition:** Subscribes a component to an external (non-React) data store, in a way that is safe with concurrent rendering. Used by state libraries like Zustand and Redux.

**`useDebugValue(value)`**
**Definition:** Shows a label for a custom hook inside React DevTools. Only for debugging.

**`useOptimistic(state, updateFn)`**
**Definition:** Shows an optimistic (predicted) result immediately while the real async action is still running, then reconciles with the real result.

**`useActionState(action, initialState)`**
**Definition:** Manages the state of a form action, including pending status and the returned result.

**`useFormStatus()`**
**Definition:** Gives the pending status of the parent `<form>`, so a submit button can disable itself while submitting.

---

## 4. Hook categories - summary table

| Category | Hooks | Purpose |
|---|---|---|
| **State** | `useState`, `useReducer` | Store data that changes over time |
| **Effect** | `useEffect`, `useLayoutEffect`, `useInsertionEffect` | Run side effects |
| **Context** | `useContext` | Read shared data without prop drilling |
| **Ref** | `useRef`, `useImperativeHandle` | Access the DOM, keep values without re-rendering |
| **Performance** | `useMemo`, `useCallback`, `useTransition`, `useDeferredValue` | Avoid unnecessary work |
| **Utility** | `useId`, `useDebugValue`, `useSyncExternalStore` | Miscellaneous |
| **Form (React 19)** | `useActionState`, `useFormStatus`, `useOptimistic` | Form and async action handling |

---

## 5. What is a Custom Hook?

**Definition:** A custom hook is a normal JavaScript function whose name starts with `use` and which calls other hooks inside it. It is the standard way to **extract and reuse stateful logic** between components.

```jsx
// Custom hook - reusable logic
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}

// Used in any component
function Modal() {
  const [isOpen, toggleOpen] = useToggle();
  return <button onClick={toggleOpen}>{isOpen ? "Close" : "Open"}</button>;
}
```

**Important:** custom hooks share **logic**, not **state**. Two components using `useToggle()` each get their own separate state.

---

## 6. Common hook mistakes

```jsx
// 1. Missing dependencies → stale values
useEffect(() => {
  console.log(count);     // always logs the first value
}, []);                   // ❌ count is missing from the array

// 2. Missing cleanup → memory leak
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);    // ✅ always clean up
}, []);

// 3. Object/array dependency recreated every render → infinite loop
useEffect(() => { fetchData(options); }, [options]);  // ❌ new object each render
const options = useMemo(() => ({ page }), [page]);    // ✅ stable reference

// 4. Updating state directly by mutation
items.push(newItem); setItems(items);       // ❌ same reference, no re-render
setItems([...items, newItem]);              // ✅

// 5. Stale closure in an interval
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);  // ❌ stale count
  const id2 = setInterval(() => setCount((c) => c + 1), 1000); // ✅ functional update
  return () => clearInterval(id);
}, []);
```

---

## Key points

- Hooks let functional components use state, lifecycle and context.
- **Rule 1:** call hooks only at the top level — never in conditions, loops or after early returns.
- **Rule 2:** call hooks only from components or other custom hooks.
- React identifies hooks by **call order**, which is why the rules exist.
- Always keep `eslint-plugin-react-hooks` enabled.
- Custom hooks reuse **logic**, not state.
