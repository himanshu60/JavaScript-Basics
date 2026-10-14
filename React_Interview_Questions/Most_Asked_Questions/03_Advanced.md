# Most Asked React Questions — Part 3: Advanced (21–30)

[← Part 2: Hooks](02_Hooks.md) · [Back to the list](README.md)

---

## 21. When does a React component re-render?

**Short answer:** A component re-renders (React calls the function again) in **4 cases**:

1. **Its own state changes** — you call `setState` with a new value.
2. **Its parent re-renders** — by default, *every* child re-renders too, even if its props did not change.
3. **A context it reads changes** — any component using `useContext(SomeContext)`.
4. **A custom hook it uses changes its state** — a hook's state belongs to the component.

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Clicked {count}</button>
      <Child />  {/* re-renders on every click, even with no props */}
    </>
  );
}
```

**Common trap:** "A component re-renders when its props change" is only half true. Props can only change *because* the parent re-rendered, and when the parent re-renders, the child re-renders anyway.

**Two things to remember:**

- **Re-render ≠ DOM update.** React re-runs the function, compares the result with the old one, and only touches the real DOM where something changed. Re-renders are usually cheap.
- **Same value = no re-render.** If you set state to the value it already has (`Object.is` check), React skips the re-render.

**How to avoid unnecessary re-renders:** wrap the child in `React.memo` (Q17), keep state close to where it is used (Q28), pass stable props with `useMemo` / `useCallback` (Q16), or let the React Compiler do it.

Deep dive: [Reconciliation-And-Fiber.md](../Reconciliation-And-Fiber.md) · [PerformanceOptimization.md](../PerformanceOptimization.md)

---

## 22. What are lifecycle methods? How do you do them with hooks?

**Short answer:** Every component goes through **3 phases**:

1. **Mounting** — it is added to the screen.
2. **Updating** — it re-renders because its props or state changed.
3. **Unmounting** — it is removed from the screen.

Class components have a method for each phase. In functional components, **one `useEffect`** handles all three.

| Phase | Class method | Hook equivalent |
|---|---|---|
| Mounting | `componentDidMount` | `useEffect(() => {...}, [])` |
| Updating | `componentDidUpdate` | `useEffect(() => {...}, [dep])` |
| Unmounting | `componentWillUnmount` | The cleanup function returned from `useEffect` |
| Skip a re-render | `shouldComponentUpdate` | `React.memo` |
| Catch errors | `componentDidCatch` | No hook — still needs a class (Q26) |

**Example — connect to a chat room, written both ways:**

```jsx
// Class component — logic is split across 3 methods
class ChatRoom extends React.Component {
  componentDidMount() {
    this.connection = connect(this.props.roomId);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.roomId !== this.props.roomId) {
      this.connection.disconnect();
      this.connection = connect(this.props.roomId);
    }
  }

  componentWillUnmount() {
    this.connection.disconnect();
  }

  render() {
    return <h1>Welcome to {this.props.roomId}</h1>;
  }
}

// Functional component — one useEffect does all three
function ChatRoom({ roomId }) {
  useEffect(() => {
    const connection = connect(roomId);    // mount + when roomId changes
    return () => connection.disconnect();  // unmount + before roomId changes
  }, [roomId]);

  return <h1>Welcome to {roomId}</h1>;
}
```

> 💡 **Tip:** Think of `useEffect` as "keep this in sync with these values", not as an exact copy of the class methods.

Deep dive: [ReactLifeCycle.md](../ReactLifeCycle.md)

---

## 23. What is the difference between `useEffect` and `useLayoutEffect`?

**Short answer:** Both run after React updates the DOM. The difference is **timing**:

- `useEffect` runs **after the browser paints** the screen. It doesn't block the screen. Use it for almost everything.
- `useLayoutEffect` runs **after the DOM changes but before the browser paints**. It blocks the screen. Use it only when you must **measure or change the layout** before the user sees it, to avoid a flicker.

```
Render → DOM updated → useLayoutEffect → Browser paints the screen → useEffect
```

**Example — place a tooltip without flicker:**

```jsx
function Tooltip({ targetRect, text }) {
  const ref = useRef(null);
  const [top, setTop] = useState(0);

  useLayoutEffect(() => {
    const height = ref.current.getBoundingClientRect().height;
    setTop(targetRect.top - height); // move it above the target before paint
  }, [targetRect]);

  return (
    <div ref={ref} style={{ position: "absolute", top }}>
      {text}
    </div>
  );
}
```

With `useEffect`, the user could see the tooltip in the wrong place for one frame before it jumps to the right place.

| | `useEffect` | `useLayoutEffect` |
|---|---|---|
| Runs | After paint | Before paint |
| Blocks the screen update | No | Yes |
| Use for | Data fetching, subscriptions, timers, logging | Measuring DOM size or position, stopping flicker |
| How often you'll use it | Almost always | Rarely |

> 💡 **Tip:** Start with `useEffect`. Switch to `useLayoutEffect` only if you see a visual flicker.

Deep dive: [useEffectDeepDive.md](../useEffectDeepDive.md)

---

## 24. Context API vs Redux: when should you use which?

**Short answer:** **Context** is built into React. It is a way to **pass data down** without prop drilling. **Redux** (today, **Redux Toolkit**) is a full **state management library** with one central store, strict update rules, middleware and great DevTools. Use Context for simple data that rarely changes. Use Redux for large apps with complex shared state that changes often.

| | Context API | Redux Toolkit |
|---|---|---|
| Built into React | ✅ Yes | ❌ Separate library |
| Setup | Very little | More (store, slices) |
| Re-renders | Every component using the context re-renders when its value changes | A component re-renders only if the part of the store it selects changes |
| DevTools / time-travel debugging | ❌ | ✅ |
| Middleware (logging, async logic) | ❌ | ✅ |
| Best for | Theme, logged-in user, language | Shopping cart, big forms, complex app-wide state |

**Redux flow:**

```
UI → dispatch(action) → reducer → store updates → UI re-renders
```

**Redux Toolkit example:**

```jsx
// counterSlice.js
import { createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1; // looks like mutation, but Immer keeps it immutable
    },
  },
});

