# React Server Components, Server Actions and React 19 Features

## 1. What is a React Server Component (RSC)?

**Definition:** A React Server Component is a component that runs **only on the server**. Its code is never sent to the browser — only its rendered output is. It can access the database, the file system and secrets directly, but it cannot use state, effects or browser events.

**In simple words:** The component runs on the server, does its data fetching there, and sends the finished UI to the browser. The browser never downloads that component's JavaScript.

**Why they exist:**
- **Smaller bundles** — server component code and its libraries never reach the browser.
- **Direct data access** — query the database without building an API route.
- **Better security** — API keys and secrets stay on the server.
- **Faster first load** — the HTML arrives already filled with data.

---

## 2. Server vs Client Components

**Definition of a Client Component:** A component that runs in the browser (and is also pre-rendered on the server). It is marked with the `"use client"` directive at the top of the file. Only these can use state, effects and event handlers.

In frameworks like Next.js App Router, **every component is a Server Component by default.**

```jsx
// app/page.jsx - a Server Component (the default, no directive needed)
import db from "@/lib/db";

export default async function ProductPage() {
  const products = await db.product.findMany();   // direct DB access, no API needed

  return (
    <div>
      <h1>Products</h1>
      <ProductList products={products} />
    </div>
  );
}
```

```jsx
// components/AddToCart.jsx - a Client Component
"use client";                                     // ← this directive is required

import { useState } from "react";

export default function AddToCart({ productId }) {
  const [count, setCount] = useState(1);          // state only works here

  return (
    <button onClick={() => addToCart(productId, count)}>
      Add {count} to cart
    </button>
  );
}
```

---

## 3. What each type can and cannot do

| Feature | Server Component | Client Component |
|---|---|---|
| `useState`, `useReducer` | ❌ | ✅ |
| `useEffect`, `useLayoutEffect` | ❌ | ✅ |
| Event handlers (`onClick`) | ❌ | ✅ |
| Browser APIs (`window`, `localStorage`) | ❌ | ✅ |
| `async`/`await` directly in the component | ✅ | ❌ (use `use()` instead) |
| Direct database access | ✅ | ❌ |
| Access to environment secrets | ✅ | ❌ |
| Sends JavaScript to the browser | ❌ | ✅ |
| Can import a Server Component | ✅ | Only as `children` |

---

## 4. Composition rules (the most confusing part)

### Rule 1 — A Client Component cannot import a Server Component

```jsx
"use client";
import ServerComponent from "./ServerComponent";   // ❌ becomes a client component

export default function ClientComp() {
  return <ServerComponent />;
}
```

### Rule 2 — But it CAN receive one as `children`

**Definition:** Passing a Server Component as `children` works because the **parent server component** renders it, and the client component only places the already-rendered output.

```jsx
// app/page.jsx (Server Component)
import ClientWrapper from "./ClientWrapper";
import ServerContent from "./ServerContent";

export default function Page() {
  return (
    <ClientWrapper>
      <ServerContent />     {/* ✅ works - passed as children */}
    </ClientWrapper>
  );
}
```

```jsx
"use client";
export default function ClientWrapper({ children }) {
  const [open, setOpen] = useState(false);
  return <div>{open && children}</div>;     // just renders what it was given
}
```

### Rule 3 — Props passed to a Client Component must be serializable

**Definition:** Serializable means the value can be converted to a format that survives the server→browser transfer. Functions, class instances and Dates-as-objects cannot cross that boundary.

```jsx
// ✅ Serializable
<ClientComp title="Hello" count={5} items={[1,2]} data={{ id: 1 }} />

// ❌ Not serializable
<ClientComp onClick={() => {}} formatter={new Intl.NumberFormat()} />
```

### Rule 4 — Push `"use client"` down the tree

**Definition:** Marking a component as a client component also makes **everything it imports** a client component. Put the directive on the smallest possible leaf, not on a whole page.

```jsx
// ❌ The entire page and all its imports become client-side
"use client";
export default function Page() { /* big page with one button */ }

// ✅ Only the button is client-side
export default function Page() {
  return (
    <div>
      <ServerContent />
      <InteractiveButton />   {/* only THIS file has "use client" */}
    </div>
  );
}
```

---

## 5. What are Server Actions?

**Definition:** A Server Action is an async function marked with `"use server"` that runs **on the server** but can be called directly from a client component or a form — with no manual API route, no `fetch` call and no JSON handling.

```jsx
// app/actions.js
"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTodo(formData) {
  const text = formData.get("text");

  if (!text) return { error: "Text is required" };

  await db.todo.create({ data: { text } });
  revalidatePath("/todos");               // refresh the cached page
  return { success: true };
}
```

