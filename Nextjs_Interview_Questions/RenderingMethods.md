# Rendering Methods in Next.js - CSR, SSR, SSG, ISR

This is the **most asked Next.js interview topic**. Next.js lets you choose a different rendering strategy for each page.

---

## 1. CSR — Client-Side Rendering

**Definition:** The server sends an almost empty HTML file plus a JavaScript bundle. The browser downloads the JavaScript, runs React, fetches the data, and only then builds the page.

**In simple words:** The shop is empty when you arrive, and the staff start arranging everything after you walk in.

**The flow:**
```
Request → empty HTML → download JS → run React → fetch data → show content
```

```jsx
"use client";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <Spinner />;
  return <DashboardView data={data} />;
}
```

| Pros | Cons |
|---|---|
| Very interactive after loading | Poor SEO (crawlers may see an empty page) |
| Less server load | Slow first paint / blank screen |
| Good for private, logged-in pages | Large JavaScript bundle |

**Use for:** dashboards, admin panels, anything behind a login where SEO does not matter.

---

## 2. SSR — Server-Side Rendering

**Definition:** The HTML is generated on the **server for every single request**. The user (and search engines) receive a fully rendered page immediately.

**In simple words:** The shop is arranged fresh for each customer, just before they walk in.

**The flow:**
```
Request → server fetches data → server renders HTML → send full HTML → hydrate
```

```jsx
// App Router - a Server Component with a no-store fetch = SSR
export default async function ProfilePage() {
  const res = await fetch("https://api.com/profile", { cache: "no-store" });
  const profile = await res.json();

  return <h1>{profile.name}</h1>;
}
```

```jsx
// Pages Router - getServerSideProps
export async function getServerSideProps(context) {
  const res = await fetch(`https://api.com/user/${context.params.id}`);
  const user = await res.json();

  return { props: { user } };   // passed to the page component
}

export default function Profile({ user }) {
  return <h1>{user.name}</h1>;
}
```

| Pros | Cons |
|---|---|
| Always fresh data | Slower response (server works on every request) |
| Excellent SEO | Higher server cost |
| Good for personalised content | Cannot be served from a CDN cache |

**Use for:** user dashboards with fresh data, personalised feeds, pages showing live prices or stock.

---

## 3. SSG — Static Site Generation

**Definition:** The HTML is generated **once at build time** and reused for every visitor. The pre-built files can be served instantly from a CDN.

**In simple words:** The shop is arranged before opening day, and every customer sees the same arrangement.

**The flow:**
```
Build time → fetch data → generate HTML files → deploy to CDN → serve instantly
```

```jsx
// App Router - a plain fetch is cached by default = SSG
export default async function BlogPost({ params }) {
  const res = await fetch(`https://api.com/posts/${params.slug}`);
  const post = await res.json();

  return <article>{post.content}</article>;
}

// Pre-build all the known paths
export async function generateStaticParams() {
  const posts = await fetch("https://api.com/posts").then((r) => r.json());
  return posts.map((post) => ({ slug: post.slug }));
}
```

```jsx
// Pages Router - getStaticProps + getStaticPaths
export async function getStaticPaths() {
  const posts = await fetchPosts();
  return {
    paths: posts.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,     // any other path → 404
  };
}

export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);
  return { props: { post } };
}
```

| Pros | Cons |
|---|---|
| Fastest possible (served from CDN) | Data can become stale |
| Cheapest to host | Needs a rebuild for content changes |
| Best SEO | Slow builds for thousands of pages |
| Very reliable (just files) | Not suitable for personalised content |

**Use for:** blogs, documentation, marketing pages, product listings that rarely change.

---

## 4. ISR — Incremental Static Regeneration

**Definition:** A hybrid of SSG and SSR. Pages are pre-built like SSG, but they are **automatically regenerated in the background** after a set time, without needing a full rebuild and redeploy.

**In simple words:** The shop display is pre-arranged, and staff quietly refresh it every hour while customers keep shopping.

**How it works (stale-while-revalidate):**
```
1. First request → serve the cached page instantly
2. If the page is older than the revalidate time → serve the OLD page anyway (fast)
   and regenerate it in the background
