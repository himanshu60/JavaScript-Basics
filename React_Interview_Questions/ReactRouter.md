# React Router

## 1. What is Routing?

**Definition:** Routing is the process of showing different content based on the URL. In a traditional website each URL is a separate HTML file fetched from the server. In a React app, routing happens **entirely in the browser** — no page reload.

**Definition of an SPA (Single Page Application):** An app where one HTML file is loaded once, and JavaScript swaps the content as the user navigates. This makes navigation instant, but you need a router to keep the URL in sync with what is displayed.

**Definition of React Router:** The most popular routing library for React. It maps URL paths to components and handles navigation, URL parameters, nested layouts and redirects.

```bash
npm install react-router-dom
```

---

## 2. The core components

### `<BrowserRouter>`

**Definition:** The router that uses the browser's **History API** to keep the UI in sync with clean URLs like `/about`. It must wrap your entire app.

```jsx
import { BrowserRouter } from "react-router-dom";

<BrowserRouter>
  <App />
</BrowserRouter>
```

**Other router types:**
- **`HashRouter`** — uses URLs like `/#/about`. Needed when the server cannot be configured (e.g. static file hosts).
- **`MemoryRouter`** — keeps history in memory, not in the URL. Used in tests and React Native.

### `<Routes>` and `<Route>`

**Definition of `<Routes>`:** A container that looks at the current URL and renders the **single best matching** `<Route>`.
**Definition of `<Route>`:** Defines one mapping — `path` (the URL pattern) and `element` (the component to render).

```jsx
import { Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/products" element={<Products />} />
  <Route path="*" element={<NotFound />} />   {/* "*" catches everything else */}
</Routes>
```

### `<Link>` and `<NavLink>`

**Definition of `<Link>`:** Renders an `<a>` tag but prevents the full page reload, navigating with JavaScript instead.
**Definition of `<NavLink>`:** The same as `Link`, but it knows when it is the active route, so you can style it.

```jsx
import { Link, NavLink } from "react-router-dom";

<Link to="/about">About</Link>

<NavLink
  to="/about"
  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
>
  About
</NavLink>
```

> ❌ Never use `<a href="/about">` inside a React app — it causes a full page reload and loses all state.

---

## 3. Dynamic routes and URL parameters

**Definition:** A dynamic segment is a part of the path written with a colon, like `:id`. It matches any value, and that value becomes available as a **URL parameter**.

```jsx
<Route path="/users/:userId" element={<UserProfile />} />
<Route path="/posts/:category/:postId" element={<Post />} />
```

**Definition of `useParams()`:** A hook that returns an object containing all the dynamic segments of the current URL.

```jsx
import { useParams } from "react-router-dom";

function UserProfile() {
  const { userId } = useParams();     // /users/42 → userId = "42"

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  return <h1>User {userId}</h1>;
}
```

> Params are always **strings** — convert with `Number(userId)` when needed.

---

## 4. Nested routes and layouts

**Definition:** Nested routes let a parent route render a shared layout, while its child routes render inside it. The child content appears wherever the parent places an `<Outlet />`.

**Definition of `<Outlet />`:** A placeholder component that renders the matched child route.

```jsx
<Routes>
  <Route path="/dashboard" element={<DashboardLayout />}>
    <Route index element={<Overview />} />          {/* /dashboard */}
    <Route path="stats" element={<Stats />} />      {/* /dashboard/stats */}
    <Route path="settings" element={<Settings />} />{/* /dashboard/settings */}
  </Route>
</Routes>
```

```jsx
import { Outlet } from "react-router-dom";

function DashboardLayout() {
  return (
    <div className="dashboard">
      <Sidebar />              {/* stays on screen for all child routes */}
      <main>
        <Outlet />             {/* the matched child renders HERE */}
      </main>
    </div>
  );
}
```

**Definition of `index`:** The `index` route is the default child, shown when the parent's path matches exactly.

---

## 5. Programmatic navigation

**Definition of `useNavigate()`:** A hook returning a function that navigates from your code, rather than from a link click.

```jsx
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    await login(credentials);
    navigate("/dashboard");                      // go to a path
    navigate("/dashboard", { replace: true });   // replace, so Back does not return to login
    navigate(-1);                                // go back one page
    navigate(1);                                 // go forward
    navigate("/profile", { state: { from: "login" } });  // pass hidden state
  };
}
```