```jsx
// Use it directly as a form action - this works without JavaScript enabled
import { createTodo } from "./actions";

export default function TodoForm() {
  return (
    <form action={createTodo}>
      <input name="text" />
      <button type="submit">Add</button>
    </form>
  );
}
```

**What you no longer need:** an `/api/todos` route, a `fetch` call, `JSON.stringify`, manual headers, and manual loading state.

---

## 6. React 19 hooks for actions

### `useActionState`

**Definition:** Manages the state returned by a server action, plus its pending status.

```jsx
"use client";
import { useActionState } from "react";
import { createTodo } from "./actions";

export default function TodoForm() {
  const [state, formAction, isPending] = useActionState(createTodo, null);

  return (
    <form action={formAction}>
      <input name="text" />
      <button disabled={isPending}>{isPending ? "Adding..." : "Add"}</button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

### `useFormStatus`

**Definition:** Reads the pending state of the **parent** form, so a nested submit button can disable itself without prop drilling.

```jsx
"use client";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Saving..." : "Save"}</button>;
}
```

### `useOptimistic`

**Definition:** Shows an **optimistic** (predicted) result immediately while the real server action is still running, then reconciles with the actual result — making the UI feel instant.

```jsx
"use client";
import { useOptimistic } from "react";

function TodoList({ todos, addTodo }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );

  async function handleAdd(formData) {
    const text = formData.get("text");
    addOptimisticTodo({ text });     // appears on screen instantly
    await addTodo(formData);         // the real request happens after
  }

  return (
    <>
      <form action={handleAdd}><input name="text" /></form>
      <ul>
        {optimisticTodos.map((t) => (
          <li key={t.id} style={{ opacity: t.pending ? 0.5 : 1 }}>{t.text}</li>
        ))}
      </ul>
    </>
  );
}
```

### The `use()` hook

**Definition:** `use()` reads the value of a Promise or a Context. Unlike other hooks, it **can** be called conditionally and inside loops.

```jsx
import { use, Suspense } from "react";

function UserProfile({ userPromise }) {
  const user = use(userPromise);   // suspends until the promise resolves
  return <h1>{user.name}</h1>;
}

// The server component starts the fetch without awaiting it,
// so the rest of the page renders immediately
export default function Page() {
  const userPromise = fetchUser();

  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

---

## 7. Streaming with Suspense

**Definition:** Streaming means the server sends the HTML in pieces as each part becomes ready, instead of waiting for all data before sending anything. Slow sections show a fallback and are filled in as they arrive.

```jsx
export default function Dashboard() {
  return (
    <div>
      <Header />                             {/* instant */}

      <Suspense fallback={<StatsSkeleton />}>
        <SlowStats />                        {/* streams in when ready */}
      </Suspense>

      <Suspense fallback={<FeedSkeleton />}>
        <SlowFeed />                         {/* streams in independently */}
      </Suspense>
    </div>
  );
}
```

---

## 8. Other React 19 improvements

| Feature | Definition |
|---|---|
| **React Compiler** | Automatically adds memoization, so `useMemo`/`useCallback`/`memo` become largely unnecessary |
| **`ref` as a prop** | Function components accept `ref` directly — `forwardRef` is no longer needed |
| **Document metadata** | `<title>`, `<meta>` and `<link>` can be rendered anywhere and are hoisted into `<head>` |
| **Better hydration errors** | Clear diffs showing exactly what mismatched |
| **Resource preloading** | `preload()`, `preinit()` for fonts, scripts and stylesheets |
| **Cleanup from ref callbacks** | A ref callback can return a cleanup function |

```jsx
// ref as a normal prop (React 19)
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;     // no forwardRef wrapper needed
}

// Metadata rendered inside a component
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>            {/* automatically hoisted to <head> */}
      <meta name="description" content={post.excerpt} />
      <h1>{post.title}</h1>
    </article>
  );
}
```

---

## 9. When to use what

| Situation | Choose |
|---|---|
| Fetching and displaying data | **Server Component** |
| SEO-critical content | **Server Component** |
| Using a heavy library (markdown, date formatting) | **Server Component** — it stays off the client |
| Any `onClick`, `onChange`, form interaction | **Client Component** |
| `useState`, `useEffect`, custom hooks | **Client Component** |
| Browser APIs, animations | **Client Component** |
| Form submissions and mutations | **Server Action** |

---

## Key points

- Server Components run only on the server and send **zero JavaScript** to the browser.
- In the Next.js App Router, components are Server Components **by default**.
- `"use client"` marks the boundary — put it as **low in the tree** as possible.
- A client component cannot import a server component, but can receive it as `children`.
- Props crossing the boundary must be **serializable**.
- **Server Actions** (`"use server"`) replace API routes for mutations.
- `useActionState`, `useFormStatus` and `useOptimistic` handle pending and optimistic UI.
- **Suspense + streaming** lets slow sections load independently.
