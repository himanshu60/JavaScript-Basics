# Route Handlers, API Routes, Middleware and Server Actions

---

# PART 1 — Route Handlers (API endpoints)

## 1. What is a Route Handler?

**Definition:** A Route Handler is a file named `route.js` inside the `app/` directory that creates a **backend API endpoint**. You export functions named after HTTP methods, and they run on the server.

**In simple words:** It is how you build your backend inside the same Next.js project — no separate Express server needed.

```
app/api/users/route.js       → /api/users
app/api/users/[id]/route.js  → /api/users/123
```

**Rule:** `route.js` and `page.js` **cannot** exist in the same folder — one folder is either a page or an endpoint.

---

## 2. The HTTP methods

**Definition:** Export an async function named after the HTTP method you want to handle: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.

```js
// app/api/users/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/users
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);

  const users = await db.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ users, page });
}

// POST /api/users
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.create({ data: body });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

**Definition of `NextResponse`:** An extended version of the standard web `Response` object, with helpers like `.json()`, `.redirect()` and cookie handling.

---

## 3. Dynamic route handlers

```js
// app/api/users/[id]/route.js
export async function GET(request, { params }) {
  const { id } = await params;          // params is a Promise in Next.js 15+

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const user = await db.user.update({ where: { id }, data: body });
  return NextResponse.json(user);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.user.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });   // 204 = no content
}
```

---

## 4. Reading the request

```js
export async function POST(request) {
  // JSON body
  const json = await request.json();

  // Form data
  const formData = await request.formData();
  const name = formData.get("name");
  const file = formData.get("file");      // a File object

  // Query parameters
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  // Headers
  const auth = request.headers.get("authorization");

  // Cookies
  const token = request.cookies.get("token")?.value;
}
```

**Setting cookies in a response:**

```js
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set("token", "abc123", {
    httpOnly: true,       // JavaScript cannot read it - protects against XSS
    secure: true,         // HTTPS only
    sameSite: "lax",      // protects against CSRF
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
```

---

## 5. Pages Router API Routes (legacy)

```js
// pages/api/users.js
export default async function handler(req, res) {
  switch (req.method) {
    case "GET": {
      const users = await db.user.findMany();
      return res.status(200).json(users);
    }
    case "POST": {
      const user = await db.user.create({ data: req.body });
      return res.status(201).json(user);
    }
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${req.method} not allowed`);
  }
}
```

| Point | Pages API Routes | App Route Handlers |
|---|---|---|
| File | `pages/api/x.js` | `app/api/x/route.js` |
| Structure | One handler, switch on method | One exported function per method |
| Request/Response | Node-style `req`/`res` | Web standard `Request`/`Response` |
| Streaming | Difficult | Native support |

---

# PART 2 — Middleware

## 6. What is Middleware?

**Definition:** Middleware is code that runs **before a request is completed**, on every matching route. It runs on the **Edge Runtime** (close to the user, very fast) and can rewrite, redirect, or modify headers and cookies before the page or API handler runs.

**In simple words:** A security guard at the entrance who checks everyone before letting them in.

**File location:** `middleware.js` in the project root (next to `app/`, not inside it).

```js
// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);   // remember where they wanted to go
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in? Keep them out of the login page
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();    // continue normally
}

// Which paths should middleware run on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    // Or exclude static assets:
    // "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## 7. What middleware can do

| Action | Method |
|---|---|
| **Continue** | `NextResponse.next()` |
| **Redirect** (URL changes) | `NextResponse.redirect(url)` |
| **Rewrite** (URL stays, content differs) | `NextResponse.rewrite(url)` |
| **Return a response directly** | `NextResponse.json({...})` |
| **Set headers** | `response.headers.set(...)` |
| **Set cookies** | `response.cookies.set(...)` |

**Definition of rewrite vs redirect:** A **redirect** changes the URL in the user's browser. A **rewrite** keeps the URL the same but serves different content — useful for A/B tests, multi-tenancy and internationalisation.

```js
// Multi-tenant: shop.example.com → /sites/shop internally, URL stays the same
export function middleware(request) {
  const hostname = request.headers.get("host");
  const subdomain = hostname.split(".")[0];

  if (subdomain !== "www") {
    return NextResponse.rewrite(new URL(`/sites/${subdomain}`, request.url));
  }
}
```

**Common middleware use cases:**

```js
// 1. Security headers
const response = NextResponse.next();
response.headers.set("X-Frame-Options", "DENY");
response.headers.set("X-Content-Type-Options", "nosniff");

// 2. Locale detection
const locale = request.headers.get("accept-language")?.split(",")[0] ?? "en";
return NextResponse.rewrite(new URL(`/${locale}${pathname}`, request.url));

// 3. Simple rate limiting (use Redis in production)
const ip = request.headers.get("x-forwarded-for") ?? "unknown";

// 4. A/B testing
const variant = Math.random() > 0.5 ? "a" : "b";
const res = NextResponse.rewrite(new URL(`/home-${variant}`, request.url));
res.cookies.set("variant", variant);
```

---

## 8. Middleware limitations

**Definition:** Middleware runs on the **Edge Runtime**, a lightweight environment that is not full Node.js. This makes it fast but restricted.

| Limitation | Detail |
|---|---|
| No Node.js APIs | No `fs`, no native modules |
| No database drivers | Most ORMs (Prisma, Mongoose) will not run here |
| Size limit | About 1–4 MB bundle |
| Must be fast | It runs on **every** matched request |
| One file only | A single `middleware.js` for the whole project |

> Do **not** verify tokens against a database in middleware. Check for the cookie's presence there, and do the full verification in the page or Route Handler.

---

# PART 3 — Server Actions

## 9. What is a Server Action?

**Definition:** A Server Action is an async function marked with `"use server"` that runs on the server but can be called directly from a form or a Client Component — no API route, no `fetch`, no manual JSON handling.

```jsx
// app/actions.js
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/lib/db";

export async function createPost(prevState, formData) {
  const title = formData.get("title");
  const content = formData.get("content");

  // Always validate on the server - client validation can be bypassed
  if (!title || title.length < 3) {
    return { error: "Title must be at least 3 characters" };
  }

  // Always check authorisation - a Server Action is a public endpoint
  const session = await getSession();
  if (!session) return { error: "Unauthorised" };

  const post = await db.post.create({
    data: { title, content, authorId: session.userId },
  });

  revalidatePath("/posts");        // refresh the cached list
  redirect(`/posts/${post.id}`);   // navigate to the new post
}
```

```jsx
// Using it in a form - works even without JavaScript enabled
"use client";
import { useActionState } from "react";
import { createPost } from "./actions";

export default function NewPostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" />
      <textarea name="content" />
      <button disabled={isPending}>{isPending ? "Saving..." : "Publish"}</button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

---

## 10. Server Action security rules

**Definition:** A Server Action compiles into a **public HTTP endpoint**. Anyone can call it with any input, so you must treat it exactly like a public API.

```jsx
"use server";

export async function deletePost(postId) {
  // 1. ALWAYS check authentication
  const session = await getSession();
  if (!session) throw new Error("Unauthorised");

  // 2. ALWAYS check authorisation for THIS specific resource
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post.authorId !== session.userId) throw new Error("Forbidden");

  // 3. ALWAYS validate input (zod, yup, or manual checks)
  if (typeof postId !== "string") throw new Error("Invalid input");

  await db.post.delete({ where: { id: postId } });
  revalidatePath("/posts");
}
```

---

## 11. Server Action vs Route Handler — which one?

| Situation | Use |
|---|---|
| Form submission from your own app | **Server Action** |
| Creating/updating/deleting your own data | **Server Action** |
| A public API consumed by other clients (mobile app, third parties) | **Route Handler** |
| Webhooks from external services | **Route Handler** |
| You need a specific HTTP method and status codes | **Route Handler** |
| File uploads | Either (Route Handlers give more control) |
| Streaming responses | **Route Handler** |

---

## Key points

- `route.js` creates an API endpoint; export one function per HTTP method.
- `NextResponse.json(data, { status })` is the standard way to respond.
- `route.js` and `page.js` cannot share a folder.
- **Middleware** runs before every matched request on the Edge Runtime — good for auth checks, redirects, rewrites and headers, but it cannot use Node APIs or a database.
- Use `matcher` to limit which paths middleware runs on.
- **Server Actions** (`"use server"`) replace API routes for your own mutations, but they are public endpoints — always verify auth and validate input.
