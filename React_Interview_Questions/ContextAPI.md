# The Context API

## 1. What problem does Context solve?

**Definition of Prop Drilling:** Passing props down through many intermediate components that do not use them, purely to reach a deeply nested child.

```jsx
// ❌ "theme" is passed through 3 components that never use it
<App theme={theme}>
  <Layout theme={theme}>
    <Sidebar theme={theme}>
      <Button theme={theme} />     {/* only this one actually needs it */}
```

**Definition of Context:** A way to share values across a component tree **without passing props at every level**. Any component inside the provider can read the value directly.

**In simple words:** Instead of telling each guest the party rules one by one, you put a whiteboard in the middle of the room. Anyone who needs the rules just looks at it.

---

## 2. The three steps

```jsx
import { createContext, useContext, useState, useMemo } from "react";

// 1. CREATE the context
const ThemeContext = createContext(null);

// 2. PROVIDE a value
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // useMemo keeps the object reference stable between renders
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// 3. CONSUME it - a custom hook gives a clean API and a helpful error
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
```

```jsx
// Usage anywhere below the provider, at any depth
function Button() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme("dark")}>Theme: {theme}</button>;
}
```

> **Always wrap `useContext` in a custom hook.** It hides the context object, gives autocomplete, and throws a clear error when someone forgets the provider — instead of a confusing `cannot read property of null`.

---

## 3. The performance problem

**Definition:** **Every** component calling `useContext` re-renders whenever the context **value** changes — even if it only uses one field of that value.

**Bug 1 — a new object every render:**

```jsx
// ❌ A brand-new object on every provider render → every consumer re-renders, always
<AuthContext.Provider value={{ user, login, logout }}>

// ✅ Memoized - the reference only changes when the data does
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
<AuthContext.Provider value={value}>
```

**Bug 2 — one big context for everything:**

```jsx
// ❌ A theme change re-renders every component reading user or cart
<AppContext.Provider value={{ user, theme, cart, notifications }}>

// ✅ Split by how often each piece changes
<UserContext.Provider value={user}>
  <ThemeContext.Provider value={theme}>
    <CartContext.Provider value={cart}>
```

**Bug 3 — state and dispatch together:**

```jsx
// ✅ Components that only dispatch never re-render, because dispatch is stable
<StateContext.Provider value={state}>
  <DispatchContext.Provider value={dispatch}>
```

---

## 4. Context is not a state manager

**Definition:** Context is a **transport mechanism** — it moves a value down the tree. It does not manage, update or optimise state. The state itself still lives in `useState` or `useReducer`.

```jsx
// Context + useReducer = a lightweight state manager
function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  // useReducer holds the state; Context just delivers it
}
```

---

## 5. When to use Context — and when not to

**Good fits** — data that is genuinely global and changes **rarely**:

| Use case | Why |
|---|---|
| Theme (light/dark) | Changes rarely, needed everywhere |
| Current user / auth | Global, changes on login-logout only |
| Language / locale | Global, changes rarely |
| Feature flags | Read-only, app-wide |

**Bad fits:**

| Situation | Better choice |
|---|---|
| State used by 2–3 nearby components | Just lift state up |
| High-frequency updates (form input, mouse position) | Local state — Context would re-render everything |
| **Server data** (API responses) | React Query / SWR / RTK Query |
| Large app, complex updates, many writers | Redux Toolkit or Zustand |

> **Prop drilling through 2 levels is not a problem.** Context adds indirection — a component's data source stops being visible in its props. Reach for it at 3+ levels, or when many unrelated branches need the same value.

---

## 6. Composition often beats Context

**Definition:** Passing components as `children` avoids drilling entirely, with no Context needed.

```jsx
// ❌ Drilling "user" through Layout, which does not use it
<Layout user={user} />

// ✅ Layout does not need to know about user at all
<Layout>
  <Profile user={user} />
</Layout>
```

Try this before adding a Context.

---

## 7. Context vs Redux

| Point | Context API | Redux Toolkit |
|---|---|---|
| Built into React | ✅ | ❌ (a library) |
| Purpose | Avoid prop drilling | Manage complex global state |
| Re-render control | All consumers re-render | Fine-grained via selectors |
| DevTools / time travel | ❌ | ✅ |
| Middleware | ❌ | ✅ |
| Async handling | Manual | Thunks / RTK Query |
| Boilerplate | Very little | Moderate |
| Best for | Theme, locale, auth user | Large, frequently-changing shared state |

---

## Key points

- Context shares a value down the tree **without prop drilling**.
- Three steps: `createContext` → `<Provider value>` → `useContext`.
- **Always wrap `useContext` in a custom hook** with a missing-provider error.
- **Memoize the provider value**, or every consumer re-renders on every render.
- **Split contexts** by update frequency; separate state from dispatch.
- Context is a **transport mechanism**, not a state manager — pair it with `useReducer`.
- Use it for rarely-changing global data; use local state, composition or React Query otherwise.

**Related:** [propDrilling.md](propDrilling.md) · [Redux-vs-Context.api.md](Redux-vs-Context.api.md) · [ReactHooks.md](ReactHooks.md) · [useReducer.md](useReducer.md) · [PerformanceOptimization.md](PerformanceOptimization.md)
