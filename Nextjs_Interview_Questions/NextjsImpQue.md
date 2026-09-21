# Next.js Interview Questions and Answers

## 1. What is Next.js?

Next.js is a React **framework** for building full-stack web applications. React only handles the UI; Next.js adds routing, server-side rendering, API endpoints, image and font optimisation, caching and bundling — all built in.

## 2. Why use Next.js instead of plain React?

Plain React is client-side rendered, so the browser first receives an empty HTML shell — bad for SEO and slow on the first load. Next.js renders on the server, sends complete HTML, and adds file-based routing, an API layer and automatic optimisations.

## 3. What is the difference between the Pages Router and the App Router?

The **Pages Router** (`pages/`) is the original system using `getServerSideProps` / `getStaticProps`. The **App Router** (`app/`) is built on React Server Components and adds nested layouts, streaming, Server Actions and per-fetch caching. The App Router is recommended for new projects.

## 4. What is file-based routing?

The folder and file structure defines the URLs. `app/about/page.js` becomes `/about`. A folder only becomes a public route when it contains a `page.js` file.

## 5. What are CSR, SSR, SSG and ISR?

**CSR** renders in the browser. **SSR** renders fresh HTML on every request. **SSG** renders once at build time. **ISR** is SSG that regenerates itself in the background after a set interval.

## 6. When would you use each rendering method?

SSG for blogs, docs and marketing pages. ISR for products and news that change periodically. SSR for personalised or real-time data. CSR for private dashboards where SEO does not matter.

## 7. What is ISR and how does it work?

Incremental Static Regeneration serves a cached static page instantly, and if the page is older than the `revalidate` time it regenerates in the background. The current visitor still gets the fast cached version; the next visitor gets the fresh one.

## 8. What is `getServerSideProps`?

A Pages Router function that runs on the server for **every request** and passes its result to the page as props. It produces SSR.

## 9. What is `getStaticProps` and `getStaticPaths`?

`getStaticProps` runs at build time and produces a static page (adding `revalidate` turns it into ISR). `getStaticPaths` tells Next.js which dynamic paths to pre-build.

## 10. What are the `fallback` options in `getStaticPaths`?

`false` → any unlisted path returns 404. `true` → shows a fallback page immediately and swaps in the real content. `"blocking"` → waits on the server and sends the complete HTML with no flash.

## 11. How do you fetch data in the App Router?

Directly inside an **async Server Component** using `await`. No `useEffect`, no `getServerSideProps`, and the fetching code never reaches the browser.

## 12. What is a Server Component?

A component that runs only on the server. Its JavaScript is never sent to the browser. It can access the database and secrets directly but cannot use state, effects or event handlers. It is the default in the App Router.

## 13. What is `"use client"`?

A directive marking the boundary where client-side JavaScript begins. Everything imported below that file also becomes client-side, so it should be placed as low in the tree as possible.

## 14. Can a Client Component import a Server Component?

No. But it **can receive one as `children`**, because the server parent renders it first and the client component only positions the result.

## 15. What does "serializable props" mean?

Props passed from a Server to a Client Component must be convertible for transfer — strings, numbers, arrays, plain objects, Dates. Functions and class instances cannot cross the boundary (Server Actions are the exception).

## 16. What is a Server Action?

An async function marked `"use server"` that runs on the server but can be called directly from a form or client component — replacing manually written API routes for mutations.

## 17. Are Server Actions secure by default?

No. A Server Action compiles into a **public HTTP endpoint**. You must check authentication, check authorisation for the specific resource, and validate input inside every action.

## 18. What is `layout.js`?

A file defining shared UI that wraps a page and all nested routes. Layouts **preserve state** and do not re-render when navigating between pages inside them. The root layout is required and must contain `<html>` and `<body>`.

## 19. What is the difference between `layout.js` and `template.js`?

A layout persists across navigation and keeps its state. A template creates a **new instance** on every navigation, so state resets and effects re-run — useful for page transition animations.

