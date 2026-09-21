# Browser Storage - localStorage, sessionStorage, Cookies, IndexedDB

## 1. What is Browser Storage?

**Definition:** Browser storage refers to the different ways a website can save data **inside the user's browser**, so the data is still there after a page refresh or even after closing the browser.

**Definition of "Origin":** Storage is separated per origin, which is the combination of **protocol + domain + port** (for example `https://site.com:443`). One site can never read another site's storage.

The four main options are **localStorage**, **sessionStorage**, **Cookies** and **IndexedDB**.

---

## 2. What is localStorage?

**Definition:** `localStorage` is a key-value store that saves data in the browser **permanently** — it has no expiry date and survives browser restarts. Data is shared across all tabs of the same origin. It stores only **strings**.

**In simple words:** A permanent drawer in the browser. Whatever you put in stays there until you (or the user) delete it.

### localStorage methods (each one defined)

| Method | Definition |
|---|---|
| `localStorage.setItem(key, value)` | Saves a value under that key. The value is always converted to a string. |
| `localStorage.getItem(key)` | Returns the stored string, or `null` if the key does not exist. |
| `localStorage.removeItem(key)` | Deletes that one key. |
| `localStorage.clear()` | Deletes **everything** for this origin. |
| `localStorage.key(index)` | Returns the key name at that index. |
| `localStorage.length` | The number of items stored. |

```js
localStorage.setItem("theme", "dark");
console.log(localStorage.getItem("theme"));  // "dark"
console.log(localStorage.getItem("missing")); // null

localStorage.removeItem("theme");
localStorage.clear();
console.log(localStorage.length);  // 0
```

### Storing objects (important)

**Definition:** localStorage can only store strings, so objects and arrays must be converted using `JSON.stringify()` when saving and `JSON.parse()` when reading.

```js
const user = { name: "Himanshu", age: 25 };

localStorage.setItem("user", JSON.stringify(user));       // object → string
const saved = JSON.parse(localStorage.getItem("user"));   // string → object

console.log(saved.name); // "Himanshu"
```

**Without JSON it breaks:**

```js
localStorage.setItem("user", user);
console.log(localStorage.getItem("user")); // "[object Object]" ← data lost
```

**Key facts:**
- Size limit: about **5–10 MB**.
- Shared across all tabs and windows of the same origin.
- **Synchronous** — it blocks the main thread, so never store very large data in it.
- Never sent to the server.

---

## 3. What is sessionStorage?

**Definition:** `sessionStorage` has exactly the same API as `localStorage`, but the data is **cleared when the browser tab is closed** and is **not shared between tabs** — each tab has its own separate copy.

**In simple words:** A drawer that is emptied as soon as you close the tab.

```js
sessionStorage.setItem("currentStep", "2");
console.log(sessionStorage.getItem("currentStep")); // "2"
// Close the tab → the data is gone
```

**Important detail:** opening the same site in a **new tab** gives a brand-new empty sessionStorage. A page **refresh** keeps it. Duplicating a tab copies it.

**Best used for:** a multi-step form, a checkout wizard, temporary filters, scroll position.

---

## 4. What are Cookies?

**Definition:** A cookie is a very small piece of data (max ~4 KB) stored by the browser and **automatically attached to every HTTP request** sent to that domain. This is what makes them useful for server-side sessions.

**In simple words:** A small note the browser carries and shows to the server on every single visit.

```js
// Set a cookie
document.cookie = "username=Himanshu; max-age=86400; path=/; SameSite=Strict";

// Read ALL cookies (comes back as one long string)
console.log(document.cookie); // "username=Himanshu; theme=dark"

// Delete a cookie (set its expiry in the past)
document.cookie = "username=; max-age=0; path=/";
```

### Cookie attributes (each one defined)

