# HOC, Render Props and Compound Components

These are the three classic **patterns for reusing logic** in React. Hooks have replaced most of their uses, but they appear constantly in existing codebases and in interviews.

---

# PART 1 — Higher-Order Components (HOC)

## 1. What is a Higher-Order Component?

**Definition:** A Higher-Order Component is a **function that takes a component as an argument and returns a new component** with extra props or behaviour added. It is not a React feature — it is a pattern built on normal JavaScript function composition.

**In simple words:** An HOC is a wrapper that gives a component extra powers without changing the component's own code.

```jsx
const EnhancedComponent = withSomething(OriginalComponent);
```

**Naming convention:** HOC names start with `with` — `withAuth`, `withTheme`, `withRouter`.

---

## 2. Basic HOC example

```jsx
function withLoading(WrappedComponent) {
  // Return a NEW component
  return function WithLoadingComponent({ isLoading, ...props }) {
    if (isLoading) return <Spinner />;
    return <WrappedComponent {...props} />;
  };
}

// Usage
const UserListWithLoading = withLoading(UserList);

<UserListWithLoading isLoading={loading} users={users} />
```

---

## 3. Real HOC examples

### a) `withAuth` — protect a route

```jsx
function withAuth(WrappedComponent) {
  return function ProtectedComponent(props) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading && !user) navigate("/login");
    }, [user, loading, navigate]);

    if (loading) return <Spinner />;
    if (!user) return null;

    return <WrappedComponent {...props} user={user} />;
  };
}

const ProtectedDashboard = withAuth(Dashboard);
```

### b) `withErrorHandling`

```jsx
function withErrorHandling(WrappedComponent) {
  return function WithError({ error, ...props }) {
    if (error) return <ErrorMessage message={error.message} />;
    return <WrappedComponent {...props} />;
  };
}
```

### c) Composing multiple HOCs

```jsx
const Enhanced = withAuth(withLoading(withTheme(Dashboard)));

// Cleaner with a compose helper
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);
const Enhanced = compose(withAuth, withLoading, withTheme)(Dashboard);
```

---

## 4. HOC rules and problems

| Rule | Why |
|---|---|
| **Do not mutate** the wrapped component | Compose it, do not modify it |
| **Pass through all props** with `{...props}` | Otherwise the inner component loses its props |
| **Copy static methods** | They are lost when wrapping (use the `hoist-non-react-statics` package) |
| **Forward refs** | Refs do not pass through automatically — use `React.forwardRef` |
| **Do not create HOCs inside render** | It remounts the entire subtree on every render |
| **Set a display name** | Otherwise DevTools shows `Unknown` |

```jsx
function withX(Wrapped) {
  function WithX(props) { return <Wrapped {...props} />; }
  WithX.displayName = `withX(${Wrapped.displayName || Wrapped.name})`;  // ✅
  return WithX;
}

// ❌ NEVER do this - a new component type every render = full remount
function Parent() {
  const Enhanced = withAuth(Dashboard);
  return <Enhanced />;
}
```

**The biggest HOC problem — "wrapper hell":**

```jsx
<withRouter(withTheme(withAuth(withLoading(MyComponent))))>
// DevTools becomes an unreadable stack of wrappers,
// and you cannot tell which HOC provided which prop.
```

---

# PART 2 — Render Props

## 5. What is a Render Prop?

**Definition:** A render prop is a prop whose **value is a function that returns JSX**. The component with the render prop owns the logic and state, and calls that function to let the parent decide what to display.

**In simple words:** "I will handle the logic, you tell me what to draw with the result."

```jsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return render(position);     // hand the state to the caller
}

// Usage - the same logic, different UI each time
<MouseTracker render={({ x, y }) => <h1>Mouse at {x}, {y}</h1>} />
<MouseTracker render={({ x, y }) => <Cat x={x} y={y} />} />
```

---

## 6. The children-as-a-function variation

**Definition:** Instead of a prop called `render`, you pass the function as `children`. This is the more popular form and reads more naturally.

