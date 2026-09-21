# Next.js Routing and Special Files (App Router)

## 1. What is File-Based Routing?

**Definition:** File-based routing means the **folder and file structure defines the URLs** of your application. You never write a route configuration file — creating a folder creates a route.

**In simple words:** The path of the file on disk is the path in the browser.

```
app/
├── page.js                    → /
├── about/page.js              → /about
├── blog/page.js               → /blog
├── blog/[slug]/page.js        → /blog/my-first-post
└── dashboard/settings/page.js → /dashboard/settings
```

**The key rule:** a folder only becomes a public route when it contains a `page.js` file.

---

## 2. The special files

**Definition:** Next.js reserves certain filenames inside the `app/` directory. Each one has a specific job in the route's UI.

| File | Definition |
|---|---|
| **`page.js`** | The unique UI of a route. **Required** to make the route publicly accessible. |
| **`layout.js`** | Shared UI that wraps a page and all its child routes. It does **not** re-render on navigation. |
| **`template.js`** | Like a layout, but it **does** create a new instance on every navigation (state is reset). |
| **`loading.js`** | Automatic loading UI, shown while the page's data is being fetched. Wraps the page in `<Suspense>`. |
| **`error.js`** | Error UI for this route segment. Must be a Client Component. Wraps the page in an Error Boundary. |
| **`not-found.js`** | UI shown when `notFound()` is called or a route does not exist. |
| **`global-error.js`** | Catches errors in the **root layout** itself. Must include its own `<html>` and `<body>`. |
| **`route.js`** | An API endpoint (a Route Handler). Cannot exist in the same folder as `page.js`. |
| **`default.js`** | Fallback UI for parallel routes. |

**Rendering order — how they nest:**

```
<Layout>
  <ErrorBoundary fallback={<Error />}>
    <Suspense fallback={<Loading />}>
      <Page />
    </Suspense>
  </ErrorBoundary>
</Layout>
```

---

## 3. `layout.js` — shared UI

**Definition:** A layout wraps its page and every nested route below it. Layouts **preserve state** and do not re-render when the user navigates between the pages inside them.

```jsx
// app/layout.js - the ROOT layout is required, and must have <html> and <body>
export const metadata = { title: "My App" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

```jsx
// app/dashboard/layout.js - a nested layout
export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard">
      <Sidebar />              {/* stays mounted across all dashboard pages */}
      <main>{children}</main>
    </div>
  );
}
```

**The nesting result:**
```
RootLayout
  └── DashboardLayout
        └── Page
```

**layout vs template:**

| | `layout.js` | `template.js` |
|---|---|---|
| Re-mounts on navigation | ❌ No | ✅ Yes |
| Preserves state | ✅ Yes | ❌ No |
| Effects re-run | No | Yes, every navigation |
| Use for | Navbars, sidebars | Page-entry animations, per-page analytics |

---

## 4. `loading.js` — automatic loading UI

**Definition:** Creating a `loading.js` file automatically wraps the page in a `<Suspense>` boundary, using its export as the fallback. It appears instantly while the server component fetches data.

```jsx
// app/dashboard/loading.js
export default function Loading() {
  return <DashboardSkeleton />;   // a skeleton is better UX than a spinner
}
```

That is all — no imports, no wiring. Next.js does the rest.

**Manual Suspense for finer control:**

```jsx
export default function Page() {
  return (
    <>
      <Header />                             {/* shows instantly */}
      <Suspense fallback={<StatsSkeleton />}>
        <SlowStats />                        {/* streams in when ready */}
      </Suspense>
    </>
  );
}
```

---

## 5. `error.js` — error handling

**Definition:** An error file creates an Error Boundary around the route segment. It **must** be a Client Component and receives two props: `error` and `reset`.

```jsx
"use client";                    // required

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);        // log to your error service
  }, [error]);

  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

**Definition of `reset()`:** A function that attempts to re-render the route segment, giving the user a way to recover without a full page reload.

**Important:** `error.js` does **not** catch errors thrown in the layout of the *same* segment — those need an `error.js` in the parent, or a `global-error.js` at the root.

---

## 6. `not-found.js` and the `notFound()` function

```jsx
// app/blog/[slug]/page.js
import { notFound } from "next/navigation";

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);

  if (!post) notFound();         // immediately renders the nearest not-found.js

  return <article>{post.content}</article>;
}
```

```jsx
// app/not-found.js
import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h2>Page not found</h2>
      <Link href="/">Return home</Link>
    </div>
  );
}
```

---

## 7. Dynamic routes

**Definition:** A folder name wrapped in square brackets creates a dynamic segment that matches any value. The value is available in the `params` object.

### a) `[slug]` — single dynamic segment

```
app/blog/[slug]/page.js   →   /blog/hello-world
```

```jsx
export default async function Page({ params }) {
  const { slug } = await params;    // params is a Promise in Next.js 15+
  return <h1>Post: {slug}</h1>;
}
```

### b) `[...slug]` — catch-all

**Definition:** Matches one **or more** path segments and gives them as an array.