export const { increment } = counterSlice.actions;
export default counterSlice.reducer;
```

```jsx
// Counter.jsx
import { useSelector, useDispatch } from "react-redux";
import { increment } from "./counterSlice";

function Counter() {
  const value = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return <button onClick={() => dispatch(increment())}>{value}</button>;
}
```

(You also create the store with `configureStore` and wrap the app in `<Provider store={store}>`.)

> 💡 **Tip — the modern answer:** **server data** (API results) → TanStack Query or RTK Query. **Simple global UI state** → Context or Zustand. **Large, complex client state** → Redux Toolkit.

Deep dive: [Redux-vs-Context.api.md](../Redux-vs-Context.api.md) · [ReduxToolkit.md](../ReduxToolkit.md)

---

## 25. What is lazy loading and code splitting?

**Short answer:** **Code splitting** breaks your app's JavaScript into smaller files (chunks), so the browser downloads only what it needs. **`React.lazy`** loads a component only when it is first shown, and **`Suspense`** shows a fallback (like "Loading...") while it downloads.

Without it, the user downloads the code for every page — even pages they never open — so the first load is slow.

```jsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Not in the main bundle — downloaded only when first shown
const Dashboard = lazy(() => import("./Dashboard"));
const Settings = lazy(() => import("./Settings"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

**Remember:**

- The lazy-loaded component must be a **default export**.
- Call `lazy()` **outside** the component, at the top of the file.
- Best places to split: **pages/routes**, big modals, charts, rich text editors.
- If loading fails (network error), an **Error Boundary** (Q26) can show a message.

> 💡 **Tip:** Next.js and other frameworks split code by route automatically.

Deep dive: [LazyLoadingSuspense.md](../LazyLoadingSuspense.md)

---

## 26. What is an Error Boundary?

**Short answer:** An Error Boundary is a component that **catches JavaScript errors in its child components while they render** and shows a **fallback UI**, instead of crashing the whole app into a blank white screen.

It must be a **class component** — there is no hook for this.

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true }; // show the fallback on the next render
  }

  componentDidCatch(error, info) {
    console.error("Caught an error:", error, info); // send to Sentry, etc.
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong.</h2>;
    }
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary>
      <ProductList />
    </ErrorBoundary>
  );
}
```

**Error Boundaries do NOT catch:**

| Not caught | What to do instead |
|---|---|
| Errors in **event handlers** (`onClick`) | Use `try/catch` |
| **Async** code (`setTimeout`, promises, `fetch`) | `try/catch` or `.catch()`, then set an error state |
| Errors inside the Error Boundary **itself** | Wrap it in another boundary |
| **Server-side rendering** errors | Handle them on the server |

> 💡 **Tip:** Most teams use the **`react-error-boundary`** package. It gives you a ready-made `<ErrorBoundary fallback={...}>`, so you don't write the class yourself.

Deep dive: [ErrorBoundaries.md](../ErrorBoundaries.md)

---

## 27. What is a Higher-Order Component (HOC)?

**Short answer:** An HOC is a **function that takes a component and returns a new component** with extra features. It's a way to reuse logic by wrapping components.

```jsx
const EnhancedComponent = withSomething(OriginalComponent);
```

**Example — only logged-in users can see a page:**

```jsx
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user } = useAuth(); // your own auth hook

    if (!user) return <p>Please log in.</p>;
    return <Component {...props} user={user} />;
  };
}

function Dashboard({ user }) {
  return <h1>Welcome, {user.name}</h1>;
}

