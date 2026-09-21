# useEffect Deep Dive (and useLayoutEffect)

## 1. What is useEffect?

**Definition:** `useEffect` is a React Hook that lets you run **side effects** in a functional component. It runs **after** React has updated the DOM and the browser has painted the screen.

**Definition of a Side Effect:** Any work that reaches outside the React rendering process — API calls, subscriptions, timers, manual DOM changes, logging, or reading/writing storage.

**In simple words:** "After you have shown the UI on screen, also do this extra work."

```jsx
useEffect(() => {
  // the effect - side effect code goes here
  return () => {
    // the cleanup function - optional
  };
}, [dependencies]);
```

---

## 2. The three parts of useEffect

### a) The effect function

**Definition:** The first argument — the function containing the side effect. It runs after the render is committed to the screen.

### b) The cleanup function

**Definition:** The function you **return** from the effect. React runs it before the effect runs again, and once more when the component unmounts. It is where you undo whatever the effect set up.

### c) The dependency array

**Definition:** The second argument — a list of values the effect depends on. React compares each value with the previous render using `Object.is()`. If any of them changed, the effect runs again.

---

## 3. The four dependency patterns

```jsx
// 1. NO array → runs after EVERY render
useEffect(() => {
  console.log("every render");
});

// 2. EMPTY array → runs ONCE after the first render (mount)
useEffect(() => {
  console.log("mount only");
}, []);

// 3. WITH values → runs on mount, and again whenever a value changes
useEffect(() => {
  console.log("count changed");
}, [count]);

// 4. WITH a cleanup → cleanup runs before the next effect and on unmount
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);
```

| Pattern | When it runs | Typical use |
|---|---|---|
| No array | After every render | Rarely needed — usually a bug |
| `[]` | Once, on mount | Initial fetch, one-time setup, subscriptions |
| `[a, b]` | On mount + when `a` or `b` changes | Refetch when an ID changes |
| With cleanup | Cleanup before re-run and on unmount | Timers, listeners, subscriptions |

---

## 4. The execution order

**Definition:** The full order of what React does on an update:

```
1. State or props change
2. Component function runs (render)
3. React updates the real DOM
4. useLayoutEffect cleanup → useLayoutEffect runs   (BEFORE paint, synchronous)
5. Browser paints the screen
6. useEffect cleanup → useEffect runs               (AFTER paint, asynchronous)
```

```jsx
function Demo({ id }) {
  console.log("1. render");

  useEffect(() => {
    console.log("3. effect runs");
    return () => console.log("2. cleanup of the PREVIOUS effect");
  }, [id]);
}

// When id changes: "1. render" → "2. cleanup" → "3. effect runs"
```

---

## 5. Cleanup — why it is essential

**Definition:** Cleanup prevents **memory leaks** and **stale updates**. Without it, subscriptions, timers and listeners keep running after the component is gone.

### a) Timers

```jsx
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);      // ✅ without this, the timer runs forever
}, []);
```

### b) Event listeners

```jsx
useEffect(() => {
  const handler = () => setWidth(window.innerWidth);
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);   // ✅ essential
}, []);
```

### c) Cancelling a fetch request

**Definition:** If a component unmounts (or the URL changes) before a request finishes, the late response tries to set state on a component that no longer exists. `AbortController` cancels the request.

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/user/${id}`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setUser)
    .catch((err) => {
      if (err.name !== "AbortError") setError(err);
    });

  return () => controller.abort();   // ✅ cancel the old request
}, [id]);
```

**The race condition this prevents:** the user clicks user 1, then quickly user 2. Request 1 is slower and finishes last — without cleanup, user 1's data overwrites user 2's on screen.

**Alternative pattern using a flag:**

```jsx
useEffect(() => {
  let ignore = false;

  fetchUser(id).then((data) => {
    if (!ignore) setUser(data);   // ignore results from outdated effects
  });

  return () => { ignore = true; };
}, [id]);
```

### d) Subscriptions

```jsx
useEffect(() => {
  const subscription = socket.subscribe("messages", handleMessage);
  return () => subscription.unsubscribe();
}, []);
```

---

## 6. Common useEffect mistakes

### Mistake 1 — missing dependencies (stale closure)

