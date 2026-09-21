# What is Next.js?

## 1. Definition

**Definition:** Next.js is a **React framework** for building full-stack web applications. React only handles the UI; Next.js adds the things a real application needs — routing, server-side rendering, API endpoints, image optimisation, bundling and deployment configuration — all built in.

**In simple words:** React gives you the engine. Next.js gives you the whole car.

---

## 2. What React does NOT give you (and Next.js does)

| Need | Plain React | Next.js |
|---|---|---|
| Routing | Install React Router | Built-in, file-based |
| Server-side rendering | Set it up yourself | Built-in |
| SEO-friendly HTML | Hard (empty HTML shell) | Built-in |
| API endpoints | Separate backend project | Built-in Route Handlers |
| Code splitting | Manual `React.lazy` | Automatic per route |
| Image optimisation | Manual | `next/image` |
| Font optimisation | Manual | `next/font` |
| Bundler config | Configure Webpack/Vite | Pre-configured |
| Caching | Manual | Built-in, multi-layer |

---

## 3. The SEO problem Next.js solves

**Definition of CSR (Client-Side Rendering):** The browser downloads an almost empty HTML file plus a JavaScript bundle. React then builds the page in the browser. This is how a plain React app (Create React App / Vite) works.

```html
<!-- What a search engine or a slow connection first receives from a plain React app -->
<body>
  <div id="root"></div>     <!-- completely empty -->
  <script src="/bundle.js"></script>
</body>
```

**The problems:**
- Search engines and social media crawlers may see an empty page → bad SEO.
- The user stares at a blank screen until the JavaScript downloads and runs.
- Slow devices and slow networks feel much worse.

**Next.js fix:** the server renders the React components to **real HTML** and sends that. The content is visible immediately, and crawlers can read it.

```html
<!-- What Next.js sends -->
<body>
  <div id="root">
    <h1>Product Name</h1>
    <p>Full description already here...</p>
  </div>
</body>
```

---

## 4. Main features of Next.js

| Feature | Definition |
|---|---|
| **File-based routing** | A file's location in the folder structure becomes its URL — no route config |
| **Multiple rendering strategies** | Choose CSR, SSR, SSG or ISR per page |
| **Server Components** | Components that run only on the server and send no JavaScript to the browser |
| **Server Actions** | Functions that run on the server, callable directly from forms |
| **Route Handlers / API Routes** | Build backend API endpoints inside the same project |
| **Middleware** | Code that runs before a request completes — auth, redirects, headers |
| **`next/image`** | Automatic resizing, lazy loading and modern formats (WebP/AVIF) |
| **`next/font`** | Self-hosts fonts at build time, removing layout shift |
| **Automatic code splitting** | Every route becomes its own JavaScript chunk |
| **Built-in caching** | Multi-layer caching of data, routes and the full route cache |
| **TypeScript support** | Works out of the box with zero configuration |

---

## 5. The two routers

**Definition of the Pages Router:** The original routing system, using the `pages/` folder. Data is fetched with `getServerSideProps` and `getStaticProps`. Still fully supported.

**Definition of the App Router:** The newer system (Next.js 13+), using the `app/` folder. It is built on React Server Components, supports nested layouts, streaming and Server Actions. **This is the recommended approach for new projects.**

```
Pages Router                     App Router
pages/                           app/
  index.js       → /               page.js          → /
  about.js       → /about          about/page.js    → /about
  blog/[id].js   → /blog/1         blog/[id]/page.js→ /blog/1
  api/users.js   → /api/users      api/users/route.js → /api/users
```

---

## 6. Creating a Next.js project

```bash
npx create-next-app@latest my-app

# It asks:
# TypeScript?          → Yes (recommended)
# ESLint?              → Yes
# Tailwind CSS?        → your choice
# src/ directory?      → your choice
# App Router?          → Yes (recommended)
# Turbopack?           → Yes (faster dev builds)
```

```bash
npm run dev     # development server at localhost:3000
npm run build   # production build
npm start       # run the production build
npm run lint    # check code quality
```

---

## 7. Basic project structure (App Router)

```
my-app/
├── app/
│   ├── layout.js          # root layout - wraps every page (required)
│   ├── page.js            # the "/" route
│   ├── globals.css
│   ├── about/
│   │   └── page.js        # the "/about" route
│   ├── blog/
│   │   ├── page.js        # "/blog"
│   │   └── [slug]/
│   │       └── page.js    # "/blog/my-post"
│   └── api/
│       └── users/
│           └── route.js   # the "/api/users" endpoint
├── components/            # your reusable components
├── public/                # static files served at "/"
├── next.config.js
└── package.json
```

**Your first page:**

```jsx
// app/page.js
export default function Home() {
  return <h1>Hello Next.js</h1>;
}
```

```jsx
// app/layout.js - required root layout
export const metadata = {
  title: "My App",
  description: "Built with Next.js",
};

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

---

## 8. When to use Next.js

**Use Next.js when you need:**
- Good **SEO** (blogs, e-commerce, marketing sites, documentation)
- A **fast first load** on slow devices or networks
- **Full-stack** capability in one project (frontend + API)
- Content that changes but should still be pre-rendered (ISR)
- Server-side data access without building a separate backend

**Plain React (Vite) is fine when:**
- The app is behind a login, so SEO is irrelevant (an internal dashboard, an admin panel)
- You already have a separate backend and want only a client-side UI
- You are building an Electron or mobile-web app

---

## 9. Next.js vs other options

| Point | React (Vite) | Next.js | Remix | Astro |
|---|---|---|---|---|
| Type | Library + bundler | Full framework | Full framework | Content framework |
| Rendering | CSR only | CSR, SSR, SSG, ISR | SSR-first | Static-first |
| Routing | Add React Router | Built-in, file-based | Built-in | Built-in |
| SEO | Poor by default | Excellent | Excellent | Excellent |
| Backend | Separate | Built-in | Built-in | Limited |
| Best for | Dashboards, SPAs | Most production web apps | Data-heavy apps | Blogs, docs sites |

---

## Key points

- Next.js is a **React framework** that adds routing, rendering, an API layer and optimisation.
- Its biggest win over plain React is **server rendering**, which fixes SEO and first-load speed.
- **File-based routing** means the folder structure defines the URLs.
- The **App Router** (`app/`) is the modern approach; the Pages Router (`pages/`) is legacy but supported.
- Use Next.js when SEO, first-load performance or full-stack capability matter.
