# Advanced React Questions — Part 5: SSR, Security & Advanced Concepts (41–50)

[← Part 4: Architecture & State](04_Architecture.md) · [Back to the list](README.md)

---

## 41. CSR vs SSR vs SSG?

**Short answer:** They differ in **where and when the HTML is created**:

- **CSR (Client-Side Rendering)** — the server sends an **almost empty HTML** file and a JavaScript bundle. The **browser** builds the page. (Plain React with Vite.)
- **SSR (Server-Side Rendering)** — the **server builds the HTML on every request**. The browser shows it right away, then React **hydrates** it to make it interactive (Q42).
- **SSG (Static Site Generation)** — the HTML is built **once, at build time**, and served from a CDN. Very fast, but the content is only as fresh as the last build.

**What the user experiences:**

```
CSR:  request → empty HTML → download JS → run JS → fetch data → 👀 page visible + interactive
SSR:  request → server fetches data + builds HTML → 👀 page visible → download JS → hydrate → interactive
SSG:  request → CDN returns ready HTML (built earlier) → 👀 page visible → download JS → hydrate → interactive
```

| | CSR | SSR | SSG |
|---|---|---|---|
| HTML created | In the browser | On the server, **each request** | At **build time** |
| First content visible | Slow (wait for JS) | Fast | Fastest |
| SEO | Weaker | ✅ Great | ✅ Great |
| Data freshness | Always fresh (fetched in browser) | Always fresh | Old until the next build |
| Server cost | Low (static files) | Higher (renders every request) | Very low (CDN) |
| Best for | Dashboards, admin panels, apps behind login | Personalized or often-changing pages (feeds, search results) | Blogs, docs, marketing pages |

**A fourth option — ISR (Incremental Static Regeneration):** static pages that are **rebuilt in the background** every N seconds. You get SSG speed with fresh-enough data. Good for product pages and news.

**In Next.js (App Router):**

```jsx
// SSG — no dynamic data: built once at build time
export default function AboutPage() {
  return <h1>About us</h1>;
}
```

```jsx
// ISR — static, but rebuilt at most every 60 seconds
export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}
```

```jsx
// SSR — reads cookies, so it must render on every request
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const token = (await cookies()).get("token")?.value;
  const data = await getDashboard(token);
  return <Dashboard data={data} />;
}
```

> 💡 **Tip:** You don't have to choose one for the whole app. Modern frameworks let you pick **per page**: SSG for marketing, SSR for the feed, CSR for the logged-in dashboard.

Deep dive: [RenderingMethods.md](../../Nextjs_Interview_Questions/RenderingMethods.md) · [ReactVsNextjs.md](../../Nextjs_Interview_Questions/ReactVsNextjs.md)

---

## 42. What is hydration, and why can it fail?

**Short answer:** **Hydration** is when React takes the **HTML that the server already rendered** and makes it **interactive**. React renders the same components again in the browser, **matches them to the existing DOM**, and attaches event handlers and state — without rebuilding the DOM.

**In simple words:** The server sends a **photo** of the page — you can see it, but the buttons don't work. Hydration brings the photo **to life**.

```jsx
// CSR: build the DOM from nothing
createRoot(document.getElementById("root")).render(<App />);

// SSR: reuse the server's HTML and attach React to it
import { hydrateRoot } from "react-dom/client";
hydrateRoot(document.getElementById("root"), <App />);
```

**Timeline:**

```
Server HTML arrives → page visible (buttons don't work yet)
      ↓
JS downloads → React renders in memory → compares with the existing DOM
      ↓
Matches → attaches onClick, state, effects → ✅ page is interactive
```

**Why hydration can fail or go wrong:**

| Problem | What happens |
|---|---|
| **Mismatch** — the browser's first render differs from the server HTML (Q43) | React logs an error. For a text or structure mismatch, it throws away the server HTML for that part and **re-renders it in the browser** — slower, and the page may flash. Attribute differences may not be fixed at all |
| **JavaScript fails to load or crashes** | The page is visible, but **nothing is clickable** |
| **Slow JavaScript** (big bundle, slow phone) | A long gap where the page *looks* ready but doesn't respond — users click and nothing happens |
| **Invalid HTML nesting** (`<div>` inside `<p>`, `<a>` inside `<a>`) | The browser "fixes" the HTML differently from React's tree → mismatch |
| **Browser extensions** change the DOM (translators, password managers, Grammarly) | Extra attributes or elements → mismatch warnings |

