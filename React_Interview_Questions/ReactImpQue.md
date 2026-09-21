# React Interview Questions and Answers

## 1. What is React?

React is an open-source JavaScript **library** (not a framework) for building user interfaces. It is component-based, declarative, and uses a Virtual DOM to update the screen efficiently.

## 2. What is the difference between a library and a framework?

A **library** gives you tools that you call when you want (React). A **framework** calls your code and controls the structure of your app (Angular). React only handles the UI layer, so you choose your own router, state manager and data-fetching tool.

## 3. What is JSX?

JSX (JavaScript XML) is a syntax extension that lets you write HTML-like markup inside JavaScript. Babel compiles it into `React.createElement()` calls, which produce plain JavaScript objects describing the UI.

## 4. Why can't a component return two sibling elements?

A JavaScript function can return only one value, so a component must return one root element. Use a **Fragment** (`<>...</>`) to group siblings without adding an extra DOM node.

## 5. What is the Virtual DOM?

A lightweight JavaScript object copy of the real DOM kept in memory. React updates the Virtual DOM first, compares it with the previous version (diffing), and then applies only the necessary changes to the real DOM.

## 6. What is Reconciliation?

The process of comparing the new Virtual DOM tree with the old one and calculating the minimum set of real DOM updates. It uses two heuristics: different element types rebuild the subtree, and `key` identifies which children are stable.

## 7. What is React Fiber?

The reconciliation engine introduced in React 16. It splits rendering into small interruptible units of work, so React can pause, prioritise and resume rendering. Fiber is what makes Suspense, transitions and concurrent rendering possible.

## 8. What are the two phases of rendering?

**Render phase** — builds the new tree and works out changes; it is interruptible and must be pure. **Commit phase** — applies changes to the DOM; it is synchronous and cannot be interrupted.

## 9. What is a component?

A reusable, independent piece of UI. It is a function (or class) that takes props and returns React elements. Component names must start with a capital letter.

## 10. What is the difference between functional and class components?

Functional components are plain functions using Hooks for state and lifecycle. Class components extend `React.Component`, use `this.state` and lifecycle methods. Functional components are the modern standard — less code, no `this` confusion.

## 11. What are props?

Props are read-only inputs passed from a parent to a child component. A component must never modify its own props.

## 12. What is the difference between props and state?

Props are owned by the parent and are read-only. State is owned by the component itself and can be changed with its setter. Both cause a re-render when they change.

## 13. What is `props.children`?

A special prop containing whatever is written between a component's opening and closing tags. It is what makes wrapper and layout components possible.

## 14. What is one-way data flow?

Data flows only from parent to child through props. A child updates a parent by calling a callback function the parent passed down. This makes the app predictable and easier to debug.

## 15. What is `useState`?

A Hook that adds state to a functional component. It returns the current value and a setter. Calling the setter schedules a re-render.

## 16. Why is `setState` asynchronous / batched?

React batches multiple state updates in the same event into one re-render for performance. This is why reading state right after setting it gives the old value. Use a **functional update** (`setCount(c => c + 1)`) when the new value depends on the previous one.

## 17. What is `useEffect`?

A Hook for running side effects after the component renders and the browser paints. Used for data fetching, subscriptions, timers and manual DOM changes.

## 18. What does the dependency array do?

It tells React when to re-run the effect. No array = every render. `[]` = once on mount. `[a, b]` = on mount and whenever `a` or `b` changes.

## 19. What is a cleanup function?

The function returned from an effect. React runs it before the effect runs again and when the component unmounts. It is used to clear timers, remove listeners, cancel requests and unsubscribe.

## 20. What is a stale closure?

When an effect or callback captures old values from the render in which it was created, and never sees the new ones — usually caused by missing dependencies. Fix it by adding the dependency or by using a functional state update.

## 21. What is the difference between `useEffect` and `useLayoutEffect`?

`useEffect` runs asynchronously **after** the browser paints. `useLayoutEffect` runs synchronously **before** the paint, blocking it. Use `useLayoutEffect` only for DOM measurements that would otherwise cause a visible flicker.

## 22. What are the Rules of Hooks?

1. Only call Hooks at the top level — never inside conditions, loops or after early returns. 2. Only call Hooks from React components or other custom hooks. React tracks hooks by **call order**, which is why the order must never change.

