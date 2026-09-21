# Data Fetching and Caching in Next.js

## 1. Data fetching in the App Router

**Definition:** In the App Router, data is fetched directly inside **async Server Components** using `await`. There is no `getServerSideProps`, no `useEffect`, and no loading state to manage manually.

```jsx
// app/posts/page.js - a Server Component
export default async function PostsPage() {
  const res = await fetch("https://api.com/posts");   // runs on the SERVER
  const posts = await res.json();

  return (
    <ul>
      {posts.map((p) => <li key={p.id}>{p.title}</li>)}
    </ul>
  );
}
```

**What this gives you for free:**
- No `useState` / `useEffect` boilerplate
- No loading flicker — the HTML arrives with data already in it
- API keys stay on the server
- The fetching code is never sent to the browser

**Direct database access is also allowed:**

```jsx
import db from "@/lib/db";

export default async function UsersPage() {
  const users = await db.user.findMany();   // no API route needed at all
  return <UserList users={users} />;
}
```

---

## 2. The four caching layers

**Definition:** Next.js caches at four different levels. Knowing which one you are dealing with is the key to debugging "why is my data stale?".

| Cache | What it stores | Where | How to control it |
|---|---|---|---|
| **Request Memoization** | Identical `fetch` calls in one render pass | Server, per request | Automatic |
| **Data Cache** | The result of `fetch` across requests and users | Server, persistent | `cache`, `revalidate` options |
| **Full Route Cache** | The rendered HTML and RSC payload | Server, at build time | `dynamic`, `revalidate` |
| **Router Cache** | Visited routes for instant back/forward | Browser, in memory | `router.refresh()` |

---

## 3. Request Memoization

**Definition:** If the **same URL** is fetched multiple times during a single render pass, Next.js runs the request only **once** and reuses the result. This means you do not have to pass data down through props just to avoid duplicate requests.

```jsx
// lib/data.js
export async function getUser(id) {
  const res = await fetch(`https://api.com/users/${id}`);
  return res.json();
}

// Called in three different components during the same render...
const user = await getUser(1);   // Layout   → actual network request
const user = await getUser(1);   // Page     → reused from memory
const user = await getUser(1);   // Sidebar  → reused from memory
// Only ONE network request is made.
```

**For non-fetch calls (like a database query), wrap it in React's `cache()`:**

```jsx
import { cache } from "react";

export const getUser = cache(async (id) => {
  return await db.user.findUnique({ where: { id } });
});
```

---

## 4. The Data Cache — controlling freshness

**Definition:** The Data Cache stores fetch results on the server **across requests and across users**, persisting even between deployments unless revalidated.

```jsx
// 1. STATIC (default in Next 14 and below) - cached indefinitely
fetch(url)
fetch(url, { cache: "force-cache" })

// 2. DYNAMIC - never cached, fresh on every request
fetch(url, { cache: "no-store" })

// 3. TIME-BASED (ISR) - revalidate after N seconds
fetch(url, { next: { revalidate: 60 } })

// 4. TAG-BASED - revalidate on demand from anywhere
fetch(url, { next: { tags: ["posts"] } })
```

> **Note on versions:** in Next.js 14 and earlier, `fetch` was cached by default. In **Next.js 15** the default changed to **no caching** — you now opt in with `force-cache`. Always check which version a project uses.

---

## 5. Revalidation

### a) Time-based revalidation

```jsx
// Per fetch
const res = await fetch(url, { next: { revalidate: 3600 } });   // 1 hour

// Per route (applies to the whole page)
export const revalidate = 3600;
```

**How it behaves (stale-while-revalidate):** the first visitor after the time expires still gets the **cached** page instantly, and the page regenerates in the background. The *next* visitor gets the fresh version. Nobody waits.

### b) On-demand revalidation

**Definition:** Clear the cache immediately when content actually changes — triggered by a CMS webhook or a Server Action.

```jsx
// app/api/revalidate/route.js
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request) {
  const { secret, path, tag } = await request.json();

  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: "Invalid secret" }, { status: 401 });
  }

  if (path) revalidatePath(path);    // refresh a specific page
  if (tag) revalidateTag(tag);       // refresh everything with this tag

  return Response.json({ revalidated: true, now: Date.now() });
}
```

**Definition of `revalidatePath(path)`:** Clears the cache for one route.
**Definition of `revalidateTag(tag)`:** Clears every cached fetch that was tagged with that string.

**Tags in practice:**

```jsx
// Tag the data when fetching
await fetch("https://api.com/posts", { next: { tags: ["posts"] } });
await fetch(`https://api.com/posts/${id}`, { next: { tags: ["posts", `post-${id}`] } });