**How React 18+ makes hydration better:**

- **Selective hydration** — with `<Suspense>` boundaries, React hydrates parts of the page **separately**, and hydrates the part the user clicks **first** (Q46).
- **Streaming** — the server sends HTML in pieces, so hydration can start earlier.
- **React 19** shows one clear error with a **diff** of what didn't match.

> 💡 **Tip:** Say: "Hydration attaches React to server HTML. It needs the browser's first render to match the server's exactly."

Deep dive: [RenderingMethods.md](../../Nextjs_Interview_Questions/RenderingMethods.md)

---

## 43. What causes hydration mismatches?

**Short answer:** A hydration mismatch happens when **the HTML the server rendered is different from what React renders in the browser on the first render**. The usual cause is code that gives a **different result on the server and in the browser**: dates and times, random values, browser-only APIs (`window`, `localStorage`), or invalid HTML.

**Common causes and fixes:**

| Cause | Why it differs | Fix |
|---|---|---|
| `new Date()`, `Date.now()`, `toLocaleString()` | Different time and time zone on the server vs the user's computer | Render it after mount (below), or format it on the server with a fixed time zone |
| `Math.random()`, `crypto.randomUUID()` in render | A new value each time | Use `useId()` for IDs, or create the value once on the server and pass it down |
| `typeof window !== "undefined"` in render | `false` on the server, `true` in the browser | Move browser-only code into `useEffect` |
| Reading `localStorage` / `sessionStorage` in render | Doesn't exist on the server | Read it in `useEffect` |
| Invalid HTML (`<div>` inside `<p>`, `<tr>` without `<tbody>`) | The browser rearranges the HTML | Fix the HTML structure |
| Different data on the server and the client | Data changed between the server render and hydration | Pass the server's data to the client (frameworks do this for you) |
| Browser extensions | They add attributes or tags before React hydrates | Usually safe to ignore; React 19 skips extra tags that extensions insert into `<head>` and `<body>` |

**Example 1 — a date (❌ mismatch):**

```jsx
function LastUpdated() {
  return <p>Updated at {new Date().toLocaleTimeString()}</p>;
  // Server (UTC): "10:00:00 AM"   Browser (IST): "3:30:00 PM" → mismatch
}
```

**✅ Fix — render the browser-only value after hydration:**

```jsx
function LastUpdated({ isoTime }) {
  const [text, setText] = useState(null);

  useEffect(() => {
    setText(new Date(isoTime).toLocaleTimeString()); // runs only in the browser
  }, [isoTime]);

  // First render matches the server ("—"), then it updates
  return <p>Updated at {text ?? "—"}</p>;
}
```

**Example 2 — `window` in render (❌ mismatch):**

```jsx
function Banner() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return isMobile ? <MobileBanner /> : <DesktopBanner />;
  // Server: always DesktopBanner. Phone: MobileBanner → mismatch
}
```

**✅ Fixes:** use **CSS media queries** to show/hide (best — no JavaScript needed), or read `window` inside `useEffect`.

**Example 3 — random IDs (❌ mismatch):**

```jsx
const id = Math.random().toString(36);   // ❌ different on the server and the client
const id = useId();                      // ✅ the same on both
<label htmlFor={id}>Email</label>
<input id={id} />
```

**Escape hatches (use carefully):**

```jsx
// 1. Silence a mismatch you expect, like a timestamp (only works one level deep)
<time suppressHydrationWarning>{new Date().toLocaleTimeString()}</time>

// 2. Next.js: don't render a component on the server at all (only in Client Components)
const Map = dynamic(() => import("./Map"), { ssr: false });
```

> 💡 **Tip:** The rule to remember: "The **first** browser render must produce **exactly** the same HTML as the server. Anything browser-specific goes in `useEffect`."

---

## 44. What are React Server Components?

**Short answer:** React Server Components (RSC) are components that **run only on the server** — at build time or on each request. **Their code is never sent to the browser**, so they add **zero JavaScript** to the bundle. They can be `async`, read a **database or files directly**, and use **secret keys** safely. They are stable in **React 19** and are used through a framework — mainly the **Next.js App Router**.

**Example — a Server Component:**

