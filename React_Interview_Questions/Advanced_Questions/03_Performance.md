# Advanced React Questions — Part 3: Performance & Optimization (21–30)

[← Part 2: Advanced Hooks](02_Hooks.md) · [Back to the list](README.md) · [Part 4: Architecture & State →](04_Architecture.md)

---

## 21. `React.memo` vs `useMemo` vs `useCallback`?

**Short answer:** All three avoid repeating work, but they cache **different things**:

- **`React.memo`** caches a **component**. It skips re-rendering if the props are the same.
- **`useMemo`** caches a **value** (the result of a calculation).
- **`useCallback`** caches a **function** (the same function reference between renders).

| | `React.memo` | `useMemo` | `useCallback` |
|---|---|---|---|
| What it is | A higher-order component | A Hook | A Hook |
| What it caches | The component's rendered output | A calculated value | A function |
| Where you write it | Around a component | Inside a component | Inside a component |
| Re-runs when | A prop changes (shallow compare) | A dependency changes | A dependency changes |
| Main use | Skip re-rendering a child | Slow calculations, stable objects/arrays | Stable functions for memo children and dependencies |

**How they work together:**

```jsx
// 1. React.memo — Chart re-renders only if `data` or `onPointClick` changes
const Chart = React.memo(function Chart({ data, onPointClick }) {
  console.log("Chart rendered");
  return <canvas /* draws `data` */ />;
});

function Dashboard({ sales }) {
  const [theme, setTheme] = useState("light");

  // 2. useMemo — the same array until `sales` changes
  const chartData = useMemo(
    () => sales.map((s) => ({ x: s.month, y: s.total })),
    [sales]
  );

  // 3. useCallback — the same function on every render
  const handlePointClick = useCallback((point) => {
    console.log("Clicked", point);
  }, []);

  return (
    <div className={theme}>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle theme
      </button>
      {/* Toggling the theme does NOT re-render Chart */}
      <Chart data={chartData} onPointClick={handlePointClick} />
    </div>
  );
}
```

If you remove `useMemo` **or** `useCallback`, `Chart` re-renders on every theme toggle. A new array or a new function means "the props changed", so `React.memo` can't help.

**`React.memo` with a custom compare function (rare):**

```jsx
const MemoRow = React.memo(Row, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id; // true = skip the re-render
});
```

> 💡 **Tip:** The **React Compiler** (stable since 2025) adds this memoization automatically at build time. In new projects you may write almost no `memo`/`useMemo`/`useCallback` by hand.

