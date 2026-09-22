# map, filter, reduce and forEach

## 1. What are they?

**Definition:** These are **higher-order array methods** — they take a callback function and apply it to every element. They replace manual `for` loops with declarative, chainable operations.

**The one-line summary:**

| Method | Definition | Returns |
|---|---|---|
| **`map`** | Transforms every element | A **new array**, same length |
| **`filter`** | Keeps only elements passing a test | A **new array**, shorter or equal |
| **`reduce`** | Boils the array down to a single value | **Any** single value |
| **`forEach`** | Runs a function for each element | **`undefined`** |

**The callback signature is the same for all four:** `(element, index, array)`.

---

## 2. `map` — transform

**Definition:** Creates a new array by applying a function to each element. The result **always has the same length** as the original.

```js
const nums = [1, 2, 3];

const doubled = nums.map((n) => n * 2);          // [2, 4, 6]
const withIndex = nums.map((n, i) => `${i}: ${n}`);  // ["0: 1", "1: 2", "2: 3"]

// Extracting a field - the most common real use
const users = [{ name: "Amit", age: 25 }, { name: "Priya", age: 30 }];
const names = users.map((u) => u.name);          // ["Amit", "Priya"]

// Reshaping objects
const simplified = users.map(({ name, age }) => ({ label: name, years: age }));
```

**The arrow function trap — implicit vs explicit return:**

```js
users.map((u) => ({ name: u.name }));    // ✅ brackets around the object
users.map((u) => { name: u.name });      // ❌ returns undefined - { } is a BLOCK
users.map((u) => { return { name: u.name }; });   // ✅ explicit return
```

---

## 3. `filter` — select

**Definition:** Creates a new array containing only the elements for which the callback returns a **truthy** value.

```js
const nums = [1, 2, 3, 4, 5, 6];

const evens = nums.filter((n) => n % 2 === 0);        // [2, 4, 6]
const adults = users.filter((u) => u.age >= 18);

// Removing falsy values
[0, 1, "", "a", null, 2].filter(Boolean);              // [1, "a", 2]

// Removing an item immutably (the React pattern)
const remaining = items.filter((item) => item.id !== idToDelete);
```

> `filter` returns an **array**, even when only one item matches. Use `find` when you want the item itself.

```js
users.filter((u) => u.id === 1);    // [{...}]  an array
users.find((u) => u.id === 1);      // {...}    the object, or undefined
```

---

## 4. `reduce` — accumulate

**Definition:** Runs a function over every element, carrying an **accumulator** from one iteration to the next, and returns the final accumulated value. It is the most powerful and most misunderstood of the four.

```js
array.reduce((accumulator, current, index, array) => newAccumulator, initialValue);
```

```js
const nums = [1, 2, 3, 4];

const sum = nums.reduce((acc, n) => acc + n, 0);       // 10
const max = nums.reduce((acc, n) => (n > acc ? n : acc), nums[0]);
```

**How the sum runs:**

| Step | acc | n | returns |
|---|---|---|---|
| start | 0 (initial) | — | — |
| 1 | 0 | 1 | 1 |
| 2 | 1 | 2 | 3 |
| 3 | 3 | 3 | 6 |
| 4 | 6 | 4 | **10** |

**Always pass the initial value.** Without it, `reduce` uses the first element as the accumulator and starts at index 1 — and it **throws on an empty array**.

```js
[].reduce((a, b) => a + b);       // ❌ TypeError: Reduce of empty array
[].reduce((a, b) => a + b, 0);    // ✅ 0
```

**`reduce` is not just for sums:**

```js
// Group by a property
const byRole = users.reduce((acc, user) => {
  (acc[user.role] ||= []).push(user);
  return acc;
}, {});
// { admin: [...], user: [...] }

// Count occurrences
const counts = ["a", "b", "a"].reduce((acc, ch) => {
  acc[ch] = (acc[ch] ?? 0) + 1;
  return acc;
}, {});
// { a: 2, b: 1 }

// Array → lookup object (very common with API data)
const byId = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
// ⚠️ that spread makes it O(n²) - prefer mutating the accumulator:
const byId = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

// Flatten (though .flat() is clearer)
[[1,2],[3,4]].reduce((acc, arr) => acc.concat(arr), []);   // [1,2,3,4]
```

