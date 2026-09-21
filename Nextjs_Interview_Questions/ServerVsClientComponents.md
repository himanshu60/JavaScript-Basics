# Server vs Client Components in Next.js

## 1. The core idea

**Definition:** In the Next.js App Router, **every component is a Server Component by default**. A Server Component runs only on the server, and its JavaScript is never sent to the browser. A Client Component is marked with `"use client"` and runs in the browser, where it can use state, effects and event handlers.

**In simple words:** Server Components build the HTML on the server and send it ready-made. Client Components are the interactive islands inside that HTML.

---

## 2. Server Components

**Definition:** A component that executes on the server during rendering. It can be `async`, can access the database and secrets directly, and produces output that is streamed to the browser as HTML.

```jsx
// app/products/page.js - a Server Component (no directive needed)
import db from "@/lib/db";

export default async function ProductsPage() {
  const products = await db.product.findMany();   // direct DB access

  return (
    <div>
      <h1>Products ({products.length})</h1>
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

**Advantages:**

| Advantage | Explanation |
|---|---|
| **Zero JavaScript sent** | The component's code and its libraries never reach the browser |
| **Direct data access** | Query the database without creating an API route |
| **Secrets stay safe** | API keys never touch the client |
| **Faster first load** | HTML arrives already filled with data |
| **Better SEO** | Crawlers see complete content immediately |
| **Automatic code splitting** | Client components imported from them become split points |

**Restrictions:**
- No `useState`, `useReducer`, `useEffect` or any hook that holds state
- No event handlers (`onClick`, `onChange`)
- No browser APIs (`window`, `document`, `localStorage`)
- No Context (they cannot consume a React Context provider)

---

## 3. Client Components

**Definition:** A component marked with `"use client"` at the very top of its file. It is pre-rendered on the server for the initial HTML, then **hydrated** in the browser so it becomes interactive.

```jsx
"use client";                    // must be the first line of the file

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

**Definition of Hydration:** The process where React attaches event listeners and state to the server-rendered HTML, turning the static markup into a working interactive component.

**Use a Client Component when you need:**
- State or effects (`useState`, `useEffect`, `useReducer`)
- Event handlers (clicks, input changes, form interactions)
- Browser APIs (`localStorage`, `window`, geolocation)
- Custom hooks that use any of the above
- React Context (both the provider and consumers)
- Third-party libraries that use any of these internally

---

## 4. Side-by-side comparison

| Feature | Server Component | Client Component |
|---|---|---|
| Directive | None (default) | `"use client"` |
| Runs on | Server only | Server (pre-render) + browser |
| `async`/`await` in the component | ✅ | ❌ |
| `useState`, `useEffect` | ❌ | ✅ |
| Event handlers | ❌ | ✅ |
| Browser APIs | ❌ | ✅ |
| Database access | ✅ | ❌ |
| Environment secrets | ✅ | ❌ (only `NEXT_PUBLIC_`) |
| Sends JS to the browser | ❌ | ✅ |
| Can import the other type | ✅ can import client | ❌ only as `children` |

---

## 5. The composition rules

### Rule 1 — A Server Component can import a Client Component

```jsx
// app/page.js (Server)
import Counter from "@/components/Counter";   // a client component

export default async function Page() {
  const data = await getData();
  return (
    <div>
      <h1>{data.title}</h1>
      <Counter />           {/* ✅ perfectly fine */}
    </div>
  );
}
```

### Rule 2 — A Client Component CANNOT import a Server Component

```jsx
"use client";
import ServerComponent from "./ServerComponent";   // ❌ it silently becomes a client component

export default function ClientComp() {
  return <ServerComponent />;
}
```

### Rule 3 — But it CAN receive one as `children`

**Definition:** This works because the **Server Component parent** renders the children first, and the client component only positions the already-rendered result.

```jsx
// app/page.js (Server)
import Modal from "@/components/Modal";        // client
import ServerContent from "./ServerContent";   // server

export default function Page() {
  return (
    <Modal>
      <ServerContent />      {/* ✅ works - passed as children */}
    </Modal>
  );
}
```

