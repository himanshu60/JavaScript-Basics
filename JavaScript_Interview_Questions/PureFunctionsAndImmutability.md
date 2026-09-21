# Pure Functions, Side Effects and Immutability

---

## 1. What is a Pure Function?

**Definition:** A pure function is a function that satisfies **two rules**:
1. **Deterministic** — the same input always produces the same output.
2. **No side effects** — it does not change anything outside of itself.

**In simple words:** A pure function is like a vending machine. Press B4 and you always get the same chocolate, and nothing else in the world changes because of it.

```js
// PURE - depends only on its arguments, changes nothing outside
function add(a, b) {
  return a + b;
}
add(2, 3);  // always 5, forever
```

---

## 2. What is a Side Effect?

**Definition:** A side effect is any change a function makes to the world outside its own scope, or any dependency it has on outside state that can change.

**Common side effects:**

| Side effect | Example |
|---|---|
| Changing a global/outer variable | `total += value` |
| Changing (mutating) an argument | `arr.push(item)` |
| API calls / database writes | `fetch()`, `db.save()` |
| Writing to the DOM | `document.title = "New"` |
| Logging | `console.log()` |
| Reading changing values | `Date.now()`, `Math.random()` |
| Reading/writing storage | `localStorage.setItem()` |
| Throwing errors | `throw new Error()` |

> Side effects are **not bad** — an application with no side effects does nothing useful. The goal is to **keep them separate** from your pure logic, so the logic stays easy to test and reason about.

---

## 3. Pure vs Impure examples

```js
// ── PURE ──────────────────────────────
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function addItemPure(cart, item) {
  return [...cart, item];        // returns a NEW array
}

// ── IMPURE: depends on outside state ──
let tax = 0.1;
function addTax(price) {
  return price + price * tax;    // result changes if "tax" changes elsewhere
}
// PURE version: pass it in
function addTaxPure(price, taxRate) {
  return price + price * taxRate;
}

// ── IMPURE: changes outside state ─────
let total = 0;
function addToTotal(value) {
  total += value;                // side effect on a global variable
}

// ── IMPURE: not deterministic ─────────
function getRandomId() {
  return Math.random();          // different every single time
}
function getTimestamp() {
  return Date.now();             // depends on the clock
}

// ── IMPURE: mutates the argument ──────
function addItem(cart, item) {
  cart.push(item);               // the CALLER's array was changed!
  return cart;
}
```

---

## 4. Benefits of pure functions

| Benefit | Why |
|---|---|
| **Easy to test** | No mocks or setup needed — just call it and check the output |
| **Predictable** | Same input, same output, always |
| **Cacheable** | Results can be memoized safely |
| **Easy to debug** | The bug must be inside the function, nowhere else |
| **Parallel safe** | No shared state means no race conditions |
| **Composable** | Small pure functions can be chained together |

```js
// Pure functions can be safely memoized
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
// This is only safe because fn is PURE - an impure fn would return stale data
```

---

## 5. What is Mutation?

**Definition:** Mutation means **changing an existing object or array in place**, instead of creating a new one. The reference (memory address) stays the same, only the contents change.

```js
const arr = [1, 2, 3];
arr.push(4);           // MUTATION - same array, new contents

const newArr = [...arr, 5];  // NOT a mutation - a brand new array
```

---

## 6. What is Immutability?

**Definition:** Immutability is the practice of **never changing existing data**. Instead of modifying a value, you create a new copy with the change applied.

**In simple words:** Don't rub out and rewrite on the original page — photocopy it, write on the copy, and keep the original intact.

---

## 7. Mutating vs Non-mutating array methods

**Definition (mutating):** These methods change the original array and should be avoided when immutability matters.

| Mutating method | What it does |
|---|---|
| `push(item)` | Adds to the end |
| `pop()` | Removes from the end |
| `shift()` | Removes from the start |
| `unshift(item)` | Adds to the start |
| `splice(i, n, ...)` | Removes/inserts at a position |
| `sort()` | Sorts in place |
| `reverse()` | Reverses in place |
| `fill(value)` | Fills with a value |

**Definition (non-mutating):** These return a **new** array and leave the original untouched.

| Non-mutating method | What it does |
|---|---|
| `map(fn)` | New array with each item transformed |
| `filter(fn)` | New array with only the matching items |
| `slice(start, end)` | New array with a portion copied |
| `concat(arr)` | New array joining two arrays |
| `[...arr]` | New array copy (spread) |
| `toSorted()` | Sorted copy (newer method) |
| `toReversed()` | Reversed copy (newer method) |
| `toSpliced()` | Spliced copy (newer method) |
| `with(i, value)` | Copy with one index replaced (newer method) |