Basics: [Most asked Q16](../Most_Asked_Questions/02_Hooks.md#16-what-is-the-difference-between-usememo-and-usecallback) · Deep dive: [MemoUseMemoUseCallback.md](../MemoUseMemoUseCallback.md)

---

## 22. How do you profile a slow React application?

**Short answer:** **Measure first, then fix.** Use the **React DevTools Profiler** to find which components render too often or too slowly, the **Chrome Performance tab** to find long tasks, and **Lighthouse / Web Vitals** for page-load speed. Fix the biggest problem, then measure again.

```
1. Reproduce  →  2. Record  →  3. Find the slow part  →  4. Fix  →  5. Measure again
```

**Step-by-step:**

| Step | Tool | What to look for |
|---|---|---|
| 1. Use a **production build** | `npm run build` + preview | Development mode is much slower and gives wrong numbers |
| 2. See what re-renders | React DevTools → ⚙️ → **"Highlight updates when components render"** | Parts of the page flashing when they shouldn't |
| 3. Record a profile | React DevTools → **Profiler** → ⏺ Record → do the slow action → Stop | Tall bars (slow commits), components that render many times |
| 4. Find out why | Profiler ⚙️ → **"Record why each component rendered"** | "Props changed: onClick" → a new function every render |
| 5. Check the main thread | Chrome DevTools → **Performance** tab | **Long tasks** (over 50ms, marked red) that block clicks and typing |
| 6. Check real user metrics | Lighthouse, `web-vitals` library | **LCP** (load speed), **INP** (response to input), **CLS** (layout jumps) |
| 7. Check bundle size | `rollup-plugin-visualizer` (Vite), `webpack-bundle-analyzer` | Huge libraries you don't need on the first page |

**Reading the Profiler:**

- **Flamegraph** — the component tree for one commit. Wider and more yellow = slower. Grey = didn't render.
- **Ranked chart** — components sorted by render time. The slowest is at the top.
- **Commit bars** (top right) — one bar per commit. Tall bars are slow commits.

**Quick timing in code:**

```jsx
console.time("sort");
const sorted = [...bigList].sort(compare);
console.timeEnd("sort"); // sort: 84.2ms → worth fixing
```

**Common findings and fixes:**

| You see | Fix |
|---|---|
| A child renders even though its props look the same | `React.memo` + `useCallback`/`useMemo` (Q21) |
| A big list takes 300ms to render | Virtualization (Q26) |
| Typing is slow because a heavy list updates | `useTransition` / `useDeferredValue` (Q9) |
| The whole page renders when one input changes | Move the state down (Q30) |
| The first load is slow | Code splitting (Q23) |

> 💡 **Tip:** React 19.2+ also adds **React tracks** to the Chrome Performance panel, so you can see React's scheduler and component work on the same timeline as everything else.

Deep dive: [PerformanceOptimization.md](../PerformanceOptimization.md)

---

## 23. How does code splitting work?

**Short answer:** Code splitting breaks your app's JavaScript into **smaller files (chunks)**, so the browser downloads only what the current page needs. It works through the **dynamic `import()`** syntax: when the bundler (Vite, webpack, Rollup) sees `import("./file")`, it puts that file in a **separate chunk** and loads it over the network **only when that line runs**.

**Static vs dynamic import:**

```jsx
// Static import → goes into the main bundle → downloaded on page load
import Chart from "./Chart";

// Dynamic import → its own chunk → downloaded only when this line runs
const module = await import("./Chart");
```

**What the build output looks like:**

```
Without code splitting:            With code splitting:
  index.js   1.8 MB                  index.js       220 KB  ← loaded first
                                     Dashboard.js   340 KB  ← when /dashboard opens
                                     Settings.js    120 KB  ← when /settings opens
                                     pdf-lib.js     900 KB  ← when "Export PDF" is clicked
```

**Three types of splitting:**

**1. Route-based (most common, biggest win):**

```jsx
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
```

**2. Component-based** — big things that aren't always shown: modals, charts, rich text editors.

```jsx
const VideoPlayer = lazy(() => import("./VideoPlayer"));
```

**3. Library-based** — load a heavy library only when it's needed:

```jsx
async function handleExport() {
  const { jsPDF } = await import("jspdf"); // 300KB+, downloaded only on click
  const doc = new jsPDF();
  doc.text("Report", 10, 10);
  doc.save("report.pdf");
}
```

**How the browser loads a chunk:**

```
User opens /dashboard
  → React renders <Dashboard />
  → lazy() runs import("./pages/Dashboard")
  → the browser downloads Dashboard-abc123.js
  → React renders it (Suspense shows a fallback meanwhile — Q24)
```

**Tips for good splitting:**

- Split by **route** first. That's where most of the benefit is.
- Don't split tiny components — each chunk is an extra network request.
- Next.js, Remix and React Router frameworks split by route **automatically**.

> 💡 **Tip:** Say: "Code splitting uses dynamic `import()`. The bundler creates a separate chunk, and the browser downloads it on demand."

Deep dive: [LazyLoadingSuspense.md](../LazyLoadingSuspense.md)

---

## 24. How do lazy loading and Suspense work together?

**Short answer:** **`React.lazy`** turns a dynamic `import()` into a component that loads its code the **first time it renders**. While the code is downloading, the lazy component **"suspends"**. The nearest **`<Suspense>`** boundary above it catches this and shows its **`fallback`**. When the download finishes, React renders the real component.

```
<Suspense fallback={<Spinner />}>   ← shows Spinner while waiting
  <LazyDashboard />                 ← "I'm not ready yet" (suspends)
</Suspense>
```

**How it works inside:**

1. React renders `<LazyDashboard />`.
2. The code isn't loaded yet, so `lazy` **throws the loading promise**.
3. React catches it and finds the nearest `<Suspense>` above → shows the `fallback`.
4. When the promise resolves, React **tries rendering again** → the real component appears.
5. Next time, the code is cached → no fallback.

**Full example — with error handling and preloading:**

```jsx
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Keep the import function so we can start loading early
const loadReports = () => import("./pages/Reports");
const Reports = lazy(loadReports);

function App() {
  return (
    <>
      <nav>
        {/* Start downloading on hover, before the click */}
        <Link to="/reports" onMouseEnter={loadReports}>Reports</Link>
      </nav>

      {/* If the chunk fails to load (offline, new deploy), show an error */}
      <ErrorBoundary fallback={<p>Couldn't load this page. Please refresh.</p>}>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
```

**Several boundaries = smaller loading areas:**

```jsx
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<ChartSkeleton />}>
    <SalesChart />      {/* only this area shows a skeleton */}
  </Suspense>
  <Suspense fallback={<TableSkeleton />}>
    <OrdersTable />
  </Suspense>
</Suspense>
```

**Rules:**

| Rule | Why |
|---|---|
| The lazy component must be a **default export** | `lazy` expects `{ default: Component }` |
| Call `lazy()` at the **top level**, not inside a component | Otherwise a new component is created every render and its state is lost |
| Wrap with an **Error Boundary** | Network errors would otherwise crash the app |
| Use a **transition** when navigating | With `startTransition`, React keeps the old page on screen instead of showing a fallback again (most routers do this) |

**For named exports:**

```jsx
const Chart = lazy(() =>
  import("./Charts").then((module) => ({ default: module.Chart }))
);
```

> 💡 **Tip:** Suspense isn't only for code. The same `<Suspense>` also waits for **data** (Q46).

Basics: [Most asked Q25](../Most_Asked_Questions/03_Advanced.md#25-what-is-lazy-loading-and-code-splitting) · Deep dive: [LazyLoadingSuspense.md](../LazyLoadingSuspense.md)

---

## 25. How would you optimize a list with thousands of items?

**Short answer:** The biggest win is **virtualization** — render only the rows you can see (Q26). Then reduce the work for each row: **stable keys**, **`React.memo`** on the row, **stable props** (`useCallback`), **memoized filtering/sorting**, and **debounced or deferred** search. If possible, don't load thousands of items at all — use **pagination** or **infinite scroll**.

**Checklist:**

| Technique | What it fixes |
|---|---|
| **Virtualization** (`@tanstack/react-virtual`, `react-window`, `react-virtuoso`) | 10,000 DOM nodes → about 20 |
| **Pagination / infinite scroll** | Don't fetch or render everything at once |
| **Stable unique keys** (`item.id`) | Rows aren't re-created when the list changes |
| **`React.memo` on the row** | Rows that didn't change skip re-rendering |
| **`useCallback` for row handlers** | Keeps `React.memo` working |
| **`useMemo` for filter/sort** | No re-sorting when unrelated state changes |
| **`useDeferredValue` for the search box** | Typing stays fast while the list updates |
| **Server-side filtering and sorting** | The browser handles less data |
| **CSS `content-visibility: auto`** | The browser skips painting off-screen rows (simple lists only) |

**Example — memo row + stable handler + deferred filter:**

```jsx
const ContactRow = React.memo(function ContactRow({ contact, onSelect }) {
  return (
    <li onClick={() => onSelect(contact.id)}>
      {contact.name} — {contact.email}
    </li>
  );
});

function ContactList({ contacts }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(deferredSearch.toLowerCase())),
    [contacts, deferredSearch]
  );

  const handleSelect = useCallback((id) => setSelectedId(id), []);

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
      <ul>
        {filtered.map((contact) => (
          <ContactRow key={contact.id} contact={contact} onSelect={handleSelect} />
        ))}
      </ul>
    </>
  );
}
```

For 10,000+ contacts, also virtualize the `<ul>` (see Q26).

> 💡 **Tip:** In the interview, order your answer by impact: "First virtualization or pagination, then memoized rows, then deferred filtering."

Deep dive: [PerformanceOptimization.md](../PerformanceOptimization.md)

---

## 26. What is list virtualization?

**Short answer:** List virtualization (also called **windowing**) means rendering **only the items visible in the scroll area** (plus a few extra above and below), instead of all items. As the user scrolls, React swaps which items are rendered. A list of 10,000 items creates only about **20 DOM nodes** instead of 10,000.

**In simple words:** It's like a train window. The view keeps changing, but the window is always the same size.

**How it works:**

```
  All 10,000 items (virtual)        What is actually in the DOM
  ┌──────────────────────┐
  │ item 0               │
  │ ...                  │  ← not rendered (empty space)
  │ item 199             │
  ├──────────────────────┤ ─┐
  │ item 200             │  │
  │ item 201             │  │  ← visible window: only these ~20 are rendered
  │ ...                  │  │
  │ item 219             │  │
  ├──────────────────────┤ ─┘
  │ item 220             │
  │ ...                  │  ← not rendered (empty space)
  │ item 9,999           │
  └──────────────────────┘
```

1. An outer box with a **fixed height** and `overflow: auto` (the scroll area).
2. An inner box with the **full height** (`itemCount × rowHeight`), so the scrollbar looks right.
3. On scroll: `firstVisible = Math.floor(scrollTop / rowHeight)`.
4. Render only the visible rows, each placed at the right position.

**A simple version you can build yourself (to understand the idea):**

```jsx
function VirtualList({ items, rowHeight = 40, height = 400 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const overscan = 5; // extra rows above and below, so fast scrolling doesn't show gaps

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(items.length, Math.ceil((scrollTop + height) / rowHeight) + overscan);

  return (
    <div
      style={{ height, overflowY: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * rowHeight, position: "relative" }}>
        {items.slice(start, end).map((item, i) => (
          <div
            key={item.id}
            style={{ position: "absolute", top: (start + i) * rowHeight, height: rowHeight, width: "100%" }}
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**In real projects, use a library — `@tanstack/react-virtual`:**

```jsx
import { useVirtualizer } from "@tanstack/react-virtual";

function BigList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // estimated row height in px
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: 400, overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: row.size,
              transform: `translateY(${row.start}px)`,
            }}
          >
            {items[row.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Libraries:** `@tanstack/react-virtual` (flexible, headless), `react-window` (small), `react-virtuoso` (easy with variable heights and chat-style lists).

**Downsides:**

| Problem | Why |
|---|---|
| Browser **Ctrl+F** can't find off-screen items | They are not in the DOM |
| **Variable row heights** are harder | The library must measure rows |
| **Accessibility** | Screen readers don't know the full list size — add `aria-rowcount` / `aria-setsize` |
| **SEO** | Search engines don't see off-screen items |

> 💡 **Tip:** Use virtualization when you have hundreds or thousands of rows. For 50 rows it adds complexity for no real gain.

Deep dive: [PerformanceOptimization.md](../PerformanceOptimization.md)

---

## 27. How do you prevent Context from causing excessive re-renders?

**Short answer:** When a Context value changes, **every component that reads that Context re-renders** — and `React.memo` can't stop it. Fixes:

1. **Memoize the value** with `useMemo`, so it's not a new object on every render.
2. **Split the Context** — separate data that changes often from data that rarely changes (or state from `dispatch`).
3. **Keep the Provider low** in the tree and pass content as `children`.
4. For big, fast-changing state, use a **store with selectors** (Zustand, Redux Toolkit), so each component re-renders only for the part it uses.

**Problem 1 — a new value object on every render:**

```jsx
// ❌ { user, setUser } is a new object every time App renders,
//    so ALL consumers re-render, even if `user` didn't change
function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Page />
    </UserContext.Provider>
  );
}

// ✅ The same object until `user` changes
function App() {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}><Page /></UserContext.Provider>;
}
```

**Problem 2 — one Context for everything. Fix: split state and actions:**

```jsx
const CartStateContext = createContext(null);
const CartDispatchContext = createContext(null);

function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, []);

  return (
    <CartDispatchContext.Provider value={dispatch}>   {/* dispatch never changes */}
      <CartStateContext.Provider value={cart}>
        {children}
      </CartStateContext.Provider>
    </CartDispatchContext.Provider>
  );
}

// "Add to cart" buttons only need dispatch → they DON'T re-render when the cart changes
function AddToCartButton({ product }) {
  const dispatch = useContext(CartDispatchContext);
  return <button onClick={() => dispatch({ type: "add", product })}>Add</button>;
}

// Only the cart badge re-renders when the cart changes
function CartBadge() {
  const cart = useContext(CartStateContext);
  return <span>{cart.length}</span>;
}
```

**Problem 3 — the Provider wraps components directly. Fix: use `children`:**

```jsx
// ✅ ThemeProvider re-renders when the theme changes, but `children` were created
//    by the parent, so they are the same elements and don't re-render
//    (unless they read the context themselves)
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

**Problem 4 — state that changes very often (mouse position, form fields, live data).** Context is not built for this. Use a store with selectors:

```jsx
import { create } from "zustand";

const useCartStore = create((set) => ({
  items: [],
  add: (item) => set((state) => ({ items: [...state.items, item] })),
}));

function CartCount() {
  const count = useCartStore((state) => state.items.length); // re-renders only when the count changes
  return <span>{count}</span>;
}
```

> 💡 **Tip:** "Context is great for values that rarely change — theme, language, logged-in user. For state that changes often, use a store with selectors."

Deep dive: [ContextAPI.md](../ContextAPI.md) · [PerformanceOptimization.md](../PerformanceOptimization.md)

---

## 28. How do you identify and fix memory leaks?

**Short answer:** A memory leak happens when something keeps a reference to memory that's no longer needed, so the browser can't free it. In React, it's usually an **effect without cleanup**: a timer, event listener, subscription or WebSocket that keeps running after the component is removed. Find leaks with the **Chrome DevTools Memory tab** (heap snapshots). Fix them by **returning a cleanup function** from `useEffect`.

**Common causes and fixes:**

| Cause | Fix in the cleanup |
|---|---|
| `setInterval` / `setTimeout` | `clearInterval(id)` / `clearTimeout(id)` |
| `window.addEventListener(...)` | `window.removeEventListener(...)` with the **same** function |
| WebSocket / Socket.io / Firebase subscription | `socket.close()` / `unsubscribe()` |
| `fetch` still running | `controller.abort()` |
| Third-party libraries (charts, maps, editors) | `chart.destroy()` / `map.remove()` |
| A global array, `Map` or cache that only grows | Remove entries, set a size limit, or use a `WeakMap` |
| `ResizeObserver` / `IntersectionObserver` | `observer.disconnect()` |

**Example — a component with three possible leaks, all fixed:**

```jsx
function LivePriceChart({ symbol }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const chart = new ChartLibrary(canvasRef.current);              // 1. library instance
    const socket = new WebSocket(`wss://prices.example.com/${symbol}`); // 2. connection
    socket.onmessage = (e) => chart.addPoint(JSON.parse(e.data));

    const handleResize = () => chart.resize();                      // 3. global listener
    window.addEventListener("resize", handleResize);

    return () => {
      // Without this cleanup, every time the user opens and closes this chart,
      // one more socket, listener and chart would stay in memory.
      socket.close();
      window.removeEventListener("resize", handleResize);
      chart.destroy();
    };
  }, [symbol]);

  return <canvas ref={canvasRef} />;
}
```

**How to find a leak (Chrome DevTools):**

1. Open **DevTools → Memory**.
2. Take a **heap snapshot** (baseline).
3. Do the suspect action several times — e.g. open and close a modal 10 times.
4. Click the 🗑️ **garbage collection** button, then take a **second snapshot**.
5. Choose **"Comparison"** view. Look for objects whose count keeps growing.
6. Search for **"Detached"** — these are DOM nodes removed from the page but still held in memory.

Also useful: **Performance monitor** (DevTools → ⋮ → More tools) — if the **JS heap size** keeps climbing and never drops, something is leaking.

**Strict Mode helps:** in development, React mounts → unmounts → mounts each component once. A missing cleanup often shows up as duplicate listeners, two connections, or double logs.

**Note:** React 18 removed the old warning *"Can't perform a React state update on an unmounted component"*. Setting state after unmount is usually harmless. The **real** leak is the subscription that keeps running.

> 💡 **Tip:** A simple rule: "If an effect **starts** something, its cleanup must **stop** it."

Deep dive: [useEffectDeepDive.md](../useEffectDeepDive.md) · [ErrorHandlingAndMemory.md](../../Node_Backend_Questions/ErrorHandlingAndMemory.md)

---

## 29. What is the purpose of the React Profiler?

**Short answer:** The React Profiler measures **how often** components render and **how long** each render takes. It helps you find the components that make your app slow. It comes in two forms:

1. **The Profiler tab in React DevTools** — for finding problems by hand.
2. **The `<Profiler>` component** — for measuring in code (for example, sending numbers to a monitoring tool).

**1. The DevTools Profiler** — see Q22 for the step-by-step. It shows:

- **Which** components rendered in each commit.
- **How long** each one took.
- **Why** it rendered (when "Record why each component rendered" is on).

**2. The `<Profiler>` component:**

```jsx
import { Profiler } from "react";