## 20. What does `loading.js` do?

It automatically wraps the page in a `<Suspense>` boundary, using its export as the fallback. The loading UI appears instantly while the server component fetches data.

## 21. What does `error.js` do?

It creates an Error Boundary for that route segment. It must be a Client Component and receives `error` and `reset` props. It does not catch errors in the layout of the same segment.

## 22. What are dynamic routes?

Folders in square brackets. `[slug]` matches one segment, `[...slug]` catches one or more, `[[...slug]]` also matches the parent path with no segments.

## 23. What is `generateStaticParams`?

The App Router equivalent of `getStaticPaths`. It returns the list of dynamic paths to pre-build at build time.

## 24. What are route groups?

Folders wrapped in parentheses, like `(marketing)`. They organise files and allow different layouts **without affecting the URL**.

## 25. What are parallel routes?

Folders prefixed with `@`, rendering multiple pages in the same layout simultaneously, each with independent loading and error states. Used for dashboards and modals.

## 26. What are intercepting routes?

Patterns like `(.)folder` that show a route's content in a different context — for example opening a photo in a modal over the feed, while a direct visit to the same URL shows the full page.

## 27. What is a Route Handler?

A `route.js` file that creates an API endpoint. You export async functions named after HTTP methods (`GET`, `POST`, etc.). It cannot share a folder with `page.js`.

## 28. What is Middleware in Next.js?

Code in `middleware.js` that runs **before** a request completes, on the Edge Runtime. It can redirect, rewrite, set headers and read cookies. Use `matcher` to limit which paths it runs on.

## 29. What are middleware's limitations?

It runs on the Edge Runtime, so there are no Node.js APIs, no `fs`, and usually no database drivers. It must be fast because it runs on every matched request, and there can be only one middleware file per project.

## 30. What is the difference between redirect and rewrite?

A **redirect** changes the URL in the browser. A **rewrite** keeps the URL but serves different content — used for multi-tenancy, A/B tests and internationalisation.

## 31. What are the caching layers in Next.js?

**Request Memoization** (deduplicates identical fetches in one render), **Data Cache** (persists fetch results across requests), **Full Route Cache** (stores rendered HTML), and **Router Cache** (browser-side cache of visited routes).

## 32. How do you control fetch caching?

`cache: "force-cache"` for static, `cache: "no-store"` for always fresh, `next: { revalidate: 60 }` for ISR, and `next: { tags: [...] }` for on-demand revalidation.

## 33. What is `revalidatePath` and `revalidateTag`?

`revalidatePath(path)` clears the cache for one route. `revalidateTag(tag)` clears every cached fetch tagged with that string. Both are used after a mutation to refresh stale content.

## 34. What is a fetch waterfall and how do you fix it?

Sequential `await` calls where each request waits for the previous one, making the page slow. Fix it with `Promise.all` so independent requests run in parallel.

## 35. What is streaming in Next.js?

Sending HTML in pieces as each section becomes ready, instead of waiting for the slowest query. Wrap slow components in `<Suspense>` so fast content appears immediately.

## 36. What is `next/image` and why use it?

A component that automatically converts images to WebP/AVIF, generates responsive sizes, lazy loads below-the-fold images, and reserves space to prevent layout shift.

## 37. What does the `priority` prop do?

It disables lazy loading and loads the image immediately. Use it only on the **LCP image** — the large one visible on first load.

## 38. What is `next/font`?

It downloads and self-hosts fonts at build time, removing the external request to Google and eliminating layout shift by calculating a matching fallback.

## 39. How do you handle SEO in Next.js?

Export a `metadata` object for static pages or `generateMetadata` for dynamic ones. Add `sitemap.js`, `robots.js`, Open Graph tags and JSON-LD structured data.

## 40. What is the `metadata` object?

An export from a layout or page that Next.js converts into `<head>` tags — title, description, Open Graph, Twitter card, robots directives and canonical URLs.

## 41. How do environment variables work in Next.js?