| Attribute | Definition |
|---|---|
| `expires=<date>` | The exact date/time when the cookie should be deleted. |
| `max-age=<seconds>` | How many seconds the cookie should live. Overrides `expires`. |
| `path=/` | Which URL paths the cookie is sent for. `/` means the whole site. |
| `domain=` | Which domain (and subdomains) can receive the cookie. |
| **`Secure`** | The cookie is sent **only over HTTPS**, never plain HTTP. |
| **`HttpOnly`** | JavaScript **cannot read** this cookie. Only the server can. Protects against XSS attacks. Can only be set by the server. |
| **`SameSite=Strict/Lax/None`** | Controls whether the cookie is sent on cross-site requests. Protects against CSRF attacks. |

**Definition of XSS (Cross-Site Scripting):** An attack where a hacker injects malicious JavaScript into your page. That script can read `localStorage` and normal cookies — but **not** `HttpOnly` cookies.

**Definition of CSRF (Cross-Site Request Forgery):** An attack where another website tricks the user's browser into sending a request to your site using their saved cookies. `SameSite` blocks this.

**Helper functions:**

```js
function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}
```

---

## 5. What is IndexedDB?

**Definition:** IndexedDB is a full **NoSQL database built into the browser**. It stores large amounts of structured data (including files and blobs), works **asynchronously**, and supports indexes and transactions.

**In simple words:** A real database inside the browser, for when localStorage is too small or too slow.

**Key facts:**
- Size: hundreds of MB or more (depends on free disk space).
- Asynchronous — does not block the UI.
- Stores real objects, no JSON conversion needed.
- The raw API is complicated, so libraries like **Dexie.js** or **idb** are normally used.

**Best used for:** offline apps, PWAs, caching large API datasets, storing images/files.

---

## 6. Full comparison table

| Point | localStorage | sessionStorage | Cookies | IndexedDB |
|---|---|---|---|---|
| **Size limit** | ~5–10 MB | ~5–10 MB | ~4 KB | Very large (100s of MB) |
| **Expires** | Never (manual delete) | On tab close | On set expiry date | Never (manual delete) |
| **Sent to server** | No | No | **Yes, every request** | No |
| **Shared across tabs** | Yes | **No** | Yes | Yes |
| **Readable by JS** | Yes | Yes | Yes (unless `HttpOnly`) | Yes |
| **Sync / Async** | Synchronous | Synchronous | Synchronous | **Asynchronous** |
| **Data type** | Strings only | Strings only | Strings only | Any structured data |
| **Best for** | Theme, language, cart | Form step, temp state | Auth sessions | Offline data, files |

---

## 7. Which one should you use?

- **Authentication tokens** → an `HttpOnly` + `Secure` + `SameSite` **cookie**. This is the safest, because JavaScript (and therefore any XSS attack) cannot read it. Storing a JWT in localStorage is common but less secure.
- **User preferences** (theme, language, sidebar state) → **localStorage**.
- **Temporary per-tab data** (form wizard step) → **sessionStorage**.
- **Large or offline data** → **IndexedDB**.

---

## 8. The `storage` event — syncing between tabs

**Definition:** The `storage` event fires on **other tabs** of the same origin whenever localStorage changes. It does **not** fire in the tab that made the change.

```js
window.addEventListener("storage", (e) => {
  console.log("Key changed:", e.key);
  console.log("Old value:", e.oldValue);
  console.log("New value:", e.newValue);
});

// Real use: log the user out in ALL open tabs at once
window.addEventListener("storage", (e) => {
  if (e.key === "token" && e.newValue === null) {
    window.location.href = "/login";
  }
});
```

---

## 9. Always wrap storage in try/catch

**Definition:** Storage can throw an error in private/incognito mode, when the user has blocked site data, or when the quota is full. It can also return corrupted JSON.

```js
const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Storage failed (full or blocked):", e);
      return false;
    }
  },

  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;    // corrupted JSON → return the fallback instead of crashing
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
```

---

## Key points

- localStorage = permanent, shared across tabs, ~5 MB, strings only.
- sessionStorage = per tab, cleared on tab close.
- Cookies = tiny, auto-sent to the server, the right place for auth sessions.
- IndexedDB = a real async database for large data.
- Always `JSON.stringify()` / `JSON.parse()` objects, and always use try/catch.
- Never store passwords or sensitive data in localStorage — XSS can read it.