```jsx
// app/products/[id]/page.jsx — a Server Component (the default in the App Router)
import { db } from "@/lib/db";
import { marked } from "marked";              // a big library — stays on the server
import AddToCartButton from "./AddToCartButton";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } }); // direct DB query, no API needed
  const descriptionHtml = marked(product.description);           // runs on the server only

  return (
    <article>
      <h1>{product.name}</h1>
      <p>₹{product.price}</p>
      <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
      <AddToCartButton productId={product.id} />   {/* a Client Component for the click */}
    </article>
  );
}
```

```jsx
// AddToCartButton.jsx — a Client Component (only this part ships JavaScript)
"use client";
import { useState } from "react";

export default function AddToCartButton({ productId }) {
  const [added, setAdded] = useState(false);
  return (
    <button onClick={() => { addToCart(productId); setAdded(true); }}>
      {added ? "Added ✅" : "Add to cart"}
    </button>
  );
}
```

(If the description comes from users, sanitize the HTML before using `dangerouslySetInnerHTML` — see Q47.)

**What Server Components can and can't do:**

| ✅ Can | ❌ Can't |
|---|---|
| Be `async` and `await` data | Use `useState`, `useReducer`, `useEffect` |
| Read databases, files, secrets | Use event handlers (`onClick`, `onChange`) |
| Import big libraries without growing the bundle | Use browser APIs (`window`, `localStorage`) |
| Render Client Components | Use Context (as a provider or consumer) |

**Benefits:**

- **Smaller bundles** — server-only code and libraries never reach the browser.
- **Faster data loading** — data is fetched on the server, close to the database. No browser → API → database round trips.
- **Security** — secrets and database queries stay on the server.

**RSC is not the same as SSR:**

| | SSR | Server Components |
|---|---|---|
| What it does | Renders **all** components to HTML for the first load | Some components run **only** on the server |
| JavaScript sent to the browser | All component code (for hydration) | Only Client Component code |
| Hydrated in the browser | Yes, everything | No — only Client Components hydrate |
| Output | HTML | A special format (the "RSC payload") that React merges into the page |

They work **together**: in Next.js, Server Components render first, then SSR turns everything into HTML for a fast first load.

> 💡 **Tip:** One-line answer: "Server Components run only on the server, can fetch data directly, and send no JavaScript to the browser. Use Client Components only where you need interactivity."

Deep dive: [ServerComponents.md](../ServerComponents.md) · [ServerVsClientComponents.md](../../Nextjs_Interview_Questions/ServerVsClientComponents.md)

---

## 45. Server Components vs Client Components?

**Short answer:** **Server Components** run only on the server and send no JavaScript — use them for **fetching data and showing content**. **Client Components** (marked with **`"use client"`**) are sent to the browser and hydrate — use them for **interactivity**: state, effects, event handlers and browser APIs. In the Next.js App Router, components are **Server Components by default**.

| | Server Component | Client Component |
|---|---|---|
| How to mark it | Default (nothing needed) | `"use client"` at the top of the file |
| Runs on | The server only | Server (for the first HTML) **and** the browser |
| JavaScript sent to the browser | ❌ None | ✅ Yes |
| `async` / `await` in the component | ✅ | ❌ |
| Database, file system, secrets | ✅ | ❌ |
| `useState`, `useEffect`, `useContext` | ❌ | ✅ |
| `onClick`, `onChange` | ❌ | ✅ |
| `window`, `localStorage` | ❌ | ✅ (in effects and handlers) |
| Use for | Pages, layouts, data fetching, static content | Buttons, forms, modals, dropdowns, charts |

**The rules of the boundary:**

**1. `"use client"` marks a boundary.** That file **and everything it imports** become client code.

**2. A Server Component can import a Client Component.** ✅

**3. A Client Component can't import a Server Component** — but it **can receive one as `children`** or another prop:

```jsx
// ❌ Doesn't work — Sidebar.jsx is a Client Component
"use client";
import ServerStats from "./ServerStats"; // would turn ServerStats into a client component

// ✅ Works — pass the Server Component as children
// layout.jsx (Server Component)
import Sidebar from "./Sidebar";       // Client Component
import ServerStats from "./ServerStats"; // Server Component

export default function Layout() {
  return (
    <Sidebar>
      <ServerStats />   {/* rendered on the server, then placed inside the client Sidebar */}
    </Sidebar>
  );
}

// Sidebar.jsx
"use client";
export default function Sidebar({ children }) {
  const [open, setOpen] = useState(true);
  return (
    <aside>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {open && children}
    </aside>
  );
}
```

