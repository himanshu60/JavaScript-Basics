# Authentication and Deployment in Next.js

---

# PART 1 — Authentication

## 1. The two parts of auth

**Definition of Authentication:** Verifying **who the user is** (checking email and password, or a Google login).
**Definition of Authorization:** Deciding **what that user is allowed to do** (can this user delete this post?).

**In simple words:** Authentication is showing your ID card at the gate. Authorization is whether that ID lets you into the VIP room.

---

## 2. Where to store the session

**Definition:** After login, the server must remember the user across requests. There are two common approaches.

### a) Session cookie (recommended)

**Definition:** The server creates a session, stores a signed identifier in an **`HttpOnly` cookie**, and the browser sends it automatically on every request. JavaScript cannot read it, so an XSS attack cannot steal it.

```js
import { cookies } from "next/headers";

const cookieStore = await cookies();

cookieStore.set("session", sessionToken, {
  httpOnly: true,      // JavaScript cannot read it → protects against XSS
  secure: true,        // HTTPS only
  sameSite: "lax",     // protects against CSRF
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
});
```

### b) JWT in localStorage (not recommended)

**Definition:** A JSON Web Token stored in `localStorage` and sent manually in an `Authorization` header. It is convenient, but **any XSS vulnerability lets an attacker read and steal the token**.

| Storage | XSS safe | CSRF safe | Auto-sent | Verdict |
|---|---|---|---|---|
| `HttpOnly` cookie | ✅ | ✅ with `SameSite` | ✅ | **Recommended** |
| `localStorage` | ❌ | ✅ | ❌ | Avoid for auth tokens |

---

## 3. Using a library (the practical answer)

**Definition:** Writing secure auth from scratch is risky. In production, use a maintained library.

| Library | Best for |
|---|---|
| **Auth.js (NextAuth)** | The standard for Next.js — OAuth providers, sessions, database adapters |
| **Clerk** | Fastest setup, includes ready-made UI components |
| **Lucia** | Lightweight, you control the database |
| **Supabase Auth** | If you already use Supabase |

```js
// auth.js - Auth.js v5 setup
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub,
    Credentials({
      async authorize(credentials) {
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        return valid ? user : null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      return session;
    },
  },
});
```

```js
// app/api/auth/[...nextauth]/route.js
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

---

## 4. Protecting routes — the three layers

**Definition:** Never rely on a single check. Middleware gives a fast redirect, but real security must happen where the data is accessed.

### Layer 1 — Middleware (fast redirect, not real security)

```js
// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/settings/:path*"] };
```

> ⚠️ Middleware only checks that a cookie **exists** — it runs on the Edge Runtime and usually cannot verify it against a database. Treat it as a UX optimisation, not as security.

### Layer 2 — Page / Layout check

```jsx
// app/dashboard/layout.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");

  return <div>{children}</div>;
}
```

### Layer 3 — Data access (the real security boundary)

```jsx
"use server";

export async function deletePost(postId) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");                  // authentication

  const post = await db.post.findUnique({ where: { id: postId } });
  if (post.authorId !== session.user.id) throw new Error("Forbidden");  // authorization

  await db.post.delete({ where: { id: postId } });
  revalidatePath("/posts");
}
```

**The rule:** every Server Action and Route Handler is a **public endpoint**. Always check auth inside it, even if middleware already checked.

---

## 5. Role-based authorization

```jsx
// lib/auth-helpers.js
import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");
  return session;
}

export async function requireRole(role) {
  const session = await requireAuth();
  if (session.user.role !== role) throw new Error("Forbidden");
  return session;
}

// Usage
export async function deleteUser(userId) {
  "use server";
  await requireRole("admin");
  await db.user.delete({ where: { id: userId } });
}
```

---

## 6. Password handling

**Definition of hashing:** Converting a password into an irreversible fixed-length string. Even if the database leaks, the real passwords cannot be recovered.

**Definition of salting:** Adding random data to each password before hashing, so two identical passwords produce different hashes and pre-computed "rainbow tables" fail.

```js
import bcrypt from "bcryptjs";

