# React Performance Optimization

## 1. Why do performance problems happen?

**Definition:** A React performance problem is almost always one of three things:
1. **Too many re-renders** — components re-rendering when nothing they show has changed.
2. **Expensive renders** — a single render doing too much work (heavy calculations, huge lists).
3. **A large bundle** — too much JavaScript downloaded before the app can start.

**The golden rule:** **measure first**. Never optimise code you have not profiled — you usually guess wrong and make the code worse.

---

## 2. Measuring — the React DevTools Profiler

**Definition:** The Profiler tab in React DevTools records each render, showing which components rendered, how long they took, and **why** they re-rendered.

**How to use it:**
1. Install React DevTools → open the **Profiler** tab.
2. Click record, interact with your app, then stop.
3. Read the flamegraph: wider bars = slower components.
4. Enable **"Record why each component rendered"** in the settings.

**Also useful:**

```jsx
// The <Profiler> component - measure in code
<Profiler id="UserList" onRender={(id, phase, actualDuration) => {
  console.log(id, phase, actualDuration);
}}>
  <UserList />
</Profiler>
```

Use **Lighthouse** in Chrome DevTools for overall page metrics (LCP, CLS, TBT).

---

## 3. Technique 1 — Stop unnecessary re-renders

**Definition:** By default, when a component re-renders, **all of its children re-render too**, even if their props are identical.

### `React.memo`

```jsx
const ExpensiveChild = React.memo(function ExpensiveChild({ data }) {
  return <HeavyList data={data} />;
});
// Re-renders only when "data" actually changes (shallow comparison)
```

### `useCallback` and `useMemo` for stable props

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  const handleSelect = useCallback((id) => selectItem(id), []);   // stable function
  const config = useMemo(() => ({ mode: "grid" }), []);           // stable object

  return <ExpensiveChild onSelect={handleSelect} config={config} />;
}
```

> Without these, `React.memo` is useless — new function and object references look like changed props.

### Move state down (often the best fix, and free)

**Definition:** If state is only used by a small part of the tree, move it into that part. Then a change only re-renders that small piece.

```jsx
// ❌ Typing in the input re-renders ExpensiveList on every keystroke
function Page() {
  const [text, setText] = useState("");
  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <ExpensiveList />
    </>
  );
}

// ✅ State isolated - ExpensiveList never re-renders
function SearchInput() {
  const [text, setText] = useState("");
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}

function Page() {
  return (
    <>
      <SearchInput />
      <ExpensiveList />
    </>
  );
}
```

### Pass children as props (lift content up)

**Definition:** Content passed as `children` is created by the **parent** of the stateful component, so it does not re-render when that component's state changes.

```jsx
// ❌ ExpensiveTree re-renders on every count change
function Wrapper() {
  const [count, setCount] = useState(0);
  return (
    <div onClick={() => setCount(count + 1)}>
      <ExpensiveTree />
    </div>
  );
}

// ✅ ExpensiveTree is created outside, so it does NOT re-render
function Wrapper({ children }) {
  const [count, setCount] = useState(0);
  return <div onClick={() => setCount(count + 1)}>{children}</div>;
}

<Wrapper><ExpensiveTree /></Wrapper>
```

---

## 4. Technique 2 — Fix Context re-renders

**Definition:** Every component calling `useContext` re-renders whenever the **context value object** changes — even if it only uses one field of it.

```jsx
// ❌ New object every render → every consumer re-renders always
<AuthContext.Provider value={{ user, login, logout }}>

// ✅ Memoized value
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
<AuthContext.Provider value={value}>
```

**Split contexts that change at different rates:**

```jsx
// ❌ One context - a theme change re-renders everything reading user too
<AppContext.Provider value={{ user, theme, cart }}>

// ✅ Separate contexts - each consumer only re-renders for its own data
<UserContext.Provider value={user}>
  <ThemeContext.Provider value={theme}>
    <CartContext.Provider value={cart}>
```

**Split state and dispatch:** components that only dispatch never re-render, because `dispatch` is stable.

```jsx
<StateContext.Provider value={state}>
  <DispatchContext.Provider value={dispatch}>
```

---

## 5. Technique 3 — Virtualize long lists

**Definition:** Virtualization (windowing) renders only the items currently **visible on screen**, plus a small buffer, instead of all of them. Scrolling swaps which items are rendered.

```jsx
// ❌ 10,000 DOM nodes - slow scrolling, huge memory use
{items.map((item) => <Row key={item.id} item={item} />)}

// ✅ Only ~20 DOM nodes exist at any time
import { FixedSizeList } from "react-window";

