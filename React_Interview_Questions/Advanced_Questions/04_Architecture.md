# Advanced React Questions — Part 4: Architecture & State (31–40)

[← Part 3: Performance](03_Performance.md) · [Back to the list](README.md) · [Part 5: SSR, Security & More →](05_SSR_Security.md)

---

## 31. Context API vs Redux Toolkit?

**Short answer:** **Context is a way to pass data down the tree** without prop drilling. It is not a full state manager — the state itself still lives in `useState` or `useReducer`. **Redux Toolkit (RTK)** is a complete **state management library**: one central store, **selectors** (each component re-renders only for the data it uses), middleware, great DevTools, and **RTK Query** for API data.

| | Context API | Redux Toolkit |
|---|---|---|
| What it really is | Dependency injection (passing values down) | A state management library |
| Built into React | ✅ | ❌ Install `@reduxjs/toolkit` + `react-redux` |
| Setup | Very little | More (store, slices, Provider) |
| Re-renders | **Every** consumer re-renders when the value changes | Only components whose **selected** data changed |
| DevTools / time-travel debugging | ❌ | ✅ |
| Middleware (logging, async) | ❌ | ✅ |
| API caching | ❌ | ✅ RTK Query |
| Best for | Theme, language, logged-in user — data that **rarely changes** | Large apps with complex shared state that **changes often** |

**The same cart, two ways:**

```jsx
// ── Context + useReducer ──
const CartContext = createContext(null);

function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const value = useMemo(() => ({ items, dispatch }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function CartCount() {
  const { items } = useContext(CartContext); // re-renders on ANY cart change
  return <span>{items.length}</span>;
}
```

```jsx
// ── Redux Toolkit ──
const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] },
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload); // safe — Immer makes it immutable
    },
  },
});

function CartCount() {
  const count = useSelector((state) => state.cart.items.length); // re-renders only when the count changes
  return <span>{count}</span>;
}
```

**How to decide:**

```
Is it data from an API?            → TanStack Query or RTK Query (Q32)
Does it rarely change?             → Context
Is it small and shared?            → Zustand or Context
Is it large, complex, changes often,
or does the team need DevTools?    → Redux Toolkit
```

> 💡 **Tip:** Say: "Context solves **prop drilling**. Redux solves **state management**. They solve different problems, and many apps use both."