function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  console.log(`${id} (${phase}) took ${actualDuration.toFixed(1)}ms`);
  // e.g. send to your analytics:
  // if (actualDuration > 16) reportSlowRender({ id, phase, actualDuration });
}

function App() {
  return (
    <>
      <Profiler id="Sidebar" onRender={onRender}>
        <Sidebar />
      </Profiler>
      <Profiler id="Feed" onRender={onRender}>
        <Feed />
      </Profiler>
    </>
  );
}
```

```
Sidebar (mount) took 4.2ms
Feed (mount) took 38.7ms     ← the slow one
Feed (update) took 35.1ms
```

**The `onRender` values:**

| Value | Meaning |
|---|---|
| `id` | The `id` you gave the Profiler |
| `phase` | `"mount"` (first render), `"update"` (re-render) or `"nested-update"` |
| `actualDuration` | Time spent rendering this update (lower with good memoization) |
| `baseDuration` | Estimated time to render the whole subtree **without** memoization (the worst case) |
| `startTime` | When React started rendering this update |
| `commitTime` | When React committed this update |

**Tip:** if `actualDuration` is much smaller than `baseDuration`, your memoization is working.

**What it's used for:**

- Finding slow components.
- Checking that `React.memo` / `useMemo` actually help.
- Catching performance regressions — tracking render times over time.

**Limits:** profiling adds a small overhead, so it's **turned off in production builds**. To profile production, use React's special profiling build (`react-dom/profiling`).

> 💡 **Tip:** 16ms is a useful number: to stay at 60 frames per second, a render plus paint should fit in about 16ms.

Deep dive: [PerformanceOptimization.md](../PerformanceOptimization.md)

---

## 30. How would you optimize a large React application?

**Short answer:** Work in this order: **measure → load less code → render less → fetch smarter → keep watching**. Don't guess — use the Profiler and Web Vitals to find the real problems, fix the biggest ones, and add checks so performance doesn't get worse over time.

**1. Measure** (Q22)

- **Web Vitals:** LCP (how fast the main content appears), INP (how fast the page responds to clicks), CLS (layout jumps).
- React DevTools Profiler, Chrome Performance tab, bundle analyzer.

**2. Load less JavaScript**

| Technique | Example |
|---|---|
| Route-based code splitting | `lazy(() => import("./pages/Admin"))` (Q23) |
| Remove or replace heavy libraries | `moment` → `date-fns` or `dayjs`, full `lodash` → `lodash-es` per-function imports |
| Tree shaking | Use ES modules, import only what you need |
| Load non-critical scripts later | Analytics and chat widgets after the page loads |
| Optimize images | WebP/AVIF, correct sizes, `loading="lazy"` |
| Pre-render HTML | SSR/SSG for a fast first paint (Q41) |

**3. Render less**

| Technique | Example |
|---|---|
| Keep state close to where it's used | Move input state into a small component (see below) |
| Memoize where the Profiler shows a problem | `React.memo`, `useMemo`, `useCallback` (Q21) — or the **React Compiler** |
| Virtualize long lists | `@tanstack/react-virtual` (Q26) |
| Keep typing smooth | `useTransition` / `useDeferredValue` (Q9) |
| Avoid Context churn | Split contexts, memoize values (Q27) |

**Example — move state down:**

```jsx
// ❌ Every key press re-renders the whole page, including the slow chart
function Page() {
  const [search, setSearch] = useState("");
  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <ExpensiveChart />
    </>
  );
}

// ✅ Only SearchBox re-renders
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

**4. Fetch data smarter**

- Cache and deduplicate requests with **TanStack Query** or **RTK Query** (Q39).
- Avoid **request waterfalls** — start independent requests at the same time:

```jsx
// ❌ Waterfall: 2 requests one after another (slow)
const user = await getUser(id);
const orders = await getOrders(id);

// ✅ In parallel
const [user, orders] = await Promise.all([getUser(id), getOrders(id)]);
```

- Paginate big lists, prefetch the next page, debounce search inputs.

**5. Keep it fast over time**

- **Performance budgets in CI** — fail the build if the main bundle grows too much (e.g. `size-limit`, Lighthouse CI).
- **Real User Monitoring** — collect Web Vitals from real users (`web-vitals` library, Sentry, Datadog).

> 💡 **Tip:** Interviewers want a **process**, not a list of hooks. Start with "I'd measure first", then talk about loading, rendering and data, with one example each.

Deep dive: [PerformanceOptimization.md](../PerformanceOptimization.md)

---

[← Part 2: Advanced Hooks](02_Hooks.md) · [Back to the list](README.md) · [Part 4: Architecture & State →](04_Architecture.md)