```js
const numbers = [3, 1, 2];

// Immutable equivalents of the mutating operations
const added = [...numbers, 4];                      // instead of push
const prepended = [0, ...numbers];                  // instead of unshift
const removedLast = numbers.slice(0, -1);           // instead of pop
const removedFirst = numbers.slice(1);              // instead of shift
const removedValue = numbers.filter((n) => n !== 1); // instead of splice
const sorted = [...numbers].sort();                 // copy FIRST, then sort
const reversed = [...numbers].reverse();

// Update one item by index
const updated = numbers.map((n, i) => (i === 1 ? 99 : n));

// Newer built-in methods that never mutate
const sorted2 = numbers.toSorted();     // [1, 2, 3], original untouched
const updated2 = numbers.with(1, 99);   // [3, 99, 2]
```

---

## 8. Immutable object updates

```js
const user = { name: "Himanshu", age: 25, address: { city: "Delhi", pin: 110001 } };

// Update one field
const older = { ...user, age: 26 };

// Update a NESTED field - you must spread at EVERY level
const moved = {
  ...user,
  address: { ...user.address, city: "Mumbai" },
};

// Add a field
const withEmail = { ...user, email: "a@b.com" };

// Remove a field (rest destructuring)
const { age, ...withoutAge } = user;

// Update an object inside an array
const users = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
const updatedUsers = users.map((u) =>
  u.id === 2 ? { ...u, name: "Updated" } : u
);
```

---

## 9. `Object.freeze()` — enforcing immutability

**Definition:** `Object.freeze(obj)` makes an object read-only. You cannot add, remove or change its properties. It returns the same object.

```js
const config = Object.freeze({ apiUrl: "https://api.com", timeout: 5000 });

config.timeout = 9999;       // silently ignored (throws in strict mode)
delete config.apiUrl;        // ignored
config.newKey = "x";         // ignored

console.log(config.timeout);          // 5000
console.log(Object.isFrozen(config)); // true
```

**Important: `Object.freeze` is SHALLOW.**

```js
const data = Object.freeze({ nested: { value: 1 } });
data.nested.value = 99;              // this WORKS - nested object is not frozen
console.log(data.nested.value);      // 99
```

**Deep freeze using recursion:**

```js
function deepFreeze(obj) {
  Object.values(obj).forEach((value) => {
    if (value && typeof value === "object") deepFreeze(value);
  });
  return Object.freeze(obj);
}
```

**Related methods:**
- `Object.seal(obj)` — you can **change** existing properties but cannot add or delete any.
- `Object.preventExtensions(obj)` — you can change and delete, but cannot add new ones.

---

## 10. Why immutability matters in React and Redux

**Definition:** React decides whether to re-render by comparing the **reference** of the old state with the new one (a shallow comparison). If you mutate state, the reference does not change, so React thinks nothing happened and skips the update.

```js
// ❌ BUG - mutation, React does NOT re-render
const [items, setItems] = useState([1, 2]);
items.push(3);
setItems(items);             // same reference → React sees "no change"

// ✅ CORRECT - new array, new reference
setItems([...items, 3]);

// ❌ BUG - nested mutation
const [user, setUser] = useState({ profile: { name: "A" } });
user.profile.name = "B";
setUser(user);

// ✅ CORRECT
setUser({ ...user, profile: { ...user.profile, name: "B" } });
```

**In Redux:** reducers **must** be pure functions that return new state objects. Redux DevTools' time-travel debugging only works because every state is a separate immutable snapshot.

```js
// ❌ Impure reducer
function reducer(state, action) {
  state.count++;             // mutation!
  return state;
}

// ✅ Pure reducer
function reducer(state, action) {
  return { ...state, count: state.count + 1 };
}
```

> **Redux Toolkit** lets you *write* mutating code thanks to the Immer library, which converts it into immutable updates behind the scenes.

---

## Key points

- Pure = same input → same output, and no side effects.
- Side effects are necessary, but keep them at the edges of your app.
- Mutation changes data in place; immutability creates a new copy.
- Learn which array methods mutate (`push`, `sort`, `splice`) and which do not (`map`, `filter`, `slice`).
- Spread at **every level** when updating nested data.
- `Object.freeze` is shallow — write a `deepFreeze` if you need full protection.
- React and Redux both depend on immutability to detect changes.