**4. Props from server to client must be serializable** — strings, numbers, plain objects, arrays, Dates, Promises. **Not** normal functions or class instances. (Server Actions are the exception — they can be passed.)

**5. Push `"use client"` down to the leaves.** Don't mark a whole page as client just for one button — make **only the button** a Client Component.

**6. Protect server-only code** with the `server-only` package. If someone imports it into a Client Component by mistake, the build fails:

```js
// lib/db.js
import "server-only";
export const db = new Database(process.env.DATABASE_URL);
```

> 💡 **Tip:** A common interview trap: **"`'use client'` components only run in the browser."** That's wrong — they are **also rendered on the server** for the first HTML (SSR), then hydrated.

Deep dive: [ServerVsClientComponents.md](../../Nextjs_Interview_Questions/ServerVsClientComponents.md) · [ServerComponents.md](../ServerComponents.md)

---

## 46. How does Suspense work with asynchronous rendering?

**Short answer:** **Suspense** lets a component **"wait"** for something — code or data — and shows a **fallback** (like a skeleton) until it's ready. When a component reads data that isn't ready yet, it **suspends**. React stops rendering that part, shows the nearest `<Suspense>` fallback, and **tries again when the data arrives**. The rest of the page keeps working.

```jsx
<Suspense fallback={<CommentsSkeleton />}>
  <Comments />   {/* suspends while its data loads */}
</Suspense>
```

**What can make a component suspend:**

| Source | Example |
|---|---|
| Lazy-loaded code | `React.lazy(() => import("./Chart"))` (Q24) |
| An `async` Server Component | `async function Comments() { await getComments() }` |
| `use(promise)` (React 19) | `const comments = use(commentsPromise)` |
| Suspense-enabled data libraries | TanStack Query's `useSuspenseQuery`, Relay, Apollo |

⚠️ Suspense does **not** detect data fetched inside `useEffect`. The data source must support Suspense.

**Example — React 19 `use()` with a promise from a Server Component:**

```jsx
// app/post/page.jsx — Server Component
import { Suspense } from "react";
import Comments from "./Comments";

export default async function PostPage() {
  const post = await getPost();          // wait for this — it's the main content
  const commentsPromise = getComments(); // start loading, but DON'T wait

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>

      <Suspense fallback={<p>Loading comments...</p>}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </article>
  );
}
```

```jsx
// Comments.jsx — Client Component
"use client";
import { use } from "react";

export default function Comments({ commentsPromise }) {
  const comments = use(commentsPromise); // suspends until the promise resolves
  return (
    <ul>
      {comments.map((c) => <li key={c.id}>{c.text}</li>)}
    </ul>
  );
}
```

**Important:** don't create the promise **inside** a Client Component's render (`use(fetch(...))`). A new promise would be created on every render. Create it in a Server Component, a framework loader, or a cache.

**Streaming SSR — Suspense on the server:**

```
1. The server sends the page shell right away:   <h1>Post</h1> ... [Loading comments...]
2. The user sees the post immediately
3. When comments are ready, the server streams their HTML in the SAME response
4. React swaps the fallback for the real comments
```

This uses `renderToPipeableStream` (Node) or `renderToReadableStream` (Edge). Next.js does it for you.

**Selective hydration:** each Suspense boundary can **hydrate on its own**. If the user clicks the comments area while it's still hydrating, React **hydrates that part first**.

**Suspense + transitions:** if new data is loaded inside a **transition** (Q9), React **keeps showing the old content** instead of switching back to the fallback. That's why page navigation doesn't flash skeletons.

**Nested boundaries reveal the page step by step:**

```jsx
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<FeedSkeleton />}>
    <Feed />
    <Suspense fallback={<CommentsSkeleton />}>
      <Comments />
    </Suspense>
  </Suspense>
</Suspense>
```

> 💡 **Tip:** Say: "A component suspends when its data isn't ready. React shows the nearest fallback and retries when the promise resolves. On the server, the same boundaries enable streaming and selective hydration."

Deep dive: [LazyLoadingSuspense.md](../LazyLoadingSuspense.md) · [ServerComponents.md](../ServerComponents.md)

---

## 47. How do you prevent XSS vulnerabilities in React?