```jsx
function DataFetcher({ url, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return children({ data, loading, error });
}

// Usage
<DataFetcher url="/api/users">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error.message} />;
    return <UserList users={data} />;
  }}
</DataFetcher>
```

**Libraries that famously used this pattern:** React Router v5 (`<Route render={...}>`), Formik, Downshift, React Motion.

---

# PART 3 — Custom Hooks (the modern replacement)

## 7. Why Hooks replaced both patterns

**Definition:** A custom hook achieves the same logic reuse as an HOC or a render prop, but **without adding any component to the tree** — so there is no wrapper hell and no nesting.

```jsx
// Same mouse logic as a custom hook
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return position;
}

// Usage - flat, readable, no nesting at all
function App() {
  const { x, y } = useMousePosition();
  return <h1>Mouse at {x}, {y}</h1>;
}
```

### The nesting problem, side by side

```jsx
// ❌ Render props - "callback pyramid"
<AuthProvider>
  {(user) => (
    <ThemeProvider>
      {(theme) => (
        <DataFetcher url="/api">
          {({ data }) => <Component user={user} theme={theme} data={data} />}
        </DataFetcher>
      )}
    </ThemeProvider>
  )}
</AuthProvider>

// ✅ Hooks - completely flat
function Component() {
  const user = useAuth();
  const theme = useTheme();
  const { data } = useFetch("/api");
  return <div>...</div>;
}
```

---

## 8. Comparison table

| Point | HOC | Render Props | Custom Hook |
|---|---|---|---|
| **What it is** | Function returning a component | Prop that is a function | Function calling hooks |
| **Adds to the tree** | Yes, a wrapper | Yes, a wrapper | **No** |
| **Nesting problem** | Wrapper hell | Callback pyramid | **None** |
| **Where props come from** | Unclear/implicit | Explicit | Explicit |
| **TypeScript support** | Difficult | Moderate | **Easy** |
| **Naming clash risk** | Yes (props can collide) | No | No |
| **Recommended today** | Legacy only | Legacy only | ✅ **Yes** |

---

# PART 4 — Compound Components (still useful)

## 9. What is a Compound Component?

**Definition:** A compound component is a set of components that work together as one unit, sharing implicit state through Context. The parent manages the state; the children read it without props being passed manually.

**In simple words:** Like `<select>` and `<option>` in HTML — they only make sense together, and the parent coordinates them.

```jsx
const TabsContext = createContext();

function Tabs({ children, defaultTab = 0 }) {
  const [active, setActive] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ index, children }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button
      className={active === index ? "active" : ""}
      onClick={() => setActive(index)}
    >
      {children}
    </button>
  );
}

function TabPanel({ index, children }) {
  const { active } = useContext(TabsContext);
  return active === index ? <div className="panel">{children}</div> : null;
}

// Attach them for a clean API
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
```

```jsx
// Usage - flexible and readable
<Tabs defaultTab={0}>
  <Tabs.List>
    <Tabs.Tab index={0}>Profile</Tabs.Tab>
    <Tabs.Tab index={1}>Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel index={0}><Profile /></Tabs.Panel>
  <Tabs.Panel index={1}><Settings /></Tabs.Panel>
</Tabs>
```

**Why this pattern survived:** it gives consumers full control over layout and markup while the parent handles the state. It is how Radix UI, Headless UI and Reach UI are built.

---

## 10. Which pattern should you use today?

| Need | Use |
|---|---|
| Reuse **stateful logic** | ✅ Custom hook |
| Reuse **UI structure** with flexible markup | ✅ Compound components |
| Wrap many components with the same behaviour (auth, analytics) | HOC is still acceptable |
| Working in an **older codebase** | You will meet all of these |

---

## Key points

- **HOC** = a function that takes a component and returns an enhanced component; causes wrapper hell.
- **Render props** = a prop that is a function returning JSX; causes callback pyramids.
- **Custom hooks** replaced both — same reuse, zero extra components.
- **Compound components** use Context to coordinate a group of related components and are still the best pattern for flexible UI libraries.
- Never create an HOC inside a render — it remounts the whole subtree.