Basics: [Most asked Q24](../Most_Asked_Questions/03_Advanced.md#24-context-api-vs-redux-when-should-you-use-which) · Deep dive: [Redux-vs-Context.api.md](../Redux-vs-Context.api.md) · [ReduxToolkit.md](../ReduxToolkit.md)

---

## 32. Client state vs server state?

**Short answer:**

- **Client state** belongs to the **browser**. Your app owns it, and it's always up to date. Examples: is the modal open, dark mode, the current tab, text in a form.
- **Server state** belongs to the **server** (database). Your app only has a **copy** (a cache) that can become **out of date**. Examples: list of products, user profile, orders.

Server state has problems that client state doesn't: loading and error states, caching, refetching, deduplication, keeping data fresh, and updating the cache after a change. That's why it needs **different tools**.

| | Client state | Server state |
|---|---|---|
| Lives in | The browser | The server / database |
| Who owns it | Your app | The server — other users can change it too |
| Always up to date? | ✅ Yes | ❌ No — your copy can be stale |
| Sync or async | Synchronous | Asynchronous (needs loading/error states) |
| Examples | Theme, modal open, selected tab, form input | Users, products, orders, comments |
| Tools | `useState`, `useReducer`, Context, Zustand, Redux Toolkit | **TanStack Query**, **RTK Query**, SWR, framework loaders |

**Common mistake — treating server data like client state:**

```jsx
// ❌ Doing it all by hand: no caching, no dedup, no refetch, easy to get race conditions
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
useEffect(() => { /* fetch, setProducts, setLoading, setError... */ }, []);
```

**Better — the right tool for each kind:**

```jsx
// Server state → TanStack Query
function ProductsPage() {
  const { data: products, isPending, error } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((res) => res.json()),
    staleTime: 60_000, // treat the data as fresh for 1 minute
  });

  // Client state → useState (or Zustand / Context if shared)
  const [view, setView] = useState("grid");

  if (isPending) return <Spinner />;
  if (error) return <p>Something went wrong.</p>;
  return <ProductGrid products={products} view={view} onViewChange={setView} />;
}
```

**A third kind — URL state:** filters, search text, current page, sort order. Keep them in the **URL** (`?page=2&sort=price`), so users can share the link and the back button works.

> 💡 **Tip:** When you use TanStack Query or RTK Query for server state, most apps find they need very little global client state.

Deep dive: [DataFetchingPatterns.md](../DataFetchingPatterns.md)

---

## 33. How would you manage state in a large application?

**Short answer:** Don't put everything in one global store. **Choose the place for each piece of state by what kind of state it is**, and keep it as **close as possible** to where it's used.

| Kind of state | Where it goes | Examples |
|---|---|---|
| **Local UI state** | `useState` / `useReducer` in the component | Dropdown open, input value, hover |
| **Shared by a few nearby components** | Lift it to the closest common parent | Selected item shared by a list and a detail panel |
| **URL state** | URL search params | Filters, search, page number, sort, selected tab |
| **Server state** | TanStack Query / RTK Query | Users, products, orders |
| **Global client state, rarely changes** | Context | Theme, language, logged-in user |
| **Global client state, complex or changes often** | Zustand / Redux Toolkit | Shopping cart, multi-step wizard, editor state |
| **Form state** | React Hook Form (Q40) | Large forms with validation |
| **Derived state** | Don't store it — calculate it during render | `total = items.reduce(...)`, `filteredList` |

**How to decide (start at the top):**

```
Does only one component need it?           → useState
Do a few nearby components need it?        → lift state up
Should it be in the link / survive reload? → URL
Does it come from the server?              → TanStack Query / RTK Query
Is it used all over the app?               → Context (rarely changes) or Zustand/Redux (changes often)
```

**Example — URL state for filters (React Router):**

```jsx
import { useSearchParams } from "react-router-dom";

function ProductFilters() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "all";

  function changeCategory(value) {
    setParams((prev) => {
      prev.set("category", value);
      prev.set("page", "1"); // go back to page 1 when the filter changes
      return prev;
    });
  }

  return (
    <select value={category} onChange={(e) => changeCategory(e.target.value)}>
      <option value="all">All</option>
      <option value="shoes">Shoes</option>
    </select>
  );
}
// URL: /products?category=shoes&page=1 — shareable, and the back button works
```

**Other good practices:**

- **Normalize** big collections: store items by ID (`{ byId: { 1: {...} }, allIds: [1] }`), so updates are simple and there are no duplicates. RTK's `createEntityAdapter` does this for you.
- **One source of truth** — don't copy the same data into two places.
- **Store as little as possible** — if you can calculate it, don't store it.

> 💡 **Tip:** A strong answer: "Most state is local or server state. Only a small part is truly global. I pick the tool by the type of state."

Deep dive: [ContextAPI.md](../ContextAPI.md) · [ReduxToolkit.md](../ReduxToolkit.md)

---

## 34. What is prop drilling, and how can you avoid it?

**Short answer:** Prop drilling is passing props **through many components that don't use them**, just to get the data to a component deep in the tree. It makes code hard to change: if you rename the prop, you must edit every component in the chain.

**Example — prop drilling:**

```jsx
function App() {
  const [user, setUser] = useState({ name: "Asha", avatar: "/asha.png" });
  return <Layout user={user} />;
}

function Layout({ user }) {        // doesn't use user, just passes it
  return <Header user={user} />;
}

function Header({ user }) {        // doesn't use user, just passes it
  return <Avatar user={user} />;
}

function Avatar({ user }) {        // the only one that needs it
  return <img src={user.avatar} alt={user.name} />;
}
```

**Solution 1 — Component composition (try this first):** pass the **finished component** as `children` or a prop, so the middle components don't need to know about `user`.

```jsx
function App() {
  const [user, setUser] = useState({ name: "Asha", avatar: "/asha.png" });

  return (
    <Layout header={<Header avatar={<Avatar user={user} />} />}>
      <MainContent />
    </Layout>
  );
}

function Layout({ header, children }) {
  return (
    <>
      {header}
      <main>{children}</main>
    </>
  );
}

function Header({ avatar }) {
  return <header>Logo {avatar}</header>;
}
```

**Solution 2 — Context:** for data that many components at different levels need.

```jsx
const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState({ name: "Asha", avatar: "/asha.png" });
  return (
    <UserContext.Provider value={user}>
      <Layout />
    </UserContext.Provider>
  );
}

function Avatar() {
  const user = useContext(UserContext); // reads it directly, no drilling
  return <img src={user.avatar} alt={user.name} />;
}
```

**Solution 3 — A state library** (Zustand, Redux Toolkit) for complex global state.

| Solution | Use when |
|---|---|
| Composition (`children`, slots) | The middle components are just layout |
| Context | Many components need the same rarely-changing data |
| Zustand / Redux | The shared state is large or changes often |

**Note:** passing props 1–2 levels is **fine**. That's normal React. Fix it only when it becomes painful.

> 💡 **Tip:** Most people only say "use Context". Mentioning **composition first** makes your answer stand out.

Deep dive: [propDrilling.md](../propDrilling.md) · [ContextAPI.md](../ContextAPI.md)

---

## 35. How do you design reusable component APIs?

**Short answer:** A good reusable component is **easy to use correctly** and **flexible without too many props**. Main ideas:

| Principle | Example |
|---|---|
| **Good defaults** — works with zero config | `<Button>Save</Button>` just works |
| **Variants instead of many booleans** | `variant="danger"`, not `isPrimary isDanger isGhost` |
| **Composition over config** — use `children` and slots | `<Card><Card.Header /></Card>`, not `<Card headerTitle headerIcon headerAction />` |
| **Pass through native props** | `...rest` so `aria-label`, `type`, `onBlur` all work |
| **Accept a `ref`** | Parents can focus it or measure it |
| **Support controlled and uncontrolled use** | `value` + `onChange`, or `defaultValue` |
| **Clear naming** | `onX` for events (`onSelect`), `isX`/`hasX` for booleans |
| **Accessible by default** | Correct roles, labels and keyboard support built in |
| **Typed** | TypeScript props, so wrong usage shows an error |

**Example 1 — a flexible Button:**

```jsx
function Button({
  variant = "primary",   // good default
  size = "md",
  isLoading = false,
  disabled = false,
  children,
  className = "",
  ref,                   // React 19: ref is a normal prop (no forwardRef needed)
  ...rest                // type, onClick, disabled, aria-* ...
}) {
  return (
    <button
      ref={ref}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}

// Easy to use, and every native prop still works
<Button>Save</Button>
<Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
<Button type="submit" isLoading={saving} aria-label="Save profile">Save</Button>
```

**Example 2 — compound components (pieces that work together through Context):**

```jsx
const TabsContext = createContext(null);

function Tabs({ defaultValue, children }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

function Tab({ value, children }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button role="tab" aria-selected={active === value} onClick={() => setActive(value)}>
      {children}
    </button>
  );
}

function Panel({ value, children }) {
  const { active } = useContext(TabsContext);
  return active === value ? <div role="tabpanel">{children}</div> : null;
}

Tabs.Tab = Tab;
Tabs.Panel = Panel;

// Usage — the user decides the layout, and there's no long list of props
<Tabs defaultValue="profile">
  <Tabs.Tab value="profile">Profile</Tabs.Tab>
  <Tabs.Tab value="billing">Billing</Tabs.Tab>

  <Tabs.Panel value="profile"><ProfileForm /></Tabs.Panel>
  <Tabs.Panel value="billing"><BillingForm /></Tabs.Panel>
</Tabs>
```

**Warning sign:** if a component has 20+ props, or props like `showHeaderIcon` and `headerIconColor`, it should probably be split into smaller pieces.

> 💡 **Tip:** Libraries like **Radix UI** and **shadcn/ui** follow these patterns. Mentioning them shows you know real-world component design.

Deep dive: [ComponentsAndProps.md](../ComponentsAndProps.md) · [HOC-And-RenderProps.md](../HOC-And-RenderProps.md)

---

## 36. Controlled vs uncontrolled components?

**Short answer:**

- **Controlled** — **React state** holds the input's value. You pass `value` and `onChange`. React is the "single source of truth".
- **Uncontrolled** — the **DOM** holds the value. You set a starting value with `defaultValue` and read it when needed (with a `ref` or `FormData`).

```jsx
// Controlled
function ControlledInput() {
  const [name, setName] = useState("");
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}

// Uncontrolled
function UncontrolledInput() {
  const inputRef = useRef(null);
  const handleSubmit = () => alert(inputRef.current.value);
  return (
    <>
      <input defaultValue="" ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

| | Controlled | Uncontrolled |
|---|---|---|
| Value lives in | React state | The DOM |
| Props | `value` + `onChange` | `defaultValue` (+ `ref` or `FormData`) |
| Re-renders on each key press | ✅ Yes | ❌ No |
| Live validation / formatting | ✅ Easy | ❌ Harder |
| Change one field based on another | ✅ Easy | ❌ Harder |
| Performance in very large forms | Can be slower | Faster |
| Code needed | More | Less |

**When to use which:**

- **Controlled:** live validation, formatting as the user types (phone numbers), disabling the submit button, fields that depend on each other.
- **Uncontrolled:** simple forms where you only need the values on submit, very large forms (React Hook Form uses uncontrolled inputs for speed), and **`<input type="file">`** — it's always uncontrolled.

**Uncontrolled with React 19 form actions (no state at all):**

```jsx
function SignupForm() {
  async function signup(formData) {
    const email = formData.get("email");
    await api.signup(email);
  }

  return (
    <form action={signup}>
      <input name="email" type="email" defaultValue="" />
      <button type="submit">Sign up</button>
    </form>
  );
}
```

**Common bug — switching from uncontrolled to controlled:**

```jsx
// ❌ If user.name is undefined at first, the input starts uncontrolled,
//    then becomes controlled when the data arrives → React shows a warning
<input value={user.name} onChange={handleChange} />

// ✅ Always give a defined value
<input value={user.name ?? ""} onChange={handleChange} />
```

> 💡 **Tip:** For reusable components (like a custom `<Select>`), support **both**: use the `value` prop if it's given, otherwise keep internal state started from `defaultValue`. This is how most UI libraries work.

Basics: [Most asked Q8](../Most_Asked_Questions/01_Basics.md#8-what-is-the-difference-between-controlled-and-uncontrolled-components) · Deep dive: [ControlledVsUncontrolled.md](../ControlledVsUncontrolled.md)

---

## 37. What are Error Boundaries and their limitations?

**Short answer:** An Error Boundary is a component that **catches JavaScript errors in its child components during rendering** and shows a **fallback UI** instead of crashing the whole app (a blank white screen). It must be a **class component**, or you can use the **`react-error-boundary`** package.

**Limitations — what it does NOT catch:**

| Not caught | What to do instead |
|---|---|
| Errors in **event handlers** (`onClick`) | `try/catch` inside the handler |
| **Async code** (`setTimeout`, promises, `fetch`) | `try/catch` / `.catch()`, then show an error state — or pass the error to the boundary (below) |
| Errors in the **boundary itself** | Put another boundary above it |
| **Server-side rendering** errors | Handle them on the server |
| Errors **outside React** (plain scripts, `window` events) | `window.onerror` / `window.addEventListener("unhandledrejection", ...)` |

**Example — with `react-error-boundary` (what most teams use):**

```jsx
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong: {error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function Dashboard({ userId }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => logToSentry(error, info)} // report it
      resetKeys={[userId]}                                 // auto-reset when userId changes
    >
      <SalesWidget />
    </ErrorBoundary>
  );
}
```

**Passing async / event handler errors to the boundary:**

```jsx
function SalesWidget() {
  const { showBoundary } = useErrorBoundary();

  async function handleRefresh() {
    try {
      await refreshSales();
    } catch (error) {
      showBoundary(error); // now the nearest Error Boundary shows its fallback
    }
  }

  return <button onClick={handleRefresh}>Refresh</button>;
}
```

**Where to put boundaries:**

```
App-level boundary       → last safety net: "Something went wrong, reload"
  Route-level boundary   → one broken page doesn't break the navigation bar
    Widget-level boundary → one broken chart doesn't break the whole dashboard
