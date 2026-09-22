# Data Fetching — Loading States, Pagination, Filtering and Caching

The most common real-world React interview topic, and the one candidates handle worst. Fetching data is easy; handling every state it can be in is not.

---

## 1. The four states of any request

**Definition:** Every API call has four possible states, and production UI must handle all of them. Most candidates handle only two.

| State | UI |
|---|---|
| **idle** | Nothing requested yet |
| **loading** | Spinner or skeleton |
| **success (with data)** | The content |
| **success (empty)** | "No results found" — **not** the same as loading |
| **error** | Message + a retry action |

```jsx
// ❌ The usual naive version
function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);

  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

**Everything wrong with it:** no loading state, no error handling, `fetch` does not reject on 404/500, no cleanup (race condition), and an empty result looks identical to loading.

```jsx
// ✅ Handling every state
function Users() {
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState({ status: "loading", data: null, error: null });
      try {
        const res = await fetch("/api/users", { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);   // fetch won't throw
        const data = await res.json();
        setState({ status: "success", data, error: null });
      } catch (err) {
        if (err.name === "AbortError") return;   // cancelled - not an error
        setState({ status: "error", data: null, error: err.message });
      }
    }

    load();
    return () => controller.abort();             // cleanup on unmount
  }, []);

  if (state.status === "loading") return <Skeleton />;
  if (state.status === "error") return <Error msg={state.error} onRetry={load} />;
  if (!state.data?.length) return <EmptyState />;

  return <ul>{state.data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

> **Why one state object instead of three `useState` calls?** It makes impossible combinations unrepresentable — you can never have `loading: true` and `error: "..."` at the same time.

---

## 2. Race conditions

**Definition:** A race condition occurs when two requests are in flight and the **slower, older one resolves last**, overwriting newer data.

```
User clicks user 1 → request A starts (slow)
User clicks user 2 → request B starts (fast)
B resolves → shows user 2  ✅
A resolves → overwrites with user 1  ❌ wrong data on screen
```

**Two fixes:**

```jsx
// 1. AbortController - cancels the old request
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setUser)
    .catch((e) => { if (e.name !== "AbortError") setError(e); });

  return () => controller.abort();
}, [id]);

// 2. An ignore flag - simpler, works for non-fetch promises
useEffect(() => {
  let ignore = false;
  fetchUser(id).then((data) => { if (!ignore) setUser(data); });
  return () => { ignore = true; };
}, [id]);
```

**This is the single most asked follow-up** after "how do you fetch data". Volunteer it before they ask.

---

## 3. Pagination

**Definition of Offset pagination:** Skip N rows, take M. Simple, allows jumping to a page number, but **slow at depth** — the database must scan and discard every skipped row.

**Definition of Cursor pagination:** Fetch items after a known marker (an id or timestamp). Fast at any depth because it uses the index directly, but you cannot jump to "page 50".

```jsx
// Offset - classic numbered pages
function UserList() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, loading } = useFetch(`/api/users?page=${page}&limit=${limit}`);

  return (
    <>
      {loading ? <Skeleton /> : <List items={data.users} />}
      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
      <span>Page {page} of {Math.ceil(data?.total / limit)}</span>
      <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
    </>
  );
}
```

```jsx
// Cursor - infinite scroll / "load more"
function Feed() {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  async function loadMore() {
    const res = await fetch(`/api/feed?cursor=${cursor ?? ""}&limit=20`);
    const { data, nextCursor } = await res.json();

    setItems((prev) => [...prev, ...data]);   // APPEND, don't replace
    setCursor(nextCursor);
    setHasMore(Boolean(nextCursor));
  }

  return (
    <>
      <List items={items} />
      {hasMore && <button onClick={loadMore}>Load more</button>}
    </>
  );
}
```

| | Offset | Cursor |
|---|---|---|
| Jump to page N | ✅ | ❌ |
| Performance at depth | ❌ Slow | ✅ Fast |
| Stable if items are inserted | ❌ Items shift/duplicate | ✅ Stable |
| Best for | Admin tables | Feeds, infinite scroll |

> **The offset bug worth mentioning:** if a new item is inserted while the user is on page 2, one item shifts to page 3 and they see it twice. Cursor pagination does not have this problem.

---

## 4. Filtering and search

**Definition:** Filtering can happen on the **client** (fast, but requires all data) or the **server** (scales, but needs a request per change).

```jsx
// Client-side - fine for a few hundred items already loaded
const filtered = useMemo(
  () => users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase())),
  [users, query]                       // useMemo so it doesn't re-filter every render
);
```

```jsx
// Server-side - debounced so you don't fire a request per keystroke
function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetchResults(debouncedQuery);      // runs 500ms after typing stops
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

**Two rules:** always **debounce** server-side search, and **reset the page to 1** whenever a filter changes — otherwise the user sits on page 5 of a result set with 2 pages.

```jsx
function handleFilterChange(newFilter) {
  setFilter(newFilter);
  setPage(1);              // ← easily forgotten, very visible bug
}
```

**Keeping filters in the URL** makes them shareable and survives refresh:

```jsx
const [searchParams, setSearchParams] = useSearchParams();
const category = searchParams.get("category") ?? "all";
```

---

## 5. Caching

**Definition:** Caching avoids refetching data you already have. Without it, navigating away and back refetches everything and the user sees a spinner for data that has not changed.

**What a naive `useEffect` cannot do:**

| Feature | Manual `useEffect` | React Query / SWR |
|---|---|---|
| Caching | ❌ Refetch every mount | ✅ |
| Deduplication | ❌ 3 components = 3 requests | ✅ One request |
| Background refetch | ❌ | ✅ Stale-while-revalidate |
| Retry on failure | ❌ Manual | ✅ Built in |
| Race conditions | ❌ Manual | ✅ Handled |
| Pagination helpers | ❌ Manual | ✅ |
| Optimistic updates | ❌ Manual | ✅ |

```jsx
// React Query - all of the above, in four lines
function Users({ page }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["users", page],              // the cache key
    queryFn: () => fetchUsers(page),
    staleTime: 5 * 60 * 1000,               // treat as fresh for 5 min
    placeholderData: (prev) => prev,        // keep old page visible while loading
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error onRetry={refetch} />;
  return <List items={data.users} />;
}
```

**Definition of `staleTime`:** How long cached data is considered fresh. Within it, no refetch happens at all.
**Definition of stale-while-revalidate:** Show the cached data **immediately**, refetch in the background, then update. The user never sees a spinner for data they have already seen.

> **The interview answer:** *"I'd use React Query rather than raw `useEffect`, because caching, deduplication, retries and race conditions are already solved there — and getting them right by hand is where the bugs come from."* That signals production experience.

---

## 6. Optimistic updates

**Definition:** Update the UI **immediately** as if the request succeeded, then roll back if it fails. It makes the app feel instant.

```jsx
async function toggleLike(postId) {
  const previous = posts;

  setPosts((p) => p.map((post) =>          // update UI instantly
    post.id === postId ? { ...post, liked: !post.liked } : post
  ));

  try {
    await api.toggleLike(postId);
  } catch {
    setPosts(previous);                     // roll back on failure
    toast.error("Could not update");
  }
}
```

Good for likes and toggles where failure is rare and reversible. **Bad for payments** — never show success for something that might not have happened.

---

## 7. Where should the data live?

| Data | Where |
|---|---|
| **Server data** (API responses) | React Query / SWR / RTK Query — **not** in Redux |
| Global UI state (theme, sidebar) | Context |
| Form input | Local state or React Hook Form |
| Filters and pagination | **URL** (`useSearchParams`) — shareable, survives refresh |
| Truly global client state | Redux Toolkit / Zustand |

> **A point worth making:** server data is not really "state" — it is a **cache** of something owned elsewhere. Putting it in Redux means hand-writing caching, invalidation and loading flags that a data library gives you for free.

---

## Key points

- Handle **all** states: loading, error, empty and success — empty is not loading.
- **`fetch` does not reject on 404/500** — check `res.ok`.
- Always clean up with **`AbortController`** or an ignore flag to prevent **race conditions**.
- Offset pagination is simple but slow and unstable; **cursor pagination** is fast and stable.
- **Reset the page to 1** whenever filters change.
- **Debounce** server-side search; `useMemo` client-side filtering.
- Keep filters and pagination **in the URL** so they are shareable.
- Use **React Query/SWR** for server data — caching, deduplication, retries and races are already solved.
- **Optimistic updates** for cheap reversible actions, never for payments.

**Related:** [useEffectDeepDive.md](useEffectDeepDive.md) · [PerformanceOptimization.md](PerformanceOptimization.md) · [ReduxToolkit.md](ReduxToolkit.md) · [Throttling.md](../JavaScript_Interview_Questions/Throttling.md)