<FixedSizeList height={600} itemCount={items.length} itemSize={50} width="100%">
  {({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  )}
</FixedSizeList>
```

**Libraries:** `react-window` (small and simple), `@tanstack/react-virtual` (more flexible, supports variable sizes).

**Use it when:** a list has more than roughly 100 rows, or rows are complex.

---

## 6. Technique 4 — Code splitting and lazy loading

```jsx
const Dashboard = lazy(() => import("./pages/Dashboard"));

<Suspense fallback={<Skeleton />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

**What to split:** routes/pages, modals, charts, rich text editors, admin panels, anything below the fold.

**Analyse the bundle:**

```bash
npx vite-bundle-visualizer        # Vite
npx webpack-bundle-analyzer       # Webpack
```

Look for large dependencies you can replace (for example `moment` → `date-fns`, or `lodash` → individual imports).

---

## 7. Technique 5 — Transitions for slow updates

**Definition:** `useTransition` marks a state update as **non-urgent**, letting React keep the urgent UI (like typing) responsive while the slow render happens in the background.

```jsx
function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setQuery(e.target.value);                // urgent - input must feel instant

    startTransition(() => {
      setResults(filterHugeList(e.target.value));  // non-urgent, interruptible
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        <ResultList results={results} />
      </div>
    </>
  );
}
```

**`useDeferredValue`** does the same when you cannot control where the state is set:

```jsx
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => search(deferredQuery), [deferredQuery]);
```

---

## 8. Technique 6 — Optimise images and assets

| Technique | How |
|---|---|
| Lazy load images | `<img loading="lazy" />` |
| Modern formats | WebP or AVIF instead of PNG/JPG |
| Correct sizes | `srcset` and `sizes` for responsive images |
| Reserve space | Always set `width` and `height` to avoid layout shift |
| Use a CDN | Serve images from a nearby edge server |
| In Next.js | Use `next/image`, which does all of this automatically |

---

## 9. Technique 7 — Cache server data properly

**Definition:** Most "slow app" complaints are actually **repeated network requests**, not React rendering. A data-fetching library caches responses, deduplicates requests and refetches in the background.

```jsx
// ❌ Refetches on every mount, no caching, no deduplication
useEffect(() => { fetch("/api/users").then(...); }, []);

// ✅ React Query - cached, deduplicated, background refetch
const { data, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,     // treat data as fresh for 5 minutes
});
```

---

## 10. Common performance mistakes

```jsx
// 1. Creating objects/arrays inline as props
<Child style={{ margin: 10 }} items={[1,2,3]} />     // ❌ new every render
const style = useMemo(() => ({ margin: 10 }), []);   // ✅

// 2. Using the array index as a key in a dynamic list
{items.map((item, i) => <Row key={i} />)}            // ❌
{items.map((item) => <Row key={item.id} />)}         // ✅

// 3. Expensive work directly in the render body
const sorted = items.sort(compare);                   // ❌ runs every render + mutates!
const sorted = useMemo(() => [...items].sort(compare), [items]);  // ✅

// 4. Too much state in one place
// Split state so unrelated updates do not re-render everything

// 5. Not cleaning up effects → memory leaks that slow the app over time
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);                     // ✅
}, []);

// 6. Over-memoizing cheap components
const x = useMemo(() => a + b, [a, b]);               // ❌ costs more than it saves
```

---

## 11. Optimisation checklist, in order

1. **Profile** — find the real bottleneck with the DevTools Profiler.
2. **Move state down** or pass `children` — free, no memoization needed.
3. **Memoize** with `React.memo` + `useCallback`/`useMemo` where props are unstable.
4. **Split contexts** and memoize context values.
5. **Virtualize** lists longer than ~100 items.
6. **Code split** by route and by heavy component.
7. **Use transitions** for expensive updates driven by fast input.
8. **Cache server data** with React Query / SWR / RTK Query.
9. **Optimise images** and check the bundle size.
10. **Re-profile** to confirm the change actually helped.

> **React 19's Compiler** handles most manual memoization automatically. When it is enabled, steps 3 and 4 largely disappear.

---

## Key points

- Always **measure before optimising** — use the Profiler.
- The cheapest fixes are **moving state down** and **passing children**, not memoization.
- `React.memo` only works when its props are referentially stable.
- Context re-renders all consumers — memoize the value and split contexts.
- **Virtualize** long lists; **code split** by route.
- `useTransition` keeps the UI responsive during heavy updates.
- Most real slowness is network-related — cache server data properly.