```
app/docs/[...slug]/page.js
  /docs/a         → { slug: ["a"] }
  /docs/a/b/c     → { slug: ["a", "b", "c"] }
  /docs           → ❌ 404 (needs at least one segment)
```

### c) `[[...slug]]` — optional catch-all

**Definition:** The same, but it also matches the **parent path with no segments at all**.

```
app/shop/[[...filters]]/page.js
  /shop           → { filters: undefined }   ✅ matches
  /shop/shoes     → { filters: ["shoes"] }
  /shop/shoes/red → { filters: ["shoes", "red"] }
```

### `generateStaticParams`

**Definition:** Tells Next.js which dynamic paths to pre-build at build time (the App Router replacement for `getStaticPaths`).

```jsx
export async function generateStaticParams() {
  const posts = await fetch("https://api.com/posts").then((r) => r.json());
  return posts.map((post) => ({ slug: post.slug }));
}
```

---

## 8. Route Groups — `(folder)`

**Definition:** A folder wrapped in **parentheses** organises files **without affecting the URL**. It is used to apply different layouts to different sections.

```
app/
├── (marketing)/
│   ├── layout.js          ← marketing layout
│   ├── page.js            → /            (NOT /marketing)
│   └── about/page.js      → /about
└── (shop)/
    ├── layout.js          ← a completely different shop layout
    └── products/page.js   → /products
```

**Use it for:** grouping routes by section, applying separate layouts, or organising a large team's files.

---

## 9. Private folders — `_folder`

**Definition:** A folder starting with an underscore is **excluded from routing**. Use it to keep components, utilities and tests next to the routes that use them.

```
app/
├── _components/     ← not a route
├── _lib/            ← not a route
└── dashboard/page.js
```

---

## 10. Parallel routes — `@folder`

**Definition:** Parallel routes render **two or more pages in the same layout at the same time**, each with its own independent loading and error states.

```
app/
├── layout.js
├── page.js
├── @analytics/page.js
└── @team/page.js
```

```jsx
// app/layout.js - each slot is received as a prop
export default function Layout({ children, analytics, team }) {
  return (
    <>
      {children}
      <div className="grid">
        {analytics}
        {team}
      </div>
    </>
  );
}
```

**Use for:** dashboards with independent panels, modals that keep the background page, and conditional layouts (for example admin vs user views).

---

## 11. Intercepting routes — `(.)folder`

**Definition:** Intercepting routes let you show a route's content in a **different context** — most commonly opening a photo in a modal while keeping the feed behind it, yet still having a real shareable URL.

| Pattern | Meaning |
|---|---|
| `(.)folder` | Intercept the same level |
| `(..)folder` | Intercept one level up |
| `(..)(..)folder` | Intercept two levels up |
| `(...)folder` | Intercept from the app root |

```
app/
├── feed/page.js
├── photo/[id]/page.js              ← full page (direct visit / refresh)
└── feed/@modal/(..)photo/[id]/page.js  ← modal (clicked from the feed)
```

**Behaviour:** clicking a photo in the feed opens a modal; refreshing that URL shows the full page. This is exactly how Instagram works.

---

## 12. Navigation

### `<Link>`

**Definition:** The component for client-side navigation. It **prefetches** the linked route automatically when it appears in the viewport, making navigation feel instant.

```jsx
import Link from "next/link";

<Link href="/about">About</Link>
<Link href={`/blog/${slug}`}>Read more</Link>
<Link href="/dashboard" prefetch={false}>Dashboard</Link>
<Link href="/login" replace>Login</Link>   {/* replaces instead of pushing */}
```

### `useRouter()`

**Definition:** A hook for navigating from code. In the App Router it is imported from `next/navigation` (not `next/router`).

```jsx
"use client";
import { useRouter } from "next/navigation";

const router = useRouter();

router.push("/dashboard");        // navigate
router.replace("/login");         // navigate without adding history
router.back();                    // go back
router.refresh();                 // refetch server components, keep client state
router.prefetch("/settings");     // manually prefetch
```

### `usePathname()` and `useSearchParams()`

```jsx
"use client";
import { usePathname, useSearchParams } from "next/navigation";

const pathname = usePathname();            // "/blog/my-post"
const searchParams = useSearchParams();
const page = searchParams.get("page");     // "?page=2" → "2"

// Highlight the active nav link
<Link className={pathname === "/about" ? "active" : ""} href="/about">About</Link>
```

### `redirect()` — server side

```jsx
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getUser();
  if (!user) redirect("/login");     // works in Server Components and Server Actions
  return <Dashboard user={user} />;
}
```

---

## Key points

- The **folder structure is the routing table**; `page.js` makes a route public.
- **`layout.js`** persists across navigation; **`template.js`** remounts every time.
- **`loading.js`** and **`error.js`** give you Suspense and Error Boundaries for free.
- `[slug]`, `[...slug]` and `[[...slug]]` handle dynamic, catch-all and optional routes.
- `(group)` organises without changing URLs; `_folder` is excluded from routing.
- `@slot` renders parallel routes; `(.)folder` intercepts routes for modals.
- Use `<Link>` (auto-prefetching) and `useRouter` from **`next/navigation`**.
