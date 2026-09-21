# React vs Next.js

## 1. The one-line answer

**Definition of React:** React is a JavaScript **library** for building user interfaces. It handles one job only — rendering components and keeping the UI in sync with data.

**Definition of Next.js:** Next.js is a **framework built on top of React**. It keeps React for the UI and adds everything else an application needs — routing, server rendering, API endpoints, image/font optimisation, caching and a production build system.

**In simple words:** React is the engine. Next.js is the whole car — engine, wheels, steering and dashboard included.

> Next.js **is** React. You are not choosing between two different UI libraries; you are choosing whether to assemble the surrounding tools yourself or use a ready-made set.

---

## 2. Library vs Framework

**Definition of a Library:** A collection of tools **you call** when you want. You stay in control of the structure of your app.

**Definition of a Framework:** A structure that **calls your code**. It decides the file layout, the build process and the conventions, and you fill in the pieces.

```
LIBRARY (React)              FRAMEWORK (Next.js)
Your code calls React        Next.js calls your code
You choose the router        Routing is decided by folders
You configure the bundler    Bundler is pre-configured
You decide the structure     The structure is defined for you
```

This is why React gives freedom and Next.js gives speed.

---

## 3. What you must add yourself in plain React

| Need | Plain React (Vite / CRA) | Next.js |
|---|---|---|
| **Routing** | Install and configure React Router | Built in, file-based |
| **Server-side rendering** | Set up a Node server yourself | Built in |
| **SEO-ready HTML** | Very hard (empty HTML shell) | Built in |
| **API / backend** | A separate Express or Nest project | Route Handlers in the same project |
| **Code splitting** | Manual `React.lazy` per route | Automatic per route |
| **Image optimisation** | Manual, or a third-party service | `next/image` |
| **Font optimisation** | Manual | `next/font` |
| **Metadata / SEO tags** | `react-helmet` | `metadata` export |
| **Data caching** | React Query / SWR | Built-in multi-layer cache |
| **Environment variables** | Bundler config | Built in |
| **Bundler setup** | Configure Vite or Webpack | Pre-configured |
| **Server Components** | Not available | Default |

---

## 4. The biggest real difference — rendering and SEO

### Plain React = CSR only

**Definition of CSR (Client-Side Rendering):** The server sends a near-empty HTML file plus a JavaScript bundle. The browser downloads it, runs React, fetches data, and only then shows content.

```html
<!-- What a crawler (or a slow phone) first receives from a plain React app -->
<body>
  <div id="root"></div>     <!-- completely empty -->
  <script src="/bundle.js"></script>
</body>
```

**The consequences:**
- Search engines and social previews may see nothing
- The user stares at a blank screen until the JS loads and runs
- A slow device makes the wait much worse

### Next.js = you choose per page

```html
<!-- What Next.js sends -->
<body>
  <div id="root">
    <h1>Product Name</h1>
    <p>Full description already here...</p>
  </div>
</body>
```

| Method | Definition | Best for |
|---|---|---|
| **CSR** | Rendered in the browser | Private dashboards |
| **SSR** | Rendered on the server on every request | Personalised, always-fresh data |
| **SSG** | Rendered once at build time | Blogs, docs, marketing pages |
| **ISR** | SSG that regenerates itself on a schedule | Products, news, listings |

> Full detail with code for all four: [RenderingMethods.md](RenderingMethods.md)

---

## 5. Routing side by side

```jsx
// ───── PLAIN REACT (React Router) ─────
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </BrowserRouter>
  );
}
```

```
// ───── NEXT.JS (file-based) ─────
app/
├── page.js              → /
├── about/page.js        → /about
└── blog/[slug]/page.js  → /blog/my-post

// No router config file at all. The folders ARE the routes.
```

---

## 6. Data fetching side by side

```jsx
// ───── PLAIN REACT ─────
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/products")               // needs a separate backend
      .then((r) => r.json())
      .then(setProducts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;       // the user sees a spinner first
  return <List items={products} />;
}
```

