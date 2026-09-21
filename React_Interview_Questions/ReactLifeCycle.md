# React Component Lifecycle

## 1. What is the Component Lifecycle?

**Definition:** The lifecycle is the series of phases a React component goes through from the moment it is created, through every update, until it is removed from the screen. React provides ways to run your code at each phase.

**The three phases:**

| Phase | Definition | When it happens |
|---|---|---|
| **Mounting** | The component is created and inserted into the DOM | The first time it appears on screen |
| **Updating** | The component re-renders because state or props changed | Every time its data changes |
| **Unmounting** | The component is removed from the DOM | When it disappears from the screen |

```
MOUNTING  →  UPDATING (many times)  →  UNMOUNTING
  born          changes                  removed
```

---

## 2. Class component lifecycle methods

**Definition:** In class components, each phase has named methods that React calls automatically.

### Mounting phase

**`constructor(props)`**
**Definition:** Runs first, when the component instance is created. Used to set the initial state and bind methods. Never call `setState` here.

**`static getDerivedStateFromProps(props, state)`**
**Definition:** Runs before every render (mount and update). Returns an object to update state from props, or `null`. Rarely needed.

**`render()`**
**Definition:** The only **required** method. It reads `this.props` and `this.state` and returns JSX. It must be **pure** — no side effects, no state changes, no API calls.

**`componentDidMount()`**
**Definition:** Runs once, immediately after the component is inserted into the DOM. This is the correct place for API calls, subscriptions, timers and DOM measurements.

```jsx
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: null, loading: true };
  }

  componentDidMount() {
    fetch(`/api/users/${this.props.id}`)
      .then((r) => r.json())
      .then((user) => this.setState({ user, loading: false }));
  }

  render() {
    if (this.state.loading) return <Spinner />;
    return <h1>{this.state.user.name}</h1>;
  }
}
```

### Updating phase

**`shouldComponentUpdate(nextProps, nextState)`**
**Definition:** Returns `true` or `false` to allow or skip the re-render. Used for performance optimisation. `React.PureComponent` does a shallow comparison automatically.

**`render()`** — runs again with the new data.

**`getSnapshotBeforeUpdate(prevProps, prevState)`**
**Definition:** Runs right before the DOM is updated, letting you capture information (like scroll position) that will be passed to `componentDidUpdate`.

**`componentDidUpdate(prevProps, prevState, snapshot)`**
**Definition:** Runs after every update (but not after the first mount). Used for side effects that depend on changed props or state.

```jsx
componentDidUpdate(prevProps) {
  // ⚠️ The comparison is essential - without it this loops forever
  if (prevProps.userId !== this.props.userId) {
    this.fetchUser(this.props.userId);
  }
}
```

### Unmounting phase

**`componentWillUnmount()`**
**Definition:** Runs immediately before the component is removed. This is where you **clean up** — clear timers, remove event listeners, cancel requests and unsubscribe.

```jsx
componentWillUnmount() {
  clearInterval(this.timerId);
  window.removeEventListener("resize", this.handleResize);
  this.subscription.unsubscribe();
}
```

### Error handling

**`static getDerivedStateFromError(error)`** — updates state to show a fallback UI.
**`componentDidCatch(error, errorInfo)`** — logs the error. Together these make an [Error Boundary](ErrorBoundaries.md).

---

## 3. The complete order

```
── MOUNTING ────────────────────────────
constructor()
getDerivedStateFromProps()
render()
   → React updates the DOM
componentDidMount()

── UPDATING (state/props change) ───────
getDerivedStateFromProps()
shouldComponentUpdate()        → false stops here
render()
getSnapshotBeforeUpdate()
   → React updates the DOM
componentDidUpdate()

── UNMOUNTING ──────────────────────────
componentWillUnmount()
   → React removes the DOM node
```

---

## 4. The same lifecycle with Hooks

**Definition:** Functional components have no lifecycle methods. `useEffect` covers all three phases, controlled by its dependency array and its cleanup function.