export default withAuth(Dashboard);
```

**HOCs you may have seen:** `React.memo(Component)`, Redux's old `connect()`, React Router's old `withRouter()`.

**Downsides:** "wrapper hell" (many nested wrappers), prop names can clash, and it's hard to tell where a prop came from.

> 💡 **Tip:** Today, **custom hooks** are preferred for sharing logic (`const user = useAuth()` instead of `withAuth`). You should still know HOCs — they appear in older codebases and in interviews.

Deep dive: [HOC-And-RenderProps.md](../HOC-And-RenderProps.md)

---

## 28. How do you optimize the performance of a React app?

**Short answer:** First **measure** with the React DevTools **Profiler** to find what is actually slow, then fix that. The main ideas: avoid unnecessary re-renders, load less code, and render fewer DOM elements.

**Checklist:**

| Problem | Solution |
|---|---|
| A child re-renders when nothing changed | `React.memo` + `useCallback` / `useMemo` |
| A heavy calculation runs on every render | `useMemo` |
| Big JavaScript bundle, slow first load | Code splitting with `React.lazy` + `Suspense` |
| A long list (1,000+ rows) is slow | **Virtualization** with `react-window` or `@tanstack/react-virtual` (renders only the visible rows) |
| State is too high and re-renders the whole page | **Move state down** to the component that uses it |
| A search box calls the API on every key press | **Debounce** the input |
| Typing feels laggy because of a heavy update | `useTransition` / `useDeferredValue` |
| List items keep re-mounting | Use stable, unique `key`s |
| Large images | Lazy-load them (`loading="lazy"`), compress them, use the right size |
| Too much manual memoization | The **React Compiler** does it automatically |

**Example — move state down:**

```jsx
// ❌ Before: every key press re-renders the whole Page, including the slow chart
function Page() {
  const [search, setSearch] = useState("");

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <ExpensiveChart />
    </>
  );
}

// ✅ After: the state lives in its own small component, so ExpensiveChart is not affected
function SearchBox() {
  const [search, setSearch] = useState("");
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}

function Page() {
  return (
    <>
      <SearchBox />
      <ExpensiveChart />
    </>
  );
}
```

> 💡 **Tip:** Interviewers like to hear "**measure first**". Don't add `useMemo` everywhere — fix what the Profiler shows is slow.

Deep dive: [PerformanceOptimization.md](../PerformanceOptimization.md)

---

## 29. Why should you never mutate state directly?

**Short answer:** React decides whether to re-render by checking if the state **reference** changed (`Object.is`). If you change an object or array **in place**, the reference stays the same, so React thinks nothing changed and **skips the re-render**. Always create a **new** object or array.

```jsx
const [todos, setTodos] = useState(["Learn React"]);

// ❌ Wrong — same array, so React doesn't re-render
todos.push("Learn Redux");
setTodos(todos);

// ✅ Right — a new array
setTodos([...todos, "Learn Redux"]);
```

**Cheat sheet:**

| Task | ❌ Mutating | ✅ Immutable |
|---|---|---|
| Add to an array | `arr.push(x)` | `[...arr, x]` |
| Remove from an array | `arr.splice(i, 1)` | `arr.filter((item) => item.id !== id)` |
| Update an item in an array | `arr[i].done = true` | `arr.map((item) => item.id === id ? { ...item, done: true } : item)` |
| Sort an array | `arr.sort()` | `[...arr].sort()` or `arr.toSorted()` |
| Update an object field | `user.name = "Ravi"` | `{ ...user, name: "Ravi" }` |
| Update a nested object | `user.address.city = "Pune"` | `{ ...user, address: { ...user.address, city: "Pune" } }` |

**Other benefits:** `React.memo` and `useMemo` work correctly, bugs are easier to find, and Redux DevTools time-travel works.

> 💡 **Tip:** For deeply nested state, the **Immer** library (built into Redux Toolkit) lets you write "mutating" code safely.

Deep dive: [ReactHooks.md](../ReactHooks.md)

---

## 30. How do you fetch data from an API in React?

**Short answer:** In plain React, fetch inside `useEffect`, save the result in state, and handle **loading**, **error** and **empty** states. Cancel the request in the cleanup function. In real projects, use a library like **TanStack Query** (or a framework like Next.js).

```jsx
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/users", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setUsers(await res.json());
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadUsers();
    return () => controller.abort(); // cancel the request on unmount
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**Why the `AbortController`?** If the effect depends on a value like `userId`, and `userId` changes quickly, an old slow response could arrive last and overwrite the new data. This is a **race condition**. Aborting the old request in the cleanup prevents it.

**With TanStack Query (what most real apps use):**

```jsx
import { useQuery } from "@tanstack/react-query";

function UserList() {
  const { data: users, isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      fetch("https://jsonplaceholder.typicode.com/users").then((res) => res.json()),
  });

  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

It gives you caching, automatic refetching, retries, and loading/error states without writing them yourself.

> 💡 **Tip:** Interviewers look for these 5 things: **loading state, error state, empty state, cleanup / cancel, and a `key` on list items.** Mention all five.

Deep dive: [DataFetchingPatterns.md](../DataFetchingPatterns.md)

---

[← Part 2: Hooks](02_Hooks.md) · [Back to the list](README.md)