**Short answer:** **XSS (Cross-Site Scripting)** is when an attacker gets **their JavaScript to run on your page**, for example to steal tokens. React protects you by default: anything you put in JSX with `{}` is **escaped** — shown as text, never run as code. XSS happens when you **bypass** this protection: `dangerouslySetInnerHTML`, `javascript:` URLs, writing to the DOM directly, or putting unsafe data into `<script>` tags.

**React's default protection:**

```jsx
const comment = '<img src=x onerror="alert(\'hacked\')">';

return <p>{comment}</p>;
// ✅ Safe — the user sees the text <img src=x onerror=...> on the page; nothing runs
```

**The danger zones and how to fix them:**

**1. `dangerouslySetInnerHTML` — sanitize first:**

```jsx
import DOMPurify from "dompurify";

// ❌ Runs any script inside userHtml
<div dangerouslySetInnerHTML={{ __html: userHtml }} />

// ✅ DOMPurify removes scripts and dangerous attributes
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userHtml) }} />
```

**2. `javascript:` URLs in links — check the protocol:**

```jsx
// ❌ If website = "javascript:alert(document.cookie)", clicking the link runs it
<a href={user.website}>Website</a>

// ✅ Allow only safe protocols
function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? url : "#";
  } catch {
    return "#";
  }
}

<a href={safeUrl(user.website)}>Website</a>
```

**3. Direct DOM access — React's protection doesn't apply here:**

```jsx
ref.current.innerHTML = userInput;   // ❌ dangerous
ref.current.textContent = userInput; // ✅ safe — always shown as text
```

**4. Putting server data into a `<script>` tag (SSR):**

```jsx
// ❌ If data contains "</script><script>alert(1)</script>", it breaks out and runs
<script>{`window.__DATA__ = ${JSON.stringify(data)}`}</script>

// ✅ Escape "<" so the browser can't see a closing </script> tag
const safeJson = JSON.stringify(data).replace(/</g, "\\u003c");
<script dangerouslySetInnerHTML={{ __html: `window.__DATA__ = ${safeJson}` }} />
```

**5. Other risky things:**

| Risk | Fix |
|---|---|
| `eval()`, `new Function(userInput)` | Never run user input as code |
| Spreading user-controlled objects as props: `<div {...userProps} />` | Pick only the props you expect |
| Markdown renderers that allow raw HTML | Turn off raw HTML, or sanitize the output |
| Old, vulnerable npm packages | `npm audit`, Dependabot |

**Defense in depth — limit the damage if XSS still happens:**