```jsx
// ───── NEXT.JS (Server Component) ─────
export default async function Products() {
  const products = await db.product.findMany();   // direct DB access
  return <List items={products} />;
  // No useState, no useEffect, no loading flicker, no API route,
  // and this code never reaches the browser.
}
```

---

## 7. Backend / API

```js
// ───── PLAIN REACT ─────
// You need a second project entirely:
//   my-app/          (React frontend, port 5173)
//   my-api/          (Express backend, port 3000)
// Plus CORS setup, two deployments, two repos to keep in sync.

// ───── NEXT.JS ─────
// app/api/products/route.js  →  /api/products
export async function GET() {
  const products = await db.product.findMany();
  return Response.json(products);
}
// Same project, same deployment, no CORS needed.
```

---

## 8. Full comparison table

| Point | React | Next.js |
|---|---|---|
| **Type** | Library | Framework (built on React) |
| **Rendering** | CSR only | CSR + SSR + SSG + ISR |
| **SEO** | Poor by default | Excellent |
| **First load speed** | Slower (blank until JS runs) | Fast (HTML arrives ready) |
| **Routing** | Add React Router | Built in, file-based |
| **Backend** | Separate project | Built in |
| **Server Components** | No | Yes (default) |
| **Image/font optimisation** | Manual | Built in |
| **Code splitting** | Manual | Automatic |
| **Config needed** | Bundler, router, SSR | Almost none |
| **Flexibility** | Total | Follow the conventions |
| **Learning curve** | Lower | Higher (React + Next concepts) |
| **Bundle size** | Everything ships to the browser | Server Components ship nothing |
| **Hosting** | Any static host | Node server (or Vercel) |
| **Build time** | Fast | Slower (pre-rendering pages) |

---

## 9. When to choose which

**Choose Next.js when:**
- SEO matters (blog, e-commerce, marketing site, documentation, public content)
- The first load must be fast on slow devices or networks
- You want frontend and backend in **one** project
- You need server-side data access without building a separate API
- You want image, font and caching optimisation without configuring it

**Choose plain React (Vite) when:**
- The whole app is behind a login, so SEO is irrelevant (an internal dashboard, an admin panel)
- You already have a separate backend and only need a client UI
- You are building an Electron desktop app or embedding a widget
- You need total control over the build and structure
- The app is small and Next.js conventions would only add overhead

**The practical rule:** if the page is meant to be found by Google, use Next.js. If it is a private tool behind a login, plain React is perfectly fine.

---

## 10. Common misunderstandings

| Myth | Reality |
|---|---|
| "Next.js replaces React" | Next.js **uses** React. You still write React components. |
| "Next.js is always faster" | It is faster for first load and SEO. A pure client dashboard may not benefit. |
| "You must use SSR in Next.js" | You choose per page — SSG is the default and the fastest. |
| "Next.js means no client-side JS" | Client Components still run in the browser exactly like React. |
| "React can't do SEO" | It can, with your own SSR setup — Next.js just does it for you. |
| "Next.js locks you in" | It is React underneath; components are portable. The routing and data layer are not. |

---

## 11. Does React knowledge transfer?

**Yes — completely.** Everything you know about React still applies in Next.js:

- Components, props, `children`, composition
- JSX and conditional rendering
- `useState`, `useEffect`, `useRef`, `useContext`, `useReducer`
- Custom hooks, `React.memo`, `useMemo`, `useCallback`
- Keys, reconciliation, error boundaries, portals

**What is new in Next.js:**
- Server Components being the default, and the `"use client"` boundary
- File-based routing and the special files (`layout`, `loading`, `error`)
- Data fetching with `await` directly in components
- The caching model and `revalidate`
- Server Actions instead of API calls for mutations

---

## Key points

- Next.js **is** React plus routing, rendering, an API layer and optimisation.
- React is a **library** (you assemble the tools); Next.js is a **framework** (tools included).
- The core difference is **rendering**: React is CSR only, Next.js offers CSR, SSR, SSG and ISR.
- Next.js wins on SEO, first-load speed and full-stack convenience.
- Plain React is still the right choice for private dashboards and embedded apps.
- All React knowledge transfers directly — only the routing and data layer are new.
