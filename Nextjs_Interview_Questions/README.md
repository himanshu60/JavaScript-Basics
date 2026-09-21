# Next.js Interview Questions

All topics use the App Router (Next.js 13+), with Pages Router equivalents where they are still asked.

📄 **[NextjsImpQue.md](NextjsImpQue.md)** — all 60 questions with answers in one file.

---

## Topics

| # | Topic | File | Covers |
|---|---|---|---|
| 1 | **What is Next.js** | [WhatIsNextjs.md](WhatIsNextjs.md) | Why it exists, the SEO problem, features, project structure |
| 2 | **React vs Next.js** | [ReactVsNextjs.md](ReactVsNextjs.md) | Library vs framework, full comparison, when to use which |
| 3 | **Rendering: CSR/SSR/SSG/ISR** | [RenderingMethods.md](RenderingMethods.md) | All four defined, code for each, decision guide |
| 4 | **Routing & Special Files** | [RoutingAndSpecialFiles.md](RoutingAndSpecialFiles.md) | page, layout, template, loading, error, dynamic/group/parallel routes |
| 5 | **Data Fetching & Caching** | [DataFetchingAndCaching.md](DataFetchingAndCaching.md) | 4 cache layers, revalidation, waterfalls, streaming |
| 6 | **Server vs Client Components** | [ServerVsClientComponents.md](ServerVsClientComponents.md) | `"use client"`, composition rules, serializable props |
| 7 | **Route Handlers & Middleware** | [RouteHandlersAndMiddleware.md](RouteHandlersAndMiddleware.md) | API endpoints, middleware, rewrites, Server Actions |
| 8 | **Optimization & SEO** | [OptimizationAndSEO.md](OptimizationAndSEO.md) | next/image, next/font, metadata, sitemap, Core Web Vitals |
| 9 | **Auth & Deployment** | [AuthAndDeployment.md](AuthAndDeployment.md) | Sessions, 3-layer protection, build output, Docker |
| 10 | Vue.js | [Vue.Js.md](Vue.Js.md) | Short note on Vue for comparison |

---

## All 60 questions ([NextjsImpQue.md](NextjsImpQue.md))

1. What is Next.js?
2. Why use Next.js instead of plain React?
3. Difference between the Pages Router and the App Router?
4. What is file-based routing?
5. What are CSR, SSR, SSG and ISR?
6. When would you use each rendering method?
7. What is ISR and how does it work?
8. What is `getServerSideProps`?
9. What is `getStaticProps` and `getStaticPaths`?
10. What are the `fallback` options in `getStaticPaths`?
11. How do you fetch data in the App Router?
12. What is a Server Component?
13. What is `"use client"`?
14. Can a Client Component import a Server Component?
15. What does "serializable props" mean?
16. What is a Server Action?
17. Are Server Actions secure by default?
18. What is `layout.js`?
19. Difference between `layout.js` and `template.js`?
20. What does `loading.js` do?
21. What does `error.js` do?
22. What are dynamic routes?
23. What is `generateStaticParams`?
24. What are route groups?
25. What are parallel routes?
26. What are intercepting routes?
27. What is a Route Handler?
28. What is Middleware in Next.js?
29. What are middleware's limitations?
30. Difference between redirect and rewrite?
31. What are the caching layers in Next.js?
32. How do you control fetch caching?
33. What is `revalidatePath` and `revalidateTag`?
34. What is a fetch waterfall and how do you fix it?
35. What is streaming in Next.js?
36. What is `next/image` and why use it?
37. What does the `priority` prop do?
38. What is `next/font`?
39. How do you handle SEO in Next.js?
40. What is the `metadata` object?
41. How do environment variables work in Next.js?
42. How do you implement authentication?
43. Why is middleware not enough for auth?
44. What is hydration?
45. What causes hydration errors?
46. What is the Edge Runtime?
47. How does code splitting work in Next.js?
48. What is `next/dynamic`?
49. How do you reduce the JavaScript bundle in Next.js?
50. What is `output: "standalone"`?
51. What is a static export?
52. How do you read cookies and headers?
53. Why did my static page become dynamic?
54. How do you handle forms in Next.js?
55. What are `useActionState`, `useFormStatus` and `useOptimistic`?
56. Difference between `next/link` and an `<a>` tag?
57. How do you navigate programmatically?
58. What does `router.refresh()` do?
59. How do you handle 404 pages?
60. What are the main Next.js 15 changes?

---

**React basics:** [../React_Interview_Questions/](../React_Interview_Questions/) · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