3. The next visitor gets the fresh page
```

```jsx
// App Router - revalidate after 60 seconds
export default async function ProductPage({ params }) {
  const res = await fetch(`https://api.com/products/${params.id}`, {
    next: { revalidate: 60 },
  });
  const product = await res.json();
  return <ProductView product={product} />;
}

// Or set it for the whole route
export const revalidate = 60;
```

```jsx
// Pages Router
export async function getStaticProps() {
  const posts = await fetchPosts();
  return {
    props: { posts },
    revalidate: 60,      // regenerate at most once every 60 seconds
  };
}
```

**On-demand revalidation** — regenerate immediately when content actually changes (for example from a CMS webhook):

```js
// app/api/revalidate/route.js
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request) {
  const { path, secret } = await request.json();
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: "Invalid token" }, { status: 401 });
  }

  revalidatePath(path);          // refresh one page
  // revalidateTag("products");  // or refresh everything with this tag

  return Response.json({ revalidated: true });
}
```

| Pros | Cons |
|---|---|
| Fast like SSG | Some users may briefly see stale data |
| Data stays reasonably fresh | More complex caching to reason about |
| No full rebuild needed | Needs a Node server (not pure static hosting) |

**Use for:** e-commerce product pages, news sites, blogs with comments — anything with lots of pages that update periodically.

---

## 5. Full comparison table

| Point | CSR | SSR | SSG | ISR |
|---|---|---|---|---|
| **HTML generated** | In the browser | On each request | At build time | At build + on a schedule |
| **Speed (TTFB)** | Fast HTML, slow content | Slower | **Fastest** | **Fastest** |
| **SEO** | Poor | Excellent | Excellent | Excellent |
| **Data freshness** | Live | **Always fresh** | Stale until rebuild | Fresh within the interval |
| **Server cost** | Lowest | Highest | Lowest | Low |
| **CDN cacheable** | Yes (the shell) | No | **Yes** | **Yes** |
| **Personalised content** | Yes | **Yes** | No | No |
| **Best for** | Dashboards | Live/personal data | Blogs, docs | Products, news |

---

## 6. How to choose (decision guide)

```
Is the content the same for every user?
├── NO (personalised) → SSR, or CSR if SEO does not matter
└── YES
    ├── Does it change very rarely? → SSG
    ├── Does it change every few minutes/hours? → ISR
    └── Must it be real-time? → SSR
```

**Quick examples:**

| Page | Best choice | Why |
|---|---|---|
| Marketing homepage | SSG | Rarely changes, SEO critical |
| Blog post | SSG or ISR | Content is static, may get edits |
| Product listing | ISR | Prices and stock change periodically |
| Product detail | ISR | Same reason, plus SEO matters |
| Shopping cart | CSR | Personal, no SEO value |
| User dashboard | CSR or SSR | Private and personalised |
| Search results | SSR or CSR | Depends on the query |
| Live scores | SSR + client polling | Must be fresh |

---

## 7. Mixing strategies on one page

**Definition:** You are not limited to one strategy per page. A Server Component can render static content while a nested Client Component fetches live data.

```jsx
// Static product info (SSG/ISR) + live stock count (CSR)
export const revalidate = 3600;

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);     // cached, static

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <LiveStockCount productId={params.id} />     {/* client component, live */}
    </div>
  );
}
```

---

## 8. App Router caching cheat sheet

```jsx
// SSG - cached forever (the default)
fetch(url)
fetch(url, { cache: "force-cache" })

// SSR - never cached, fresh on every request
fetch(url, { cache: "no-store" })

// ISR - regenerate after N seconds
fetch(url, { next: { revalidate: 60 } })

// Tag-based - revalidate on demand from anywhere
fetch(url, { next: { tags: ["products"] } })
// then call revalidateTag("products")
```

**Route-level settings:**

```jsx
export const dynamic = "force-dynamic";   // force SSR for the whole route
export const dynamic = "force-static";    // force SSG
export const revalidate = 60;             // ISR for the whole route
```

---

## Key points

- **CSR** renders in the browser — poor SEO, fine for private pages.
- **SSR** renders on every request — always fresh, best for personalised data.
- **SSG** renders at build time — fastest and cheapest, best for static content.
- **ISR** is SSG that refreshes itself in the background — the best of both worlds.
- In the App Router the strategy is chosen by the **fetch cache option**, not by a special function.
- You can mix strategies within a single page using Server and Client Components.