**Definition of `<Navigate>`:** A component that navigates as soon as it renders. Used for redirects inside JSX.

```jsx
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

---

## 6. Other useful hooks

### `useLocation()`

**Definition:** Returns an object describing the current URL: `pathname`, `search` (the query string), `hash` and `state`.

```jsx
const location = useLocation();
console.log(location.pathname);  // "/products"
console.log(location.search);    // "?category=shoes&page=2"
console.log(location.state);     // data passed via navigate(..., { state })

// Common use - scroll to top on every route change
useEffect(() => {
  window.scrollTo(0, 0);
}, [location.pathname]);
```

### `useSearchParams()`

**Definition:** Reads and updates the **query string** (`?key=value`). It works like `useState`, but the state lives in the URL — so it survives refresh and can be shared as a link.

```jsx
import { useSearchParams } from "react-router-dom";

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") ?? "all";
  const page = Number(searchParams.get("page") ?? 1);

  const changeCategory = (newCategory) => {
    setSearchParams({ category: newCategory, page: "1" });
  };

  return <Filters category={category} onChange={changeCategory} />;
}
```

**Why put filters in the URL:** the user can bookmark it, share it, refresh without losing state, and the Back button works correctly.

---

## 7. Protected (private) routes

**Definition:** A protected route is one that checks authentication before rendering, redirecting unauthenticated users to the login page.

```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    // Remember where they wanted to go, so we can return them after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute><Dashboard /></ProtectedRoute>
} />

// Or protect an entire group with a layout route
<Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile" element={<Profile />} />
</Route>
```

**Returning the user after login:**

```jsx
function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname ?? "/dashboard";

  const handleLogin = async () => {
    await login();
    navigate(from, { replace: true });   // back to where they were going
  };
}
```

---

## 8. Data Router API (v6.4+)

**Definition:** The Data Router lets you define **loaders** (fetch data before the route renders) and **actions** (handle form submissions) directly on the route, removing loading spinners caused by fetching inside `useEffect`.

```jsx
import { createBrowserRouter, RouterProvider, useLoaderData } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,       // catches errors from this branch
    children: [
      {
        path: "users/:id",
        element: <UserProfile />,
        loader: async ({ params }) => {
          const res = await fetch(`/api/users/${params.id}`);
          if (!res.ok) throw new Response("Not Found", { status: 404 });
          return res.json();
        },
        action: async ({ request }) => {
          const formData = await request.formData();
          return updateUser(Object.fromEntries(formData));
        },
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

function UserProfile() {
  const user = useLoaderData();    // data is ALREADY loaded - no spinner needed
  return <h1>{user.name}</h1>;
}
```

**Related hooks:** `useNavigation()` (global loading state), `useActionData()` (result of an action), `useFetcher()` (submit without navigating), `useRouteError()` (read the error in `errorElement`).

---

## 9. Lazy loading routes

```jsx
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));

<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

Each route becomes its own JavaScript chunk, downloaded only when visited.

---

## 10. Common mistakes

```jsx
// 1. Using <a> instead of <Link> → full page reload
<a href="/about">About</a>          // ❌
<Link to="/about">About</Link>      // ✅

// 2. Forgetting BrowserRouter → hooks throw "useNavigate() may be used only in a Router"

// 3. Forgetting a 404 route
<Route path="*" element={<NotFound />} />   // ✅ always add this

// 4. Forgetting replace on a redirect → the Back button loops
<Navigate to="/login" replace />

// 5. Not adding the param to the dependency array → stale data
useEffect(() => { fetchUser(id); }, [id]);   // ✅ id must be listed

// 6. Server not configured for SPA → refreshing /about gives a 404
//    The server must serve index.html for all paths
```

---

## Key points

- `BrowserRouter` wraps the app; `Routes`/`Route` map URLs to components.
- Use `<Link>`/`<NavLink>`, never a plain `<a>` for internal navigation.
- `:param` creates a dynamic segment, read with `useParams()`.
- `<Outlet />` is where nested child routes render — the basis of shared layouts.
- `useNavigate()` navigates from code; `<Navigate>` redirects from JSX.
- `useSearchParams()` keeps filters and pagination in the URL, so they are shareable.
- Protected routes check auth and redirect, remembering the intended destination.
- The Data Router's `loader`/`action` API fetches data before rendering.
