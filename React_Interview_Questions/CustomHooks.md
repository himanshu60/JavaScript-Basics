# Custom Hooks in React

## 1. What is a Custom Hook?

**Definition:** A custom hook is a normal JavaScript function whose name starts with **`use`** and which calls one or more React hooks inside it. It is the standard way to **extract stateful logic** from a component so that it can be reused in other components.

**In simple words:** If two components need the same logic (fetching data, tracking window size, handling a toggle), you pull that logic out into a `useSomething()` function and both components call it.

**Two rules for a custom hook:**
1. The name **must** start with `use` — this is how React's linter knows to apply the Rules of Hooks.
2. It can call other hooks, and the Rules of Hooks apply inside it too.

---

## 2. Important: custom hooks share LOGIC, not STATE

**Definition:** Every component that calls a custom hook gets its **own completely separate copy** of the state inside it. Calling the same hook in two components does not connect them.

```jsx
function ComponentA() {
  const [count, increment] = useCounter();  // its OWN count
}

function ComponentB() {
  const [count, increment] = useCounter();  // a DIFFERENT, separate count
}
```

To **share** state between components you need Context or a state library — not a custom hook.

---

## 3. Before and after — why they matter

```jsx
// ❌ BEFORE - the same logic copy-pasted in two components
function UserProfile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  // ...
}

function ProductList() {
  // ... the exact same 10 lines again with a different URL
}

// ✅ AFTER - written once, used everywhere
function UserProfile() {
  const { data, loading, error } = useFetch("/api/user");
}
function ProductList() {
  const { data, loading, error } = useFetch("/api/products");
}
```

---

## 4. Commonly used custom hooks

### a) `useFetch` — data fetching

**Definition:** Handles the full lifecycle of an API request: loading state, data, errors, and cancelling the request if the component unmounts.

```jsx
function useFetch(url, options) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // AbortController lets us cancel the request if the component unmounts
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        setData(await res.json());
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();   // cleanup - cancel on unmount
  }, [url]);

  return { data, loading, error };
}
```

**Definition of `AbortController`:** A browser API that lets you cancel an in-flight `fetch` request. Without it, a response arriving after the component unmounts tries to set state on a dead component.

---

### b) `useLocalStorage` — state that persists

**Definition:** Works like `useState`, but also saves the value to `localStorage` so it survives a page refresh.

```jsx
function useLocalStorage(key, initialValue) {
  // Lazy initial state - the function runs only on the first render
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;   // private mode / corrupted data
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Could not save to localStorage", e);
    }
  }, [key, value]);

  return [value, setValue];
}

// Usage - identical to useState
const [theme, setTheme] = useLocalStorage("theme", "light");
```

---

### c) `useDebounce` — delay a fast-changing value

**Definition:** Returns a copy of a value that only updates after the value has stopped changing for a set delay. Perfect for search boxes.

```jsx
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);    // cancel if value changes again
  }, [value, delay]);

  return debounced;
}

// Usage - the API is only called after the user stops typing
function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) searchAPI(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

### d) `useToggle` — boolean state

```jsx
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}

const { value: isOpen, toggle, setFalse: close } = useToggle();
```

---

### e) `useWindowSize` — track the viewport

```jsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);  // cleanup!
  }, []);

  return size;
}

const { width } = useWindowSize();
const isMobile = width < 768;
```

---

### f) `usePrevious` — remember the last value

**Definition:** Stores the value from the previous render using a ref, because refs persist across renders without causing one.

```jsx
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;   // runs AFTER render, so we read the old value first
  }, [value]);

  return ref.current;
}

const prevCount = usePrevious(count);
console.log(`Was ${prevCount}, now ${count}`);
```

---

### g) `useClickOutside` — close dropdowns and modals

```jsx
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// Usage
function Dropdown() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  useClickOutside(ref, () => setOpen(false));

  return <div ref={ref}>{open && <Menu />}</div>;
}
```

**Definition of `contains()`:** A DOM method that returns `true` if the given node is inside the element — used here to check whether the click happened inside or outside.

---

### h) `useMediaQuery` — responsive logic in JavaScript

```jsx
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

const isDark = useMediaQuery("(prefers-color-scheme: dark)");
const isMobile = useMediaQuery("(max-width: 768px)");
```

---

## 5. Best practices for writing custom hooks

| Practice | Why |
|---|---|
| **Name must start with `use`** | Required for the linter and the Rules of Hooks |
| **One clear responsibility** | A hook that does everything is hard to reuse |
| **Always clean up** | Return a cleanup function from every effect that subscribes or times |
| **Return an object for 3+ values** | Named fields are clearer than positional arrays |
| **Return an array for 2 values** | Lets the caller rename them, like `useState` |
| **Memoize returned functions** | `useCallback` keeps their identity stable for children |
| **Accept options as parameters** | Makes the hook flexible instead of hard-coded |

```jsx
// 2 values → array (caller can rename freely)
const [value, setValue] = useLocalStorage("key", "default");

// 3+ values → object (order does not matter, names are clear)
const { data, loading, error, refetch } = useFetch("/api");
```

---

## 6. Composing hooks together

**Definition:** Custom hooks can call other custom hooks, letting you build bigger behaviour out of small pieces.

```jsx
function useSearch(endpoint) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);          // reuses a hook
  const { data, loading, error } = useFetch(               // reuses another
    debouncedQuery ? `${endpoint}?q=${debouncedQuery}` : null
  );

  return { query, setQuery, results: data, loading, error };
}

// One line in the component
function SearchPage() {
  const { query, setQuery, results, loading } = useSearch("/api/products");
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {loading ? <Spinner /> : <ResultList items={results} />}
    </>
  );
}
```

---

## 7. When NOT to write a custom hook

- The logic has **no hooks** inside it → just write a normal function.
- It is used in **only one** component and is unlikely to be reused → leave it inline.
- A well-tested library already solves it → use **React Query**, **SWR** or **React Hook Form** instead of writing your own.

---

## Key points

- A custom hook is a function starting with `use` that calls other hooks.
- It reuses **logic**, not state — each caller gets its own independent state.
- Always return a cleanup function from effects that subscribe or set timers.
- Return an array for two values, an object for three or more.
- Hooks can be composed from other hooks.
- For data fetching, prefer React Query/SWR over a hand-written `useFetch` in real projects.