**Definition of a Stale Closure:** The effect function "captured" the values from the render in which it was created. With an empty dependency array it never gets new values, so it keeps using old ones forever.

```jsx
// ❌ always logs 0
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []);          // count is missing

// ✅ Fix 1 - add the dependency
}, [count]);

// ✅ Fix 2 - use a functional update, so you do not need the value
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);
}, []);          // now the empty array is genuinely correct
```

### Mistake 2 — object or array dependencies (infinite loop)

```jsx
// ❌ infinite loop - a new object is created on every render
const options = { page: 1 };
useEffect(() => { fetchData(options); }, [options]);

// ✅ Fix 1 - depend on the primitive values inside it
useEffect(() => { fetchData({ page }); }, [page]);

// ✅ Fix 2 - memoize the object
const options = useMemo(() => ({ page }), [page]);
```

### Mistake 3 — setting state that the effect depends on

```jsx
// ❌ infinite loop: effect sets count → count changes → effect runs again
useEffect(() => {
  setCount(count + 1);
}, [count]);
```

### Mistake 4 — an async function directly as the effect

**Definition:** An `async` function always returns a Promise, but React expects the effect to return either nothing or a cleanup function.

```jsx
// ❌ Wrong
useEffect(async () => {
  const data = await fetchData();
}, []);

// ✅ Correct - define an async function inside and call it
useEffect(() => {
  async function load() {
    const data = await fetchData();
    setData(data);
  }
  load();
}, []);
```

### Mistake 5 — using an effect when you do not need one

**Definition:** Effects are for **synchronising with external systems**. Anything you can calculate during render should not be in an effect.

```jsx
// ❌ Unnecessary effect + extra render
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(first + " " + last);
}, [first, last]);

// ✅ Just calculate it during render
const fullName = first + " " + last;

// ❌ Unnecessary effect for an event
useEffect(() => {
  if (submitted) sendAnalytics();
}, [submitted]);

// ✅ Do it in the event handler
const handleSubmit = () => {
  sendAnalytics();
  submitForm();
};
```

**The rule:** if it happens because of a **user action**, put it in the event handler. If it happens because the component **appeared on screen** or needs to stay in sync with something external, use an effect.

---

## 7. What is useLayoutEffect?

**Definition:** `useLayoutEffect` has exactly the same API as `useEffect`, but it runs **synchronously after the DOM is updated and BEFORE the browser paints**. This blocks the visual update until it finishes.

**When to use it:** when you must read a DOM measurement and change something based on it, and letting the user see the intermediate state would cause a visible flicker.

```jsx
// ❌ With useEffect - the tooltip flashes in the wrong position first
useEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setTooltipTop(-height);
}, []);

// ✅ With useLayoutEffect - repositioned before the user ever sees it
useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setTooltipTop(-height);
}, []);
```

| Point | `useEffect` | `useLayoutEffect` |
|---|---|---|
| **Timing** | After paint | Before paint |
| **Blocking** | No (async) | **Yes** (synchronous) |
| **Performance** | Better | Can delay the paint |
| **Use for** | 95% of cases | DOM measurement, avoiding flicker |
| **Server-side rendering** | Works | Warns — does not run on the server |

**Default to `useEffect`.** Only switch when you actually see a flicker.

---

## 8. Strict Mode double-invocation

**Definition:** In development, React's `<StrictMode>` deliberately mounts every component, runs its effects, cleans them up, and runs them again. This exposes effects that are missing a cleanup function.

```
Development with StrictMode: effect → cleanup → effect
Production:                  effect
```

**This is not a bug.** If double-running breaks your code, your effect is missing cleanup or is not idempotent. Do not "fix" it by disabling Strict Mode.

---

## Key points

- `useEffect` runs side effects **after** the screen paints.
- The dependency array controls when it re-runs; `[]` means once on mount.
- Always return a **cleanup** for timers, listeners, subscriptions and fetches.
- Never lie about dependencies — missing ones cause stale closures.
- Object/array dependencies need `useMemo`, or depend on primitives instead.
- Do not use an effect for things you can calculate during render or handle in an event.
- `useLayoutEffect` runs before paint — only for DOM measurement and flicker fixes.
- Strict Mode double-runs effects in development on purpose.
