# 🚀 Top 50 Advanced React Interview Questions

The advanced React questions asked in mid-level and senior interviews. Each one has a **short answer**, a simple explanation, a **code example**, and an interview tip.

**How to use this:** Give the **Short answer** first in the interview. Then use the example to explain it. Each question also links to a deep-dive file if you want more detail.

**New to React?** Start with the [Top 30 Most Asked Questions](../Most_Asked_Questions/README.md) first. This list builds on those.

| Part | Topic | Questions | File |
|---|---|---|---|
| 1 | ⚛️ Rendering & Reconciliation | 1–10 | [01_Rendering.md](01_Rendering.md) |
| 2 | 🪝 Advanced Hooks | 11–20 | [02_Hooks.md](02_Hooks.md) |
| 3 | ⚡ Performance & Optimization | 21–30 | [03_Performance.md](03_Performance.md) |
| 4 | 🏗️ Architecture & State | 31–40 | [04_Architecture.md](04_Architecture.md) |
| 5 | 🌐 SSR, Security & Advanced Concepts | 41–50 | [05_SSR_Security.md](05_SSR_Security.md) |

---

## ⚛️ Part 1 — Rendering & Reconciliation

1. [How does React Fiber work?](01_Rendering.md#1-how-does-react-fiber-work)
2. [What triggers a component re-render?](01_Rendering.md#2-what-triggers-a-component-re-render)
3. [How does reconciliation work internally?](01_Rendering.md#3-how-does-reconciliation-work-internally)
4. [What is the difference between render and commit phases?](01_Rendering.md#4-what-is-the-difference-between-render-and-commit-phases)
5. [How do keys affect reconciliation?](01_Rendering.md#5-how-do-keys-affect-reconciliation)
6. [What causes unnecessary re-renders?](01_Rendering.md#6-what-causes-unnecessary-re-renders)
7. [How does React batching work?](01_Rendering.md#7-how-does-react-batching-work)
8. [What is automatic batching in React 18+?](01_Rendering.md#8-what-is-automatic-batching-in-react-18)
9. [How do transitions improve UI responsiveness?](01_Rendering.md#9-how-do-transitions-improve-ui-responsiveness)
10. [What is concurrent rendering?](01_Rendering.md#10-what-is-concurrent-rendering)

## 🪝 Part 2 — Advanced Hooks

11. [`useEffect` vs `useLayoutEffect`?](02_Hooks.md#11-useeffect-vs-uselayouteffect)
12. [How do stale closures occur in Hooks?](02_Hooks.md#12-how-do-stale-closures-occur-in-hooks)
13. [How do you prevent race conditions in `useEffect`?](02_Hooks.md#13-how-do-you-prevent-race-conditions-in-useeffect)
14. [When should you use `useMemo`?](02_Hooks.md#14-when-should-you-use-usememo)
15. [When should you use `useCallback`?](02_Hooks.md#15-when-should-you-use-usecallback)
16. [How does `useRef` differ from `useState`?](02_Hooks.md#16-how-does-useref-differ-from-usestate)
17. [How would you design a custom Hook?](02_Hooks.md#17-how-would-you-design-a-custom-hook)
18. [What are the rules of Hooks, and why do they exist?](02_Hooks.md#18-what-are-the-rules-of-hooks-and-why-do-they-exist)
19. [When would you use `useReducer` over `useState`?](02_Hooks.md#19-when-would-you-use-usereducer-over-usestate)
20. [What is `useSyncExternalStore` used for?](02_Hooks.md#20-what-is-usesyncexternalstore-used-for)

## ⚡ Part 3 — Performance & Optimization

21. [`React.memo` vs `useMemo` vs `useCallback`?](03_Performance.md#21-reactmemo-vs-usememo-vs-usecallback)
22. [How do you profile a slow React application?](03_Performance.md#22-how-do-you-profile-a-slow-react-application)
23. [How does code splitting work?](03_Performance.md#23-how-does-code-splitting-work)
24. [How do lazy loading and Suspense work together?](03_Performance.md#24-how-do-lazy-loading-and-suspense-work-together)
25. [How would you optimize a list with thousands of items?](03_Performance.md#25-how-would-you-optimize-a-list-with-thousands-of-items)
26. [What is list virtualization?](03_Performance.md#26-what-is-list-virtualization)
27. [How do you prevent Context from causing excessive re-renders?](03_Performance.md#27-how-do-you-prevent-context-from-causing-excessive-re-renders)
28. [How do you identify and fix memory leaks?](03_Performance.md#28-how-do-you-identify-and-fix-memory-leaks)
29. [What is the purpose of the React Profiler?](03_Performance.md#29-what-is-the-purpose-of-the-react-profiler)
30. [How would you optimize a large React application?](03_Performance.md#30-how-would-you-optimize-a-large-react-application)

## 🏗️ Part 4 — Architecture & State

31. [Context API vs Redux Toolkit?](04_Architecture.md#31-context-api-vs-redux-toolkit)
32. [Client state vs server state?](04_Architecture.md#32-client-state-vs-server-state)
33. [How would you manage state in a large application?](04_Architecture.md#33-how-would-you-manage-state-in-a-large-application)
34. [What is prop drilling, and how can you avoid it?](04_Architecture.md#34-what-is-prop-drilling-and-how-can-you-avoid-it)
35. [How do you design reusable component APIs?](04_Architecture.md#35-how-do-you-design-reusable-component-apis)
36. [Controlled vs uncontrolled components?](04_Architecture.md#36-controlled-vs-uncontrolled-components)
37. [What are Error Boundaries and their limitations?](04_Architecture.md#37-what-are-error-boundaries-and-their-limitations)
38. [How would you structure a scalable React codebase?](04_Architecture.md#38-how-would-you-structure-a-scalable-react-codebase)
39. [How do you handle API caching and request deduplication?](04_Architecture.md#39-how-do-you-handle-api-caching-and-request-deduplication)
40. [How do you manage complex forms efficiently?](04_Architecture.md#40-how-do-you-manage-complex-forms-efficiently)

## 🌐 Part 5 — SSR, Security & Advanced Concepts

41. [CSR vs SSR vs SSG?](05_SSR_Security.md#41-csr-vs-ssr-vs-ssg)
42. [What is hydration, and why can it fail?](05_SSR_Security.md#42-what-is-hydration-and-why-can-it-fail)
43. [What causes hydration mismatches?](05_SSR_Security.md#43-what-causes-hydration-mismatches)
44. [What are React Server Components?](05_SSR_Security.md#44-what-are-react-server-components)
45. [Server Components vs Client Components?](05_SSR_Security.md#45-server-components-vs-client-components)
46. [How does Suspense work with asynchronous rendering?](05_SSR_Security.md#46-how-does-suspense-work-with-asynchronous-rendering)
47. [How do you prevent XSS vulnerabilities in React?](05_SSR_Security.md#47-how-do-you-prevent-xss-vulnerabilities-in-react)
48. [How would you implement authentication securely?](05_SSR_Security.md#48-how-would-you-implement-authentication-securely)
49. [How do you test complex components and Hooks?](05_SSR_Security.md#49-how-do-you-test-complex-components-and-hooks)
50. [How would you design a production-ready React application?](05_SSR_Security.md#50-how-would-you-design-a-production-ready-react-application)

---

**More practice:** [Top 30 most asked](../Most_Asked_Questions/README.md) · [All 66 React questions](../ReactImpQue.md) · [React topics](../README.md) · [All questions](../../ALL_QUESTIONS.md)
