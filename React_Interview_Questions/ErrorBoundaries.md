# Error Boundaries in React

## 1. What is an Error Boundary?

**Definition:** An Error Boundary is a React **class component** that catches JavaScript errors thrown anywhere in its child component tree, logs them, and displays a fallback UI instead of crashing the whole application.

**In simple words:** It is a `try/catch` block for a part of your React UI. If one section breaks, the rest of the app keeps working.

**Why it matters:** Since React 16, an uncaught error during rendering **unmounts the entire component tree** — the user sees a completely blank white screen. An Error Boundary prevents that.

---

## 2. What errors does it catch?

**It CATCHES errors in:**
- Rendering (anything inside the component function / `render()`)
- Lifecycle methods
- Constructors of the whole tree below it

**It does NOT catch errors in:**

| Not caught | Why / what to do instead |
|---|---|
| **Event handlers** | They run outside rendering — use `try/catch` inside the handler |
| **Asynchronous code** (`setTimeout`, promises, `async`) | The error happens after rendering finished — use `.catch()` or `try/catch` |
| **Server-side rendering** | Handle it on the server |
| **Errors inside the boundary itself** | A boundary cannot catch its own errors — nest another one above it |

```jsx
// ❌ NOT caught by an error boundary
function Component() {
  const handleClick = () => {
    throw new Error("Boom");   // event handler - use try/catch
  };

  useEffect(() => {
    fetchData().then(() => { throw new Error("Boom"); });  // async - use .catch()
  }, []);
}

// ✅ Handle these yourself
const handleClick = () => {
  try {
    riskyOperation();
  } catch (err) {
    setError(err);      // then render the error from state → a boundary CAN catch that
  }
};
```

---

## 3. How to create an Error Boundary

**Definition:** A component becomes an Error Boundary by defining one or both of these two lifecycle methods. **This must be a class component** — there is no hook equivalent yet.

**`static getDerivedStateFromError(error)`**
**Definition:** A static method called during the render phase when a child throws. It must return a state update object, which is used to render the fallback UI. Side effects are not allowed here.

**`componentDidCatch(error, errorInfo)`**
**Definition:** Called during the commit phase after an error. This is where you perform side effects like logging the error to a reporting service. `errorInfo.componentStack` tells you which components were involved.

```jsx
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Step 1: update state so the next render shows the fallback
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Step 2: log the error somewhere
  componentDidCatch(error, errorInfo) {
    console.error("Caught by boundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
    // logToService(error, errorInfo);   // Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="error-box">
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={this.handleReset}>Try again</button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## 4. How to use it

```jsx
// Wrap the whole app - the last line of defence
<ErrorBoundary fallback={<GlobalErrorPage />}>
  <App />
</ErrorBoundary>
```

**Better: place several small boundaries so one broken widget does not take down the page.**

```jsx
function Dashboard() {
  return (
    <div className="dashboard">
      <ErrorBoundary fallback={<p>Chart failed to load</p>}>
        <SalesChart />
      </ErrorBoundary>

      <ErrorBoundary fallback={<p>Feed failed to load</p>}>
        <ActivityFeed />
      </ErrorBoundary>

      <ErrorBoundary fallback={<p>Stats failed to load</p>}>
        <StatsPanel />
      </ErrorBoundary>
    </div>
  );
}
// If the chart crashes, the feed and stats still work perfectly.
```

**Granularity guidance:**

| Level | What it protects |
|---|---|
| App root | Catches everything — shows a full error page |
| Route/page | One broken page, the navbar and layout survive |
| Widget/section | One broken widget, the rest of the page survives |

---

## 5. Resetting a boundary with `key`

**Definition:** Changing a component's `key` makes React unmount the old instance and mount a fresh one, which resets the boundary's error state. This is the cleanest way to recover.

```jsx
function App() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <ErrorBoundary key={resetKey} onReset={() => setResetKey((k) => k + 1)}>
      <RiskyComponent />
    </ErrorBoundary>
  );
}

// Also useful: reset automatically when the route changes
<ErrorBoundary key={location.pathname}>
  <PageContent />
</ErrorBoundary>
```

---

## 6. Using the `react-error-boundary` library

**Definition:** A small, popular library that provides a ready-made boundary with reset support and a `useErrorBoundary` hook for triggering errors from async code.

```jsx
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary
  FallbackComponent={Fallback}
  onReset={() => window.location.reload()}
  onError={(error, info) => logToService(error, info)}
>
  <App />
</ErrorBoundary>
```

**Catching async errors with the hook:**

```jsx
function DataComponent() {
  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    fetchData().catch((err) => showBoundary(err));   // pushes async errors to the boundary
  }, []);
}
```

---

## 7. Error Boundaries and Suspense together

**Definition:** `Suspense` handles the **loading** state; an Error Boundary handles the **error** state. Together they cover both failure modes of async UI.

```jsx
<ErrorBoundary fallback={<p>Failed to load</p>}>
  <Suspense fallback={<Spinner />}>
    <LazyComponent />
  </Suspense>
</ErrorBoundary>
```

The Error Boundary must be **outside** the Suspense boundary, so it can catch errors thrown while loading.

---

## 8. Best practices

| Practice | Why |
|---|---|
| Use **multiple small boundaries** | One broken widget should not kill the page |
| Always **log** the error | `componentDidCatch` is the place for Sentry/LogRocket |
| Give a **recovery action** | A "Try again" or "Reload" button |
| Keep the fallback **simple** | If the fallback itself crashes, nothing can save it |
| Do not use it for **expected** errors | A failed API call should be normal state, not a thrown error |
| Remember **event handlers need try/catch** | Boundaries do not catch them |

---

## Key points

- An Error Boundary must be a **class component** with `getDerivedStateFromError` and/or `componentDidCatch`.
- It catches errors in **rendering and lifecycle**, not in event handlers or async code.
- Without one, a render error blanks the entire app.
- Place several small boundaries rather than one big one.
- Reset it by changing its `key` or by using `react-error-boundary`.
- Pair it with `Suspense`: Suspense for loading, boundary for errors.
