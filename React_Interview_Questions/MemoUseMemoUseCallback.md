# React.memo, useMemo and useCallback

These three are React's **memoization** tools. They look similar but each solves a different problem.

## 1. What is Memoization?

**Definition:** Memoization is caching the result of an expensive operation so that if the same inputs come again, the cached result is returned instead of recomputing it.

**In React it is used to avoid two kinds of waste:**
1. Re-rendering a component whose props did not actually change.
2. Re-running an expensive calculation on every render.

---

## 2. Why do components re-render?

**Definition:** A React component re-renders when:
- Its own **state** changes,
- Its **props** change,
- A **context** value it uses changes,
- Or its **parent re-renders** (this happens by default, even if its props are identical).

That last point is what `React.memo` fixes.

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <Child name="Himanshu" />   {/* re-renders every click, even though name never changes */}
    </>
  );
}
```

---

## 3. What is React.memo?

**Definition:** `React.memo` is a **higher-order component** that wraps a component and makes it skip re-rendering when its props have not changed. It does a **shallow comparison** of the old and new props.

**Definition of "shallow comparison":** Comparing each prop with `Object.is()` (basically `===`). Primitives compare by value; objects, arrays and functions compare by **reference**.

```jsx
const Child = React.memo(function Child({ name }) {
  console.log("Child rendered");
  return <p>{name}</p>;
});

// Now Child only re-renders when "name" actually changes
```

**Custom comparison function (second argument):**

```jsx
const Child = React.memo(
  function Child({ user }) {
    return <p>{user.name}</p>;
  },
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id
  // return TRUE to SKIP the re-render (opposite of shouldComponentUpdate)
);
```

**Why React.memo often fails:**

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = () => console.log("clicked");   // ❌ NEW function every render
  const config = { theme: "dark" };                   // ❌ NEW object every render

  return <MemoChild onClick={handleClick} config={config} />;
  // React.memo compares by reference → both props look "changed" → it re-renders anyway
}
```

This is exactly the problem `useCallback` and `useMemo` solve.

---

## 4. What is useMemo?

**Definition:** `useMemo(fn, deps)` caches the **returned value** of a calculation. The function runs only when one of the dependencies changes; otherwise the previous value is reused.

```jsx
const expensiveValue = useMemo(() => {
  return heavyCalculation(items);
}, [items]);   // recalculates only when "items" changes
```

### Use case a — expensive calculations

```jsx
function ProductList({ products, filter }) {
  // Without useMemo this runs on EVERY render, even when typing in an unrelated input
  const filtered = useMemo(
    () => products.filter((p) => p.name.includes(filter)).sort((a, b) => a.price - b.price),
    [products, filter]
  );

  return <List items={filtered} />;
}
```

### Use case b — keeping a stable object/array reference

```jsx
function Parent() {
  // ❌ new object every render → breaks React.memo and retriggers effects
  const config = { theme: "dark", lang: "en" };

  // ✅ same object reference until the dependencies change
  const config = useMemo(() => ({ theme, lang }), [theme, lang]);

  return <MemoChild config={config} />;
}
```

### Use case c — a stable dependency for useEffect

```jsx
// ❌ infinite loop - options is a new object each render
const options = { page, limit: 10 };
useEffect(() => { fetchData(options); }, [options]);

// ✅ stable reference
const options = useMemo(() => ({ page, limit: 10 }), [page]);
useEffect(() => { fetchData(options); }, [options]);
```

---

## 5. What is useCallback?

**Definition:** `useCallback(fn, deps)` caches a **function definition** so the same function reference is reused across renders, as long as the dependencies do not change.

```jsx
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**`useCallback` is just `useMemo` returning a function:**

```jsx
useCallback(fn, deps)              // these two lines
useMemo(() => fn, deps)            // are exactly equivalent
```

### Why function identity matters

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ New function reference every render
  const handleDelete = (id) => deleteItem(id);

  // ✅ Same reference unless deleteItem changes
  const handleDelete = useCallback((id) => deleteItem(id), [deleteItem]);

  return <MemoChild onDelete={handleDelete} />;
}
```

Without `useCallback`, the memoized child sees a "new" `onDelete` prop on every render and re-renders anyway — making `React.memo` useless.

---

## 6. The three working together

**Definition:** `React.memo` only works if the props it receives are referentially stable. That stability comes from `useMemo` (for objects/arrays/values) and `useCallback` (for functions). They are designed to be used as a set.

```jsx
const ExpensiveList = React.memo(function ExpensiveList({ items, onSelect, config }) {
  console.log("ExpensiveList rendered");
  return items.map((i) => <Row key={i.id} item={i} onSelect={onSelect} config={config} />);
});

function Parent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  const sortedItems = useMemo(() => [...items].sort(byName), [items]);       // stable array
  const handleSelect = useCallback((id) => console.log(id), []);            // stable function
  const config = useMemo(() => ({ showPrice: true }), []);                  // stable object

  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <ExpensiveList items={sortedItems} onSelect={handleSelect} config={config} />
      {/* Now clicking the button does NOT re-render ExpensiveList */}
    </>
  );
}
```

---

## 7. Comparison table

| | `React.memo` | `useMemo` | `useCallback` |
|---|---|---|---|
| **What it is** | Higher-order component | Hook | Hook |
| **What it caches** | A whole component's render | A computed **value** | A **function** reference |
| **Wraps** | A component | A calculation | A function definition |
| **Returns** | A memoized component | The cached value | The cached function |
| **Prevents** | Unnecessary re-renders | Expensive recalculation | New function identity |

---

## 8. When NOT to use them (very important)

**Definition:** Memoization is not free. It costs memory to store the cached value and CPU time to compare dependencies on every render. Over-using it makes the code slower and harder to read.

**Do NOT memoize when:**

```jsx
// 1. The calculation is cheap - comparing deps costs more than just doing it
const doubled = useMemo(() => count * 2, [count]);   // ❌ pointless

// 2. The child is not wrapped in React.memo - useCallback then does nothing useful
const handleClick = useCallback(() => {}, []);
return <NormalChild onClick={handleClick} />;        // ❌ child re-renders anyway

// 3. The dependencies change on every render anyway
const value = useMemo(() => compute(obj), [obj]);    // ❌ if obj is new each render

// 4. The component is small and renders fast
```

**The practical rule:** write plain code first. Only add memoization when you have **measured** a real performance problem using the React DevTools Profiler.

---

## 9. The React Compiler (React 19+)

**Definition:** The React Compiler is a build-time tool that automatically inserts memoization where it is needed. When it is enabled, you no longer have to write `useMemo`, `useCallback` or `React.memo` by hand in most cases.

```jsx
// With the React Compiler enabled, this is automatically optimised
function Parent() {
  const handleClick = () => doSomething();   // compiler memoizes it for you
  return <Child onClick={handleClick} />;
}
```

---

## Key points

- `React.memo` = skip a component's re-render when props are shallow-equal.
- `useMemo` = cache a computed **value**.
- `useCallback` = cache a **function** reference.
- They work as a team: `memo` is useless unless its props are stable.
- Shallow comparison means objects/arrays/functions compare by **reference**, not contents.
- Do not memoize by default — measure first with the Profiler.
- The React Compiler is making manual memoization largely unnecessary.