```

**React 19 — global error reporting:**

```jsx
createRoot(document.getElementById("root"), {
  onCaughtError: (error, info) => logToSentry(error),   // caught by a boundary
  onUncaughtError: (error, info) => logToSentry(error), // no boundary caught it
}).render(<App />);
```

> 💡 **Tip:** Remember the short list: Error Boundaries miss **event handlers, async code, SSR and their own errors**.

Basics: [Most asked Q26](../Most_Asked_Questions/03_Advanced.md#26-what-is-an-error-boundary) · Deep dive: [ErrorBoundaries.md](../ErrorBoundaries.md)

---

## 38. How would you structure a scalable React codebase?

**Short answer:** Organize by **feature**, not by file type. Each feature (auth, cart, products) keeps its own components, hooks, API calls and state in **one folder**, with a public `index.js` that other code imports from. Shared, generic pieces (buttons, utilities) go in a `shared/` folder.

**Type-based (OK for small apps, messy for big ones):**

```
src/
  components/   ← 200 files from every feature mixed together
  hooks/
  services/
  pages/
```

**Feature-based (scales well):**

```
src/
  app/                      ← app setup
    App.jsx
    router.jsx
    providers.jsx           ← QueryClient, Theme, Auth providers
  features/
    auth/
      api/                  ← login(), logout(), getMe()
      components/           ← LoginForm.jsx, ProtectedRoute.jsx
      hooks/                ← useAuth.js
      store/                ← authSlice.js (if needed)
      index.js              ← public API: export { LoginForm, useAuth }
    cart/
      api/
      components/
      hooks/
      index.js
    products/
      ...
  pages/                    ← thin pages that combine features
    ProductPage.jsx
    CheckoutPage.jsx
  shared/                   ← used by many features, knows nothing about them
    ui/                     ← Button, Modal, Input (design system)
    hooks/                  ← useDebounce, useLocalStorage
    lib/                    ← apiClient.js, formatDate.js
  assets/
  styles/