// Later, in a Server Action after creating a post
"use server";
export async function createPost(formData) {
  await db.post.create({ data: { title: formData.get("title") } });
  revalidateTag("posts");      // every page showing posts refreshes automatically
}
```

---

## 6. Parallel vs sequential fetching

**Definition (Sequential):** Each request waits for the previous one to finish. Total time is the sum of all of them. This is called a **waterfall**.

**Definition (Parallel):** All requests start at once. Total time equals the slowest one.

```jsx
// ❌ SEQUENTIAL - 3 seconds total
export default async function Page() {
  const user = await getUser();        // 1s
  const posts = await getPosts();      // 1s (starts only after user finishes)
  const comments = await getComments(); // 1s
}

// ✅ PARALLEL - ~1 second total
export default async function Page() {
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ]);
}

// ✅ Or start them early and await later
export default async function Page() {
  const userPromise = getUser();       // starts immediately, not awaited
  const postsPromise = getPosts();

  const user = await userPromise;
  const posts = await postsPromise;
}
```

**A sequential fetch is only correct when the second request genuinely depends on the first:**

```jsx
const user = await getUser(id);
const posts = await getPostsByAuthor(user.authorId);  // needs user first - fine
```

---

## 7. Streaming with Suspense

**Definition:** Streaming sends the page HTML in pieces as each section becomes ready, instead of waiting for the slowest query. Fast content appears immediately and slow parts stream in.

```jsx
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <div>
      <Header />                                 {/* instant */}

      <Suspense fallback={<StatsSkeleton />}>
        <SlowStats />                            {/* streams in */}
      </Suspense>

      <Suspense fallback={<FeedSkeleton />}>
        <SlowFeed />                             {/* streams independently */}
      </Suspense>
    </div>
  );
}

async function SlowStats() {
  const stats = await getStats();               // takes 3 seconds
  return <StatsView stats={stats} />;
}
```

**Without streaming:** the user stares at a blank page for 3 seconds.
**With streaming:** the header appears in ~100ms, skeletons show, then each section fills in.

---

## 8. Client-side data fetching

**Definition:** Use client-side fetching when data depends on user interaction, needs polling, or is private per-user and does not need SEO.

```jsx
"use client";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((r) => r.json());

function LiveStock({ productId }) {
  const { data, error, isLoading } = useSWR(
    `/api/stock/${productId}`,
    fetcher,
    { refreshInterval: 5000 }     // poll every 5 seconds
  );

  if (isLoading) return <Spinner />;
  return <p>In stock: {data.count}</p>;
}
```

**Server vs client fetching — which to use:**

| Situation | Where to fetch |
|---|---|
| Initial page content | **Server** |
| SEO-relevant data | **Server** |
| Anything using secrets | **Server** |
| Data that changes on user interaction | Client |
| Real-time / polling | Client |
| Infinite scroll, search-as-you-type | Client |

---

## 9. Pages Router data fetching (legacy but still asked)

```jsx
// getServerSideProps - SSR, runs on every request
export async function getServerSideProps(context) {
  const { params, query, req, res } = context;
  const data = await fetchData(params.id);

  if (!data) return { notFound: true };
  // return { redirect: { destination: "/login", permanent: false } };

  return { props: { data } };
}

// getStaticProps - SSG/ISR, runs at build time
export async function getStaticProps({ params }) {
  const data = await fetchData(params.id);
  return {
    props: { data },
    revalidate: 60,          // adding this turns SSG into ISR
  };
}

// getStaticPaths - which dynamic paths to pre-build
export async function getStaticPaths() {
  const posts = await fetchPosts();
  return {
    paths: posts.map((p) => ({ params: { id: p.id.toString() } })),
    fallback: "blocking",
  };
}
```

**Definition of the `fallback` values:**
- **`false`** — any path not listed returns a 404.
- **`true`** — shows a fallback page immediately, then swaps in the real content once generated.
- **`"blocking"`** — waits on the server for the page to generate, then sends the complete HTML (no fallback flash). Usually the best choice.

---

## 10. Debugging caching problems

```jsx
// "My data is stale!" checklist:
// 1. Is the fetch cached?
fetch(url, { cache: "no-store" })                 // force fresh

// 2. Is the whole route static?
export const dynamic = "force-dynamic";           // force SSR

// 3. Is the browser Router Cache serving old content?
router.refresh();                                 // refetch server components

// 4. Did you forget to revalidate after a mutation?
revalidatePath("/posts");
```

**Useful logging in `next.config.js`:**

```js
module.exports = {
  logging: {
    fetches: { fullUrl: true },   // shows every fetch and whether it was cached
  },
};
```

---

## Key points

- Fetch data directly in **async Server Components** with `await`.
- There are **four cache layers**: request memoization, data cache, full route cache, router cache.
- Control freshness with `cache: "no-store"`, `next: { revalidate: N }` or tags.
- `revalidatePath` / `revalidateTag` clear the cache on demand after a mutation.
- Use `Promise.all` to avoid **waterfalls** — sequential awaits are a common performance bug.
- Use **Suspense** to stream slow sections instead of blocking the whole page.
- Next.js 15 changed the fetch default from cached to **uncached** — check your version.