```jsx
"use client";
export default function Modal({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && <div className="modal">{children}</div>}
    </>
  );
}
```

### Rule 4 — Props must be serializable

**Definition:** Data passed from a Server Component to a Client Component must be convertible to a transferable format. Functions and class instances cannot cross that boundary.

```jsx
// ✅ Allowed
<ClientComp title="Hi" count={5} items={[1,2]} user={{ id: 1 }} date={new Date()} />

// ❌ Not allowed
<ClientComp onSave={() => {}} formatter={new Intl.NumberFormat()} />
```

> **Exception:** a **Server Action** can be passed as a prop — Next.js turns it into a reference the client can call.

---

## 6. Push `"use client"` down the tree

**Definition:** The directive marks a **boundary**, not a single file. Everything imported below that boundary also becomes client-side. Placing it too high sends far more JavaScript than necessary.

```jsx
// ❌ BAD - the whole page and everything it imports goes to the browser
"use client";
import HeavyChart from "./HeavyChart";
import MarkdownRenderer from "./MarkdownRenderer";

export default function Page() {
  const [tab, setTab] = useState(0);        // only THIS needs to be client-side
  return (
    <div>
      <button onClick={() => setTab(1)}>Tab</button>
      <HeavyChart />
      <MarkdownRenderer />
    </div>
  );
}
```

```jsx
// ✅ GOOD - only the tiny interactive piece is client-side
// app/page.js (Server)
import Tabs from "./Tabs";                  // small client component
import HeavyChart from "./HeavyChart";      // stays on the server
import MarkdownRenderer from "./MarkdownRenderer";

export default async function Page() {
  const data = await getData();
  return (
    <div>
      <Tabs />
      <HeavyChart data={data} />
      <MarkdownRenderer content={data.md} />
    </div>
  );
}
```

**The pattern:** build the page as Server Components, then extract the small interactive bits into their own client files.

---

## 7. Context providers with Server Components

**Definition:** A Context Provider must be a Client Component, but you can still wrap Server Components with it — because they are passed as `children`.

```jsx
// components/Providers.jsx
"use client";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

```jsx
// app/layout.js (still a Server Component)
import Providers from "@/components/Providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>   {/* children stay server components */}
      </body>
    </html>
  );
}
```

---

## 8. Common patterns and mistakes

```jsx
// ❌ MISTAKE 1 - passing a function as a prop
// Server component:
<ClientButton onClick={() => console.log("hi")} />   // Error: not serializable

// ✅ Define the handler inside the client component
"use client";
function ClientButton() {
  return <button onClick={() => console.log("hi")}>Click</button>;
}
```

```jsx
// ❌ MISTAKE 2 - using a browser API in a Server Component
export default function Page() {
  const theme = localStorage.getItem("theme");   // Error: localStorage is not defined
}

// ✅ Move it into a client component, inside an effect
"use client";
useEffect(() => {
  const theme = localStorage.getItem("theme");
}, []);
```

```jsx
// ❌ MISTAKE 3 - leaking a secret to the client
"use client";
const key = process.env.API_SECRET;    // undefined in the browser

// ✅ Fetch on the server and pass only the safe result down
```

```jsx
// ❌ MISTAKE 4 - "use client" not on the first line
import { useState } from "react";
"use client";                          // Error: must be the very first line
```

---

## 9. Quick decision guide

```
Does this component need state, effects, events or browser APIs?
├── NO  → Server Component (the default) ✅
└── YES → Client Component ("use client")
          └── Can you extract just the interactive part into a smaller component?
                └── YES → do that, keep the rest on the server ✅
```

---

## Key points

- Server Components are the **default** in the App Router and send **zero JavaScript**.
- `"use client"` marks a **boundary** — everything imported below it becomes client-side.
- Keep the directive as **low in the tree** as possible.
- A client component cannot import a server component, but can receive one as `children`.
- Props crossing the boundary must be **serializable** (Server Actions are the exception).
- Fetch data in Server Components; handle interaction in small Client Components.