```

**Rules that keep it clean:**

| Rule | Why |
|---|---|
| Features import other features only through their `index.js` | You can change a feature's insides without breaking others |
| `shared/` never imports from `features/` | Shared code stays generic |
| Keep tests, styles and stories next to the component | `Button.jsx`, `Button.test.jsx`, `Button.module.css` together |
| One API client (`shared/lib/apiClient.js`) | Base URL, auth headers and error handling in one place |
| Absolute imports (`@/features/cart`) | No `../../../../` |
| Enforce with tools | ESLint import rules (`eslint-plugin-boundaries`), TypeScript, Prettier |

**Comparison:**

| | By type | By feature |
|---|---|---|
| Find everything about "cart" | Search in 5 folders | One folder |
| Delete a feature | Hunt for files everywhere | Delete one folder |
| Team ownership | Hard | Easy — one team per feature folder |
| Good for | Small apps, demos | Medium and large apps |

> 💡 **Tip:** Mention **colocation** ("keep things that change together, close together") and the **public `index.js`** per feature. Those two ideas are the heart of a scalable structure.

---

## 39. How do you handle API caching and request deduplication?

**Short answer:**

- **Caching** — save a response (by a key, like the URL) and reuse it instead of fetching again. A common strategy is **stale-while-revalidate**: show the cached data **immediately**, then refetch in the background and update if it changed.
- **Deduplication** — if several components ask for the **same data at the same time**, send **only one request** and share the result.

In real apps, use **TanStack Query**, **RTK Query** or **SWR**. They do both automatically.

**How it works (a simple version, to understand the idea):**

```js
const cache = new Map();    // url → { data, time }
const inFlight = new Map(); // url → Promise (requests still running)