## 23. What is a custom hook?

A function whose name starts with `use` that calls other hooks, created to reuse stateful logic. Each component calling it gets its own **separate** state — custom hooks share logic, not state.

## 24. What is `useRef` used for?

Two things: accessing DOM elements directly, and storing a mutable value that persists across renders **without** causing a re-render when it changes.

## 25. What is the difference between `useState` and `useRef`?

Changing state triggers a re-render; changing a ref does not. State is for values shown in the UI; refs are for values you need to remember but do not display.

## 26. What is `useReducer` and when should you use it?

A Hook for complex state logic where you dispatch actions and a pure reducer computes the new state. Use it when several state values change together, when update logic is repeated, or when you want to test the logic separately.

## 27. What is `useMemo`?

Caches the **result of a calculation** so it is only recomputed when a dependency changes. Used for expensive calculations and for keeping object/array references stable.

## 28. What is `useCallback`?

Caches a **function reference** so it stays the same between renders. It is needed to make `React.memo` actually work on child components.

## 29. What is `React.memo`?

A higher-order component that skips re-rendering when props are shallow-equal to the previous ones. It is useless if the parent passes new object or function references each render.

## 30. When should you NOT use memoization?

When the calculation is cheap, when the child is not memoized, when dependencies change every render anyway, or when you have not profiled a real problem. Over-memoization makes code slower and harder to read.

## 31. What is the Context API?

A built-in way to share data across the component tree without passing props through every level. Create it with `createContext`, provide with `<Context.Provider>`, read with `useContext`.

## 32. What is prop drilling?

Passing props through many intermediate components that do not need them, just to reach a deep child. Context, component composition, or a state library solves it.

## 33. What is the problem with Context performance?

Every consumer re-renders whenever the context **value** changes. Fix it by memoizing the value with `useMemo` and splitting one large context into several smaller ones.

## 34. Context API vs Redux?

Context is built in and is best for low-frequency global data like theme, locale and the current user. Redux Toolkit adds DevTools, middleware, fine-grained selector subscriptions, and is better for large, frequently-changing shared state.

## 35. What is Redux Toolkit?

The official, recommended way to write Redux. `createSlice` generates actions and reducers together, Immer lets you write mutating-looking code safely, and `configureStore` sets up middleware and DevTools automatically.

## 36. What is `createAsyncThunk`?

An RTK helper that creates an async action and automatically dispatches `pending`, `fulfilled` and `rejected` actions, which you handle in `extraReducers`.

## 37. What is RTK Query?

A data-fetching and caching layer built into Redux Toolkit. It generates hooks from your endpoint definitions and handles caching, deduplication, loading states and automatic refetching via tags.

## 38. Why do we need keys in lists?

Keys give each item a stable identity so React can match old and new elements during reconciliation, instead of comparing by position. Without them React recreates DOM nodes unnecessarily.

## 39. Why is the array index a bad key?

When items are added, removed or reordered, the index-to-item mapping changes. React then matches the wrong elements, so component state, input values and focus attach to the wrong rows.

## 40. What is the difference between controlled and uncontrolled components?

A controlled input stores its value in React state and updates via `onChange`. An uncontrolled input keeps its value in the DOM and is read through a ref. Use `value` for controlled and `defaultValue` for uncontrolled.

## 41. What is a Fragment?

A wrapper that groups children without adding a DOM node. `<>...</>` is the short form; `<React.Fragment key={...}>` is needed when you must pass a key.

## 42. What is a Portal?

`createPortal(children, domNode)` renders a child into a different part of the DOM while keeping it in the React tree. Used for modals, tooltips and toasts to escape `overflow: hidden` and `z-index` problems. Events still bubble through the React tree.

## 43. What is an Error Boundary?

A class component with `getDerivedStateFromError` and/or `componentDidCatch` that catches render-phase errors in its children and shows a fallback UI. It does **not** catch errors in event handlers, async code or SSR.

## 44. What is `React.lazy` and `Suspense`?

`React.lazy(() => import("./X"))` loads a component only when it is first rendered, creating a separate bundle chunk. `<Suspense fallback={...}>` shows a placeholder while it loads.

## 45. What is code splitting?