- **Content-Security-Policy (CSP)** header — tells the browser which scripts are allowed to run, and blocks inline scripts.
- **HttpOnly cookies** for auth tokens — JavaScript (including an attacker's) **can't read them**.
- **Sanitize on the server** too, before saving user HTML.

> 💡 **Tip:** "React escapes by default. XSS appears when we opt out — `dangerouslySetInnerHTML`, `javascript:` URLs, `innerHTML`. For those: DOMPurify, URL checks, plus CSP and HttpOnly cookies as backup."

Deep dive: [JSX.md](../JSX.md) · [NpmAndSecurity.md](../../Node_Backend_Questions/NpmAndSecurity.md)

---

## 48. How would you implement authentication securely?

**Short answer:** **Real security happens on the server.** The React app only **shows the right UI**. The key points:

1. Keep the session token in an **HttpOnly, Secure, SameSite cookie** — not in `localStorage`, where any XSS can steal it.
2. **Check permissions on the server for every request.** Hiding a page in React is not security.
3. Use **short-lived access tokens** + **refresh tokens** that rotate.
4. Protect against **CSRF** when using cookies.
5. Use **HTTPS** everywhere, and **never put secrets in frontend code**.
6. Prefer a proven auth provider or library (Auth.js, Clerk, Auth0, Supabase Auth, Cognito) over building it yourself.

**Where to store the token:**

| Storage | Can XSS steal it? | CSRF risk | Verdict |
|---|---|---|---|
| `localStorage` / `sessionStorage` | ✅ **Yes** — any script can read it | No | ❌ Avoid for auth tokens |
| JavaScript memory (a variable) | Harder, but possible while the page is open | No | OK for short-lived access tokens |
| **HttpOnly cookie** | ❌ **No** — JavaScript can't read it | Yes → use `SameSite` + CSRF tokens | ✅ **Recommended** |

**Server — set a secure cookie on login (Express):**

```js
app.post("/api/login", async (req, res) => {
  const user = await verifyPassword(req.body.email, req.body.password); // bcrypt compare
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const token = createSessionToken(user.id);
  res.cookie("session", token, {
    httpOnly: true,       // JavaScript can't read it → safe from XSS
    secure: true,         // HTTPS only
    sameSite: "lax",      // not sent on most cross-site requests → helps against CSRF
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.json({ id: user.id, name: user.name });
});
```

**React — an auth provider that asks the server "who am I?":**

```jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" }) // the browser sends the cookie automatically
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" }); // server clears the cookie
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, setUser, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
```

**React — a protected route (for user experience only):**

```jsx
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
```

⚠️ Anyone can change JavaScript in their browser and see this page anyway. That's fine — the **API must refuse** to return data if the user isn't allowed. **The server is the real gate.**

**More good practices:**

| Practice | Why |
|---|---|
| Hash passwords with **bcrypt** or **argon2** | Never store plain-text passwords |
| **Rotate refresh tokens** and invalidate them on logout | A stolen refresh token stops working |
| **Rate-limit** login attempts | Stops password guessing |
| Handle **401** in one place (an API client interceptor) | Refresh the token or send the user to login |
| `VITE_*` / `NEXT_PUBLIC_*` env vars are **public** | Never put secret keys in them |
| For SPAs using OAuth, use **Authorization Code + PKCE** | The old "implicit flow" is not secure |
| Offer **MFA** for sensitive apps | A stolen password alone isn't enough |

> 💡 **Tip:** The two sentences interviewers want to hear: "**Tokens in HttpOnly cookies, not localStorage**" and "**Frontend route guards are UX; the server enforces access.**"

Deep dive: [jwt.md](../../Node_Backend_Questions/jwt.md) · [Cookies.md](../../Node_Backend_Questions/Cookies.md) · [AuthenticationVSAuthorization.md](../../Node_Backend_Questions/AuthenticationVSAuthorization.md) · [AuthAndDeployment.md](../../Nextjs_Interview_Questions/AuthAndDeployment.md)

---

## 49. How do you test complex components and Hooks?

**Short answer:** Test **behavior, not implementation** — test what the **user sees and does**, not internal state. The usual tools:

| Tool | Used for |
|---|---|
| **Vitest** or **Jest** | Test runner |
| **React Testing Library (RTL)** | Render components and find elements the way a user would (by role, label, text) |
| **`@testing-library/user-event`** | Realistic typing and clicking |
| **MSW (Mock Service Worker)** | Fake API responses at the network level |
| **`renderHook`** (from RTL) | Test custom Hooks on their own |
| **Playwright** or **Cypress** | End-to-end tests in a real browser |

The examples assume Vitest with `globals: true` (so `test`, `expect` and `vi` need no import) and `@testing-library/jest-dom` set up for matchers like `toBeInTheDocument`.

**Example 1 — a component that fetches data (RTL + user-event + MSW):**

```jsx
// UserSearch.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import UserSearch from "./UserSearch";

// Fake API — the component's real fetch() code runs unchanged
const server = setupServer(
  http.get("/api/users", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q");
    return HttpResponse.json(q === "asha" ? [{ id: 1, name: "Asha Verma" }] : []);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("shows matching users after searching", async () => {
  const user = userEvent.setup();
  render(<UserSearch />);

  await user.type(screen.getByLabelText(/search users/i), "asha");
  await user.click(screen.getByRole("button", { name: /search/i }));

  // findBy* waits for the element to appear (async)
  expect(await screen.findByText("Asha Verma")).toBeInTheDocument();
});

test("shows an error when the API fails", async () => {
  server.use(http.get("/api/users", () => new HttpResponse(null, { status: 500 })));
  const user = userEvent.setup();
  render(<UserSearch />);

  await user.type(screen.getByLabelText(/search users/i), "asha");
  await user.click(screen.getByRole("button", { name: /search/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
});
```

**Example 2 — a custom Hook with `renderHook` and fake timers:**

```jsx
// useDebounce.test.js
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

test("updates the value only after the delay", () => {
  vi.useFakeTimers(); // jest.useFakeTimers() in Jest

  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
    initialProps: { value: "a" },
  });

  rerender({ value: "ab" });
  expect(result.current).toBe("a");   // not yet

  act(() => vi.advanceTimersByTime(500));
  expect(result.current).toBe("ab");  // now updated

  vi.useRealTimers();
});
```

**Components that need providers** (Router, Redux, React Query) — make a custom `render`:

```jsx
function renderWithProviders(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}
```

**Good habits:**

| ✅ Do | ❌ Avoid |
|---|---|
| Find elements by **role and label**: `getByRole("button", { name: /save/i })` | `container.querySelector(".btn-primary")` |
| Use `findBy*` / `waitFor` for async UI | Fixed `setTimeout` waits in tests |
| Mock the **network** (MSW) | Mocking every internal function |
| Test loading, error and empty states | Testing only the "happy path" |
| Check what the user sees | Checking state values or how many times a component rendered |

**What to test where:**

```
E2E (Playwright)        → a few: login, checkout, the main user flows
Integration (RTL + MSW) → most tests: a page or feature with fake APIs
Unit                    → pure functions, reducers, custom Hooks
```

> 💡 **Tip:** Quote the RTL motto: "**The more your tests resemble the way your software is used, the more confidence they give you.**"

Deep dive: [Unitesting.md](../../Node_Backend_Questions/Unitesting.md)

---

## 50. How would you design a production-ready React application?

**Short answer:** A production-ready app is not only working code. It's also **fast, secure, tested, observable and easy to change**. Answer it **layer by layer**: setup, architecture, state and data, performance, errors and monitoring, security, testing, and deployment.

**The checklist:**

| Area | What to do |
|---|---|
| **Setup** | Vite (SPA) or Next.js (SSR/SEO). **TypeScript**, ESLint (with `react-hooks` rules), Prettier, `StrictMode` |
| **Structure** | Feature-based folders, shared UI library, one API client (Q38) |
| **Routing** | Route-based code splitting, protected routes, 404 page |
| **State** | Local first. URL for filters. TanStack Query/RTK Query for server data. Zustand/Redux only for real global state (Q33) |
| **Data** | Caching, deduplication, retries, loading/error/empty states, no request waterfalls (Q39) |
| **Forms** | React Hook Form + Zod, with the same schema on the server (Q40) |
| **UI** | Design system / component library, **accessibility** (semantic HTML, keyboard support, contrast), responsive layout |
| **Performance** | Bundle budget, lazy loading, image optimization, virtualization, Web Vitals tracking (Q30) |
| **Errors** | Error Boundaries at app, route and widget level. Report errors to **Sentry** (Q37) |
| **Security** | HttpOnly cookie auth, CSP header, sanitize HTML, no secrets in the frontend, `npm audit` (Q47, Q48) |
| **Testing** | Unit + integration (RTL + MSW) + a few E2E tests on the main flows (Q49) |
| **CI/CD** | On every PR: lint → type-check → test → build. Preview deployments. Automatic deploy on merge |
| **Monitoring** | Error tracking, real-user Web Vitals, analytics, logs |
| **Config** | Environment variables per environment (dev, staging, prod), **feature flags** for safe releases |
| **Other** | Internationalization (i18n) if needed, SEO (meta tags, SSR/SSG), browser support, documentation |

**Example — the app entry point brings many of these together:**

```jsx
// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react";
import { router } from "./app/router";          // lazy-loaded routes
import { AuthProvider } from "./features/auth";
import AppCrashed from "./shared/ui/AppCrashed";

Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN }); // a DSN is OK to expose publicly

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

createRoot(document.getElementById("root"), {
  onUncaughtError: (error) => Sentry.captureException(error),
}).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={AppCrashed}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
```

**A simple CI pipeline (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm run build
```

**How to answer in the interview (about 2 minutes):**

1. **Start with the requirements:** "Does it need SEO? How many users? Logged in or public?" → this decides SPA vs Next.js.
2. **Walk through the layers:** structure → state and data → performance → errors → security → testing → CI/CD → monitoring.
3. **Give one concrete choice for each** ("TanStack Query for server state because of caching and dedup").
4. **Mention trade-offs** ("Redux adds setup, so I'd only use it if the client state is really complex").

> 💡 **Tip:** Senior-level answers talk about **trade-offs and operations** (monitoring, feature flags, rollbacks), not just libraries.

Deep dive: [CICDImpQue.md](../../CICD_DevOps_Questions/CICDImpQue.md) · [PerformanceOptimization.md](../PerformanceOptimization.md)

---

[← Part 4: Architecture & State](04_Architecture.md) · [Back to the list](README.md)