Variables in `.env.local` are server-only. Only variables prefixed with `NEXT_PUBLIC_` are sent to the browser — and those are visible to everyone, so never put secrets in them. They are inlined at build time, so changing one requires a rebuild.

## 42. How do you implement authentication?

Use Auth.js or Clerk. Store the session in an `HttpOnly`, `Secure`, `SameSite` cookie. Protect in three layers: middleware for fast redirects, layout/page for guarding UI, and the data access layer for real security.

## 43. Why is middleware not enough for auth?

Middleware runs on the Edge Runtime and can usually only check that a cookie **exists**, not verify it against a database. Real authorisation must happen in the Server Action or Route Handler that touches the data.

## 44. What is hydration?

The process where React attaches event listeners and state to the server-rendered HTML in the browser. A hydration error means the server HTML did not match the first client render.

## 45. What causes hydration errors?

Using `window`/`localStorage` during render, `Date.now()` or `Math.random()` producing different values on server and client, invalid HTML nesting (like a `<div>` inside a `<p>`), or browser extensions modifying the DOM.

## 46. What is the Edge Runtime?

A lightweight JavaScript runtime that runs close to the user geographically. It starts instantly and is very fast, but supports only Web APIs — no Node.js modules or most database drivers.

## 47. How does code splitting work in Next.js?

Automatically — every route becomes its own JavaScript chunk. Client components imported from Server Components also become split points. You can split further with `next/dynamic`.

## 48. What is `next/dynamic`?

A function for dynamically importing a component with optional SSR disabling — useful for browser-only libraries.
```js
const Map = dynamic(() => import("./Map"), { ssr: false, loading: () => <Skeleton /> });
```

## 49. How do you reduce the JavaScript bundle in Next.js?

Keep `"use client"` as low as possible, use Server Components for heavy libraries, lazy load modals and charts, import only what you need from libraries, and check the `next build` output.

## 50. What is `output: "standalone"`?

A build mode that produces a minimal self-contained server bundle, used to create small Docker images.

## 51. What is a static export?

`output: "export"` generates pure static HTML files. It disables SSR, ISR, middleware, Route Handlers and image optimisation — only for fully static sites.

## 52. How do you read cookies and headers?

Use `cookies()` and `headers()` from `next/headers` in Server Components, Route Handlers and Server Actions. Note that using them makes the route **dynamic**.

## 53. Why did my static page become dynamic?

Because something in the tree used `cookies()`, `headers()`, `searchParams`, or a fetch with `cache: "no-store"`. Check the `next build` output to see which routes are marked dynamic.

## 54. How do you handle forms in Next.js?

Use a Server Action as the form's `action`. It works even without JavaScript. Combine with `useActionState` for validation errors and `useFormStatus` for the pending state.

## 55. What are `useActionState`, `useFormStatus` and `useOptimistic`?

`useActionState` manages an action's returned state and pending status. `useFormStatus` gives a nested button the parent form's pending state. `useOptimistic` shows a predicted result instantly while the real action runs.

## 56. What is the difference between `next/link` and an `<a>` tag?

`<Link>` performs client-side navigation without a full page reload and automatically prefetches the route when it enters the viewport. A plain `<a>` reloads the entire app.

## 57. How do you navigate programmatically?

`useRouter()` from **`next/navigation`** (not `next/router`) in Client Components, giving `push`, `replace`, `back` and `refresh`. In Server Components use `redirect()` from `next/navigation`.

## 58. What does `router.refresh()` do?

Refetches the server components for the current route and merges the new result, **without** losing client-side state or resetting scroll.

## 59. How do you handle 404 pages?

Create `not-found.js`, and call the `notFound()` function from `next/navigation` when data is missing.

## 60. What are the main Next.js 15 changes?

`fetch` is no longer cached by default, `params` and `searchParams` are now Promises that must be awaited, React 19 support, Turbopack is stable for development, and there is a new `after()` API for post-response work.
