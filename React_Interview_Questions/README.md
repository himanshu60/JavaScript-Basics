# React Interview Questions

📄 **[ReactImpQue.md](ReactImpQue.md)** — all 65 questions with answers in one file.

---

## Fundamentals

| Topic | File | Covers |
|---|---|---|
| Why React | [ReactBenifits.md](ReactBenifits.md) | Benefits of React |
| **JSX** | [JSX.md](JSX.md) | Compilation, rules, conditional rendering, XSS safety |
| **Components & Props** | [ComponentsAndProps.md](ComponentsAndProps.md) | Functional vs class, props, children, composition |
| Virtual DOM | [VirtualDOM.md](VirtualDOM.md) | What the VDOM is |
| **Reconciliation & Fiber** | [Reconciliation-And-Fiber.md](Reconciliation-And-Fiber.md) | Diffing algorithm, render vs commit, priorities |
| **Lifecycle** | [ReactLifeCycle.md](ReactLifeCycle.md) | All 3 phases, class methods + hook equivalents |
| **Keys in Lists** | [KeysInLists.md](KeysInLists.md) | Why keys matter, index-key bugs |
| Rendering lists of images | [MapImages.md](MapImages.md) | Mapping over data |

## Hooks

| Topic | File | Covers |
|---|---|---|
| **React Hooks** | [ReactHooks.md](ReactHooks.md) | `useState`, `useRef`, `useContext` + full hook list |
| **Rules of Hooks** | [HooksRules.md](HooksRules.md) | Both rules, every built-in hook defined |
| **useEffect Deep Dive** | [useEffectDeepDive.md](useEffectDeepDive.md) | Dependencies, cleanup, race conditions, `useLayoutEffect` |
| **useReducer** | [useReducer.md](useReducer.md) | Actions, reducers, dispatch, + Context |
| **Custom Hooks** | [CustomHooks.md](CustomHooks.md) | 8 ready-made hooks, best practices |
| **memo/useMemo/useCallback** | [MemoUseMemoUseCallback.md](MemoUseMemoUseCallback.md) | All three, why they fail, when not to use them |

## State Management

| Topic | File | Covers |
|---|---|---|
| Context API | [ContextAPI.md](ContextAPI.md) | Sharing data without props |
| Prop Drilling | [propDrilling.md](propDrilling.md) | The problem Context solves |
| Redux vs Context | [Redux-vs-Context.api.md](Redux-vs-Context.api.md) | Quick comparison |
| **Redux Toolkit** | [ReduxToolkit.md](ReduxToolkit.md) | createSlice, thunks, RTK Query |

## Forms, Errors & Structure

| Topic | File | Covers |
|---|---|---|
| **Controlled vs Uncontrolled** | [ControlledVsUncontrolled.md](ControlledVsUncontrolled.md) | `value` vs `defaultValue`, React Hook Form |
| **Error Boundaries** | [ErrorBoundaries.md](ErrorBoundaries.md) | What it catches and what it does not |
| **Fragments & Portals** | [FragmentsAndPortals.md](FragmentsAndPortals.md) | Extra-div problems, modal portals |
| **HOC & Render Props** | [HOC-And-RenderProps.md](HOC-And-RenderProps.md) | Legacy patterns, compound components |

## Routing & Performance

| Topic | File | Covers |
|---|---|---|
| **React Router** | [ReactRouter.md](ReactRouter.md) | Routes, params, nested layouts, protected routes |
| **Lazy Loading & Suspense** | [LazyLoadingSuspense.md](LazyLoadingSuspense.md) | Code splitting, preloading, streaming |
| **Data Fetching Patterns** | [DataFetchingPatterns.md](DataFetchingPatterns.md) | Loading/error/empty states, race conditions, pagination, filtering, caching, optimistic updates |
| **Performance Optimization** | [PerformanceOptimization.md](PerformanceOptimization.md) | Profiling, virtualization, transitions, checklist |
| **Server Components & React 19** | [ServerComponents.md](ServerComponents.md) | RSC, `"use client"`, Server Actions, new hooks |

---

## All 65 questions ([ReactImpQue.md](ReactImpQue.md))

1. What is React?
2. Difference between a library and a framework?
3. What is JSX?
4. Why can't a component return two sibling elements?
5. What is the Virtual DOM?
6. What is Reconciliation?
7. What is React Fiber?
8. What are the two phases of rendering?
9. What is a component?
10. Difference between functional and class components?
11. What are props?
12. Difference between props and state?
13. What is `props.children`?
14. What is one-way data flow?
15. What is `useState`?
16. Why is `setState` asynchronous / batched?
17. What is `useEffect`?
18. What does the dependency array do?
19. What is a cleanup function?
20. What is a stale closure?
21. Difference between `useEffect` and `useLayoutEffect`?
22. What are the Rules of Hooks?
23. What is a custom hook?
24. What is `useRef` used for?
25. Difference between `useState` and `useRef`?
26. What is `useReducer` and when should you use it?
27. What is `useMemo`?
28. What is `useCallback`?
29. What is `React.memo`?
30. When should you NOT use memoization?
31. What is the Context API?
32. What is prop drilling?
33. What is the problem with Context performance?
34. Context API vs Redux?
35. What is Redux Toolkit?
36. What is `createAsyncThunk`?
37. What is RTK Query?
38. Why do we need keys in lists?
39. Why is the array index a bad key?
40. Difference between controlled and uncontrolled components?
41. What is a Fragment?
42. What is a Portal?
43. What is an Error Boundary?
44. What is `React.lazy` and `Suspense`?
45. What is code splitting?
46. What is a Higher-Order Component (HOC)?
47. What are render props?
48. What are compound components?
49. What are the class component lifecycle methods?
50. How do you replicate lifecycle methods with `useEffect`?
51. What is Strict Mode?
52. What is a Server Component?
53. What is `"use client"`?
54. What is a Server Action?
55. What are `useTransition` and `useDeferredValue`?
56. How do you optimise React performance?
57. What is list virtualization?
58. How do you fetch data in React?
59. What is a race condition in data fetching and how do you fix it?
60. What is the React Compiler?
61. How do you test React components?
62. Difference between `useEffect` and an event handler?
63. Why must state updates be immutable?
64. What is `forwardRef` and is it still needed?
65. What is hydration?

---

**React vs Next.js:** [../Nextjs_Interview_Questions/ReactVsNextjs.md](../Nextjs_Interview_Questions/ReactVsNextjs.md) · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