| Class method | Hook equivalent |
|---|---|
| `constructor` | `useState(initialValue)` |
| `componentDidMount` | `useEffect(fn, [])` |
| `componentDidUpdate` | `useEffect(fn, [deps])` |
| `componentWillUnmount` | The cleanup function returned from `useEffect` |
| `shouldComponentUpdate` | `React.memo(Component)` |
| `getSnapshotBeforeUpdate` | `useLayoutEffect` |
| `getDerivedStateFromError` | Still needs a class Error Boundary |

### Mount only

```jsx
useEffect(() => {
  console.log("Mounted - runs once");
}, []);                          // empty array = mount only
```

### On update of specific values

```jsx
useEffect(() => {
  fetchUser(userId);
}, [userId]);                    // runs on mount AND whenever userId changes
```

> Note the difference from `componentDidUpdate`: the hook also runs on mount, which is usually what you actually want — so you no longer need the `if (prevProps.x !== this.props.x)` check.

### Unmount cleanup

```jsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  window.addEventListener("resize", handleResize);

  return () => {                 // ← this is componentWillUnmount
    clearInterval(id);
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

### All three in one component

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { setUser(data); setLoading(false); })
      .catch((err) => { if (err.name !== "AbortError") console.error(err); });

    return () => controller.abort();   // cleanup: runs before the next effect AND on unmount
  }, [userId]);                        // mount + whenever userId changes

  if (loading) return <Spinner />;
  return <h1>{user.name}</h1>;
}
```

This one hook replaces `componentDidMount`, `componentDidUpdate` **and** `componentWillUnmount` — and keeps all the related logic together instead of splitting it across three methods.

---

## 5. Cleanup timing — the part people get wrong

**Definition:** The cleanup function runs **twice over** in an update cycle: before the effect runs again, and once more when the component unmounts.

```jsx
function Demo({ id }) {
  useEffect(() => {
    console.log("effect for", id);
    return () => console.log("cleanup for", id);
  }, [id]);
}

// id changes from 1 to 2:
// "cleanup for 1"     ← old effect is cleaned up FIRST
// "effect for 2"      ← then the new effect runs

// Component unmounts:
// "cleanup for 2"
```

This is what prevents duplicate subscriptions and stale timers.

---

## 6. Strict Mode double-invocation

**Definition:** In development, `<StrictMode>` deliberately mounts a component, runs its effects, cleans them up, and runs them again — to expose effects that are missing cleanup.

```
Development with StrictMode:  effect → cleanup → effect
Production:                   effect
```

**This is not a bug.** If double-running breaks your code, the effect is missing a cleanup function. Never "fix" it by removing Strict Mode.

---

## 7. Why hooks replaced lifecycle methods

**The problem with class lifecycles:** related logic was **split across** methods, while unrelated logic was **mixed together** in the same method.

```jsx
// ❌ Class - one feature spread over three methods
componentDidMount() {
  this.fetchData();                                      // feature A
  window.addEventListener("resize", this.handleResize);  // feature B
}
componentDidUpdate(prevProps) {
  if (prevProps.id !== this.props.id) this.fetchData();  // feature A again
}
componentWillUnmount() {
  window.removeEventListener("resize", this.handleResize); // feature B again
}
```

```jsx
// ✅ Hooks - each feature is self-contained
useEffect(() => { fetchData(id); }, [id]);              // feature A, all in one place

useEffect(() => {                                        // feature B, all in one place
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

**Other benefits:** no `this` binding confusion, far less boilerplate, and logic can be extracted into reusable [custom hooks](CustomHooks.md).

---

## Key points

- Three phases: **Mounting → Updating → Unmounting**.
- `render()` must be **pure**; side effects belong in `componentDidMount`/`componentDidUpdate` or `useEffect`.
- `componentWillUnmount` / the effect cleanup prevents memory leaks — never skip it.
- `useEffect(fn, [])` = mount; `useEffect(fn, [deps])` = mount + update; the returned function = unmount.
- Cleanup runs **before the next effect** as well as on unmount.
- Strict Mode double-runs effects in development on purpose, to reveal missing cleanup.
- Hooks group logic **by feature** instead of splitting it across lifecycle methods.