Breaking the bundle into smaller chunks loaded on demand, so the initial download is smaller and the app becomes interactive faster. Route-based splitting gives the biggest benefit.

## 46. What is a Higher-Order Component (HOC)?

A function that takes a component and returns a new enhanced component. Named with a `with` prefix. Mostly replaced by custom hooks because HOCs cause "wrapper hell".

## 47. What are render props?

A prop whose value is a function returning JSX, letting a component share its state while the caller decides the UI. Mostly replaced by custom hooks, which avoid deep callback nesting.

## 48. What are compound components?

A group of components that work together through shared Context, like `<Tabs>`, `<Tabs.Tab>` and `<Tabs.Panel>`. Still widely used in UI libraries because they give consumers full markup control.

## 49. What are the class component lifecycle methods?

**Mounting:** `constructor` → `render` → `componentDidMount`. **Updating:** `render` → `componentDidUpdate`. **Unmounting:** `componentWillUnmount`. In functional components, `useEffect` covers all three.

## 50. How do you replicate lifecycle methods with `useEffect`?

`componentDidMount` → `useEffect(fn, [])`. `componentDidUpdate` → `useEffect(fn, [deps])`. `componentWillUnmount` → the cleanup function returned from the effect.

## 51. What is Strict Mode?

A development-only wrapper that double-invokes renders and effects to surface unsafe patterns, missing cleanups and impure components. It does nothing in production.

## 52. What is a Server Component?

A component that runs only on the server. Its JavaScript is never sent to the browser. It can access the database directly but cannot use state, effects or event handlers. It is the default in the Next.js App Router.

## 53. What is `"use client"`?

A directive marking the boundary where client-side JavaScript begins. Everything that file imports also becomes client-side, so it should be placed as low in the tree as possible.

## 54. What is a Server Action?

An async function marked `"use server"` that runs on the server but can be called from a form or a client component — replacing manually written API routes for mutations.

## 55. What are `useTransition` and `useDeferredValue`?

Both keep the UI responsive during expensive updates. `useTransition` marks an update as non-urgent so React can interrupt it. `useDeferredValue` returns a lagging copy of a value so the urgent UI can update first.

## 56. How do you optimise React performance?

Profile first, then: move state down, pass `children` to avoid re-renders, memoize with `React.memo`/`useMemo`/`useCallback`, split and memoize contexts, virtualize long lists, code split by route, use transitions, and cache server data with React Query.

## 57. What is list virtualization?

Rendering only the rows currently visible on screen (plus a buffer) instead of all of them. Libraries: `react-window`, `@tanstack/react-virtual`. Use it for lists over roughly 100 items.

## 58. How do you fetch data in React?

In modern apps, use **React Query / SWR / RTK Query** — they handle caching, deduplication, retries and background refetching. Fetching inside `useEffect` works but you must handle loading, errors, cancellation and race conditions yourself.

## 59. What is a race condition in data fetching and how do you fix it?

When two requests are in flight and the slower older one resolves last, overwriting newer data. Fix it with an `AbortController` in the effect cleanup, or with an `ignore` flag.

## 60. What is the React Compiler?

A build-time tool in React 19 that automatically inserts memoization, making manual `useMemo`, `useCallback` and `React.memo` largely unnecessary.

## 61. How do you test React components?

Use **React Testing Library** with Jest or Vitest. Test what the user sees and does — query by role and text, fire events, assert on the result — rather than testing implementation details like state variables.

## 62. What is the difference between `useEffect` and an event handler?

If something happens because of a **user action**, put it in the event handler. If it happens because the component appeared or must stay in sync with an external system, use an effect. Most "unnecessary effects" are logic that belongs in a handler or can be calculated during render.

## 63. Why must state updates be immutable?

React compares references to detect changes. Mutating an object or array keeps the same reference, so React sees no change and skips the re-render. Always create a new object or array.

## 64. What is `forwardRef` and is it still needed?

`forwardRef` let a parent pass a ref through to a child's DOM node. In **React 19 it is no longer needed** — `ref` can be received as an ordinary prop.

## 65. What is hydration?

The process where React attaches event listeners and state to server-rendered HTML in the browser, making the static markup interactive. A hydration error means the server HTML and the first client render did not match.