> **Readability warning:** if a `reduce` takes more than a few lines to understand, a plain `for...of` loop is better. Clever `reduce` is a common source of unreadable code.

---

## 5. `forEach` — side effects only

**Definition:** Executes a function for each element and returns `undefined`. It cannot be chained and cannot produce a value.

```js
users.forEach((user) => console.log(user.name));   // logging
items.forEach((item) => saveToDatabase(item));     // side effects
```

**Three things `forEach` cannot do:**

```js
// 1. Cannot be chained - it returns undefined
const result = nums.forEach((n) => n * 2);         // undefined

// 2. Cannot break or continue
nums.forEach((n) => {
  if (n > 3) break;        // ❌ SyntaxError
  if (n > 3) return;       // only skips THIS iteration, like continue
});

// 3. Does NOT wait for async callbacks
ids.forEach(async (id) => await fetchUser(id));    // ❌ does not wait
for (const id of ids) await fetchUser(id);         // ✅
```

**Use `for...of` when you need `break`, or when the body is async.**

---

## 6. Chaining

**Definition:** Because `map` and `filter` return arrays, they can be chained into a readable pipeline.

```js
const result = users
  .filter((u) => u.isActive)          // keep active users
  .map((u) => u.score)                // extract scores
  .reduce((sum, s) => sum + s, 0);    // total them
```

**Order matters for performance** — filter first so later steps process fewer items:

```js
users.map(expensiveTransform).filter((u) => u.isActive);   // ❌ transforms everything
users.filter((u) => u.isActive).map(expensiveTransform);   // ✅ transforms fewer
```

Each chained method creates an **intermediate array**. For very large datasets, a single `reduce` or a `for` loop avoids that — but only optimise when you have measured a problem.

---

## 7. Choosing the right method

```
Do you need a returned value?
├── NO  → forEach (or for...of if you need break/await)
└── YES
    ├── Same length, transformed      → map
    ├── Fewer items, same shape       → filter
    ├── A single value                → reduce
    ├── One matching item             → find
    ├── The index of an item          → findIndex
    ├── A true/false answer           → some / every
    └── Is a value present?           → includes
```

**The related methods worth knowing:**

```js
nums.find((n) => n > 2);        // 3          - first match, or undefined
nums.findIndex((n) => n > 2);   // 2          - index, or -1
nums.some((n) => n > 4);        // true       - does ANY match?
nums.every((n) => n > 0);       // true       - do ALL match?
nums.includes(3);               // true       - simple membership
nums.flat();                    // flatten nested arrays
nums.flatMap((n) => [n, n]);    // map then flatten one level
```

---

## 8. Mutation — which methods are safe

**Definition:** `map`, `filter`, `slice`, `concat` and `reduce` never modify the original array. `push`, `pop`, `splice`, `sort` and `reverse` **do**.

```js
const nums = [3, 1, 2];

nums.sort();                    // ❌ MUTATES nums
[...nums].sort();               // ✅ sorts a copy
nums.toSorted();                // ✅ newer built-in, returns a copy
```

This matters in React — mutating state means the reference does not change, so no re-render.

```js
// ❌ no re-render
items.push(newItem); setItems(items);

// ✅
setItems([...items, newItem]);
setItems(items.filter((i) => i.id !== id));
setItems(items.map((i) => (i.id === id ? { ...i, done: true } : i)));
```

Those last three lines are the add/remove/update pattern used constantly in React.

---

## Key points

- `map` transforms (same length), `filter` selects (fewer), `reduce` accumulates (one value), `forEach` only causes side effects.
- All callbacks receive `(element, index, array)`.
- `map` with `=> { }` returns `undefined` — wrap object literals in `( )`.
- **Always give `reduce` an initial value** — it throws on an empty array otherwise.
- `forEach` cannot `break`, cannot be chained, and **does not await**.
- **Filter before map** so expensive transforms run on fewer items.
- `find` returns the item; `filter` returns an array.
- `map`/`filter` are **non-mutating** — which is exactly why React state updates use them.

**Related:** [HOF.md](HOF.md) · [PureFunctionsAndImmutability.md](PureFunctionsAndImmutability.md) · [Time-complexity-Array-Object.md](../DSA_Questions/Time-complexity-Array-Object.md)