async function cachedFetch(url, maxAge = 60_000) {
  // 1. Fresh data in the cache? Use it.
  const hit = cache.get(url);
  if (hit && Date.now() - hit.time < maxAge) return hit.data;

  // 2. Same request already running? Share it (deduplication).
  if (inFlight.has(url)) return inFlight.get(url);

  // 3. Otherwise make the request.
  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cache.set(url, { data, time: Date.now() });
      return data;
    })
    .finally(() => inFlight.delete(url));

  inFlight.set(url, promise);
  return promise;
}

// 3 components call this at the same time → only 1 network request
```

**With TanStack Query (what you'd use in a real app):**

```jsx
function useUser(id) {
  return useQuery({
    queryKey: ["user", id],                  // the cache key
    queryFn: () => fetch(`/api/users/${id}`).then((res) => res.json()),
    staleTime: 5 * 60_000,                   // fresh for 5 minutes → no refetch
    gcTime: 30 * 60_000,                     // remove from memory 30 min after no one uses it
  });
}

// Header, Sidebar and Profile all call useUser(1) → ONE request, shared cache
```

**Updating the cache after a change (invalidation):**

```jsx
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user) =>
      fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      }),
    onSuccess: (_, user) => {
      // mark the cached user as stale → it refetches automatically
      queryClient.invalidateQueries({ queryKey: ["user", user.id] });
    },
  });
}
```

**What these libraries give you:**

| Feature | Meaning |
|---|---|
| Caching by key | Same key → same cached data |
| Deduplication | Same key requested at the same time → one request |
| Stale-while-revalidate | Show cached data now, refresh in the background |
| Refetch on window focus / reconnect | Data stays fresh when the user comes back |
| Invalidation | Refetch related data after a change |
| Retries | Failed requests try again automatically |
| Prefetching | Load data before the user needs it (e.g. on hover) |

**Other layers of caching:** HTTP cache headers (`Cache-Control`, `ETag`), a CDN for public data, and server-side caching (Redis).

> 💡 **Tip:** Say: "I treat API data as **server state** and use TanStack Query or RTK Query. They handle caching, deduplication and invalidation, so I don't build it myself."

Deep dive: [DataFetchingPatterns.md](../DataFetchingPatterns.md) · [ReduxToolkit.md](../ReduxToolkit.md) · [Caching.md](../../Node_Backend_Questions/Caching.md)

---

## 40. How do you manage complex forms efficiently?

**Short answer:** Use a form library — **React Hook Form** is the most popular — together with a **schema validator** like **Zod**. React Hook Form uses **uncontrolled inputs**, so typing in one field **doesn't re-render the whole form**. Zod keeps all validation rules in one place. For huge forms, split them into sections or steps.

**Problems with doing it by hand (`useState` for every field):**

- Every key press re-renders the whole form → slow with 50+ fields.
- Lots of repeated code for values, errors, "touched" state and submit state.
- Validation logic spread everywhere.

**Example — React Hook Form + Zod, with a dynamic list of fields:**

```jsx
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phones: z.array(
    z.object({ number: z.string().min(10, "Phone must have 10 digits") })
  ),
});

function ProfileForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phones: [{ number: "" }] },
    mode: "onBlur", // validate when the user leaves a field, not on every key press
  });

  const { fields, append, remove } = useFieldArray({ control, name: "phones" });

  async function onSubmit(data) {
    await api.saveProfile(data); // data is already validated
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="name">Name</label>
      <input id="name" {...register("name")} aria-invalid={!!errors.name} />
      {errors.name && <p role="alert">{errors.name.message}</p>}

      <label htmlFor="email">Email</label>
      <input id="email" {...register("email")} aria-invalid={!!errors.email} />
      {errors.email && <p role="alert">{errors.email.message}</p>}

      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`phones.${index}.number`)} placeholder="Phone" />
          <button type="button" onClick={() => remove(index)}>Remove</button>
          {errors.phones?.[index]?.number && (
            <p role="alert">{errors.phones[index].number.message}</p>
          )}
        </div>
      ))}
      <button type="button" onClick={() => append({ number: "" })}>Add phone</button>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

**Tips for big forms:**

| Tip | Why |
|---|---|
| Validate **on blur or submit**, not on every key press | Fewer re-renders, less annoying for users |
| Use `useWatch` in a small child instead of `watch` at the top | Only that child re-renders when the watched field changes |
| Split into **steps or sections** | Easier for users, and only one section is on screen |
| **Debounce async checks** ("is this username taken?") | Don't call the API on every letter |
| **Save drafts** (localStorage or server) | Users don't lose work on a long form |
| Reuse the **same Zod schema on the server** | One set of rules, and the server must validate too |
| Accessibility: `<label>`, `aria-invalid`, `role="alert"` for errors | Screen-reader users can fill the form |

**For simple forms in React 19:** form **Actions** with `useActionState` and `useFormStatus` handle submit state and errors without a library.

> 💡 **Tip:** Say: "React Hook Form for speed (uncontrolled inputs), Zod for validation, and the same schema on the server."

Deep dive: [ControlledVsUncontrolled.md](../ControlledVsUncontrolled.md)

---

[← Part 3: Performance](03_Performance.md) · [Back to the list](README.md) · [Part 5: SSR, Security & More →](05_SSR_Security.md)