// Registering - hash before storing. NEVER store a plain password.
const hashedPassword = await bcrypt.hash(password, 10);   // 10 = salt rounds
await db.user.create({ data: { email, password: hashedPassword } });

// Logging in - compare, never decrypt
const valid = await bcrypt.compare(inputPassword, user.password);
```

**Security checklist:**
- [ ] Hash passwords with bcrypt or argon2 — never store plain text
- [ ] Use `HttpOnly`, `Secure`, `SameSite` cookies
- [ ] Validate all input on the **server** (client validation can be bypassed)
- [ ] Rate-limit login attempts
- [ ] Use HTTPS everywhere
- [ ] Keep secrets in `.env.local`, never in `NEXT_PUBLIC_` variables
- [ ] Check authorisation in **every** Server Action and Route Handler
- [ ] Give the same error for "wrong email" and "wrong password" (avoids user enumeration)

---

# PART 2 — Deployment

## 7. Build output modes

**Definition:** `next build` decides for each route whether it is static, dynamic or ISR, and prints a summary.

```bash
npm run build

# Output legend:
# ○ (Static)    prerendered as static content
# ● (SSG)       prerendered with generateStaticParams
# λ (Dynamic)   server-rendered on demand
# ◐ (ISR)       revalidated on a schedule
```

Reading this output is the fastest way to catch a page that accidentally became dynamic.

**Why a page becomes dynamic unexpectedly:** using `cookies()`, `headers()`, `searchParams`, or `fetch` with `cache: "no-store"` anywhere in the tree.

---

## 8. Deployment options

| Platform | Notes |
|---|---|
| **Vercel** | Made by the Next.js team. Zero config, full feature support (ISR, middleware, image optimisation, edge functions) |
| **Netlify** | Good support via an adapter |
| **AWS / Amplify** | Flexible, more setup work |
| **Self-hosted (Node)** | `npm run build && npm start` behind nginx or PM2 |
| **Docker** | Use `output: "standalone"` for a small image |
| **Static export** | `output: "export"` — static files only, but disables SSR, ISR, middleware and image optimisation |

```js
// next.config.js - standalone build for Docker
module.exports = {
  output: "standalone",     // produces a minimal server bundle
};
```

```dockerfile
# Simplified Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 9. Environment variables in production

```bash
# .env.local (development only - never commit this)
DATABASE_URL="postgresql://localhost:5432/dev"
NEXTAUTH_SECRET="dev-secret"
```

**In production**, set variables in the hosting dashboard (Vercel → Settings → Environment Variables), not in a committed file.

> ⚠️ `NEXT_PUBLIC_` variables are **inlined at build time**. Changing one requires a **rebuild**, not just a restart.

---

## 10. Production checklist

- [ ] All secrets set in the hosting platform, not in the repo
- [ ] `.env.local` listed in `.gitignore`
- [ ] `npm run build` passes with no errors or type errors
- [ ] Check the build output — are the right pages static?
- [ ] Set `metadata` on every page; add `sitemap.js` and `robots.js`
- [ ] Add an `error.js` and a `not-found.js`
- [ ] Configure `images.remotePatterns` for all external image hosts
- [ ] Test the production build locally (`npm run build && npm start`)
- [ ] Run Lighthouse and check Core Web Vitals
- [ ] Set up error monitoring (Sentry) and analytics
- [ ] Configure security headers in `next.config.js`
- [ ] Verify auth works after deployment (cookies need HTTPS with `secure: true`)

```js
// next.config.js - security headers
module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
```

---

## Key points

- **Authentication** = who you are; **authorization** = what you may do.
- Store sessions in `HttpOnly` + `Secure` + `SameSite` cookies, not `localStorage`.
- Use **Auth.js / Clerk** rather than hand-rolling authentication.
- Protect in three layers: middleware (UX), page (redirect), **data access (real security)**.
- Every Server Action is a public endpoint — always verify auth and input inside it.
- Always hash passwords with bcrypt; never store plain text.
- Read the `next build` output to confirm which routes are static vs dynamic.
- `NEXT_PUBLIC_` variables are public and baked in at build time.
