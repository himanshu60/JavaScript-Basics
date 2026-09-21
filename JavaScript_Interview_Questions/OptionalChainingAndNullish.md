# Optional Chaining (?.) and Nullish Coalescing (??)

## 1. What is Optional Chaining (`?.`)?

**Definition:** Optional chaining is an operator that lets you safely read a property deep inside an object. If any value in the chain is `null` or `undefined`, the whole expression stops and returns `undefined` instead of throwing an error.

**In simple words:** It means "if this exists, keep going; if it does not exist, just give me `undefined` and don't crash".

```js
const user = { name: "Himanshu" };   // notice: no "address" property

// OLD WAY - crashes the app
// console.log(user.address.city);
// TypeError: Cannot read properties of undefined (reading 'city')

// OLD DEFENSIVE WAY - works but ugly and repetitive
console.log(user && user.address && user.address.city); // undefined

// NEW WAY - short and safe
console.log(user?.address?.city);    // undefined ← no crash
```

---

## 2. The three forms of optional chaining

### a) `?.` — safe property access

**Definition:** Checks the value on the left. If it is `null` or `undefined`, it returns `undefined` immediately; otherwise it reads the property.

```js
const obj = { a: { b: "value" } };
console.log(obj?.a?.b);        // "value"
console.log(obj?.x?.y);        // undefined
```

### b) `?.[ ]` — safe dynamic / array access

**Definition:** The same safety check, but for bracket notation — used for array indexes or keys stored in a variable.

```js
const data = { items: [10, 20, 30] };
const key = "items";

console.log(data?.[key]?.[0]);     // 10
console.log(data?.users?.[0]);     // undefined ← "users" does not exist
```

### c) `?.()` — safe function call

**Definition:** Calls the function only if it actually exists. If it is `null` or `undefined`, nothing happens and `undefined` is returned.

```js
const obj = { greet: () => "hi" };

console.log(obj.greet?.());      // "hi"
console.log(obj.sayBye?.());     // undefined ← no "is not a function" error

// Very useful for optional callbacks
function Button({ onClick }) {
  return <button onClick={() => onClick?.()}>Click</button>;
}
```

---

## 3. What is Short-Circuiting?

**Definition:** Short-circuiting means that if the check fails, JavaScript **stops evaluating the rest of the expression immediately** and does not run anything after it.

```js
const user = null;

console.log(user?.address.city.pincode);
// undefined — it stops at "user?." and NEVER touches address, city or pincode

// Function arguments are also skipped
let count = 0;
const obj = null;
obj?.method(count++);
console.log(count); // 0 ← count++ never ran
```

---

## 4. What is Nullish Coalescing (`??`)?

**Definition:** The `??` operator returns the value on the right **only if** the value on the left is `null` or `undefined`. For every other value (including `0`, `""` and `false`) it keeps the left value.

**In simple words:** "Use this default only when the value is truly missing."

```js
const count = 0;

console.log(count || 10);  // 10  ← WRONG, 0 is a valid value but it is falsy
console.log(count ?? 10);  // 0   ← CORRECT

const name = "";
console.log(name || "Guest"); // "Guest"  ← empty string wrongly replaced
console.log(name ?? "Guest"); // ""       ← empty string kept
```

---

## 5. `||` vs `??` — the key difference

**Definition of `||` (OR):** Returns the right side if the left side is **falsy** (any of the 8 falsy values).
**Definition of `??`:** Returns the right side only if the left side is **nullish** (`null` or `undefined` only).

| Left value | `left \|\| "default"` | `left ?? "default"` |
|---|---|---|
| `undefined` | "default" | "default" |
| `null` | "default" | "default" |
| `0` | "default" | `0` |
| `""` | "default" | `""` |
| `false` | "default" | `false` |
| `NaN` | "default" | `NaN` |
| `"hello"` | "hello" | "hello" |

**Real bug this prevents:**

```js
const settings = { showAds: false, itemsPerPage: 0, title: "" };

// WRONG - all three defaults wrongly applied
const ads1 = settings.showAds || true;         // true  (user wanted false!)
const items1 = settings.itemsPerPage || 10;    // 10    (user wanted 0!)

// CORRECT
const ads2 = settings.showAds ?? true;         // false
const items2 = settings.itemsPerPage ?? 10;    // 0
```

---

## 6. Combining `?.` and `??` (very common pattern)

```js
function getUserCity(user) {
  return user?.address?.city ?? "City not provided";
}

console.log(getUserCity({ address: { city: "Delhi" } })); // "Delhi"
console.log(getUserCity({ address: {} }));                // "City not provided"
console.log(getUserCity({}));                             // "City not provided"
console.log(getUserCity(null));                           // "City not provided"
console.log(getUserCity(undefined));                      // "City not provided"
```

Real API example:

```js
const productName = response?.data?.product?.name ?? "Unknown product";
const price = response?.data?.product?.price ?? 0;
const tags = response?.data?.product?.tags ?? [];
```

---

## 7. Logical assignment operators

**Definition of `??=` (nullish assignment):** Assigns the right value **only if** the left is `null` or `undefined`.

**Definition of `||=` (OR assignment):** Assigns the right value if the left is **falsy**.

**Definition of `&&=` (AND assignment):** Assigns the right value if the left is **truthy**.

```js
const settings = { theme: null, fontSize: 14, debug: false };

settings.theme ??= "dark";      // theme is null → assigned "dark"
settings.fontSize ??= 20;       // 14 is not nullish → NOT assigned
settings.debug ??= true;        // false is not nullish → NOT assigned

console.log(settings); // { theme: "dark", fontSize: 14, debug: false }

let name = "";
name ||= "Guest";               // "" is falsy → assigned "Guest"

let user = { role: "admin" };
user.role &&= user.role.toUpperCase(); // role is truthy → "ADMIN"
```

---

## 8. Important rules and mistakes

**a) You cannot mix `??` with `||` or `&&` without brackets**

```js
// const x = a || b ?? c;    // SyntaxError
const x = (a || b) ?? c;     // correct - brackets make the order clear
```

**b) `?.` only guards the value on its LEFT**

```js
const obj = { a: null };
// console.log(obj.a?.b.c);  // still crashes at .c because a?.b is undefined
console.log(obj.a?.b?.c);    // safe - guard every level
```

**c) You cannot assign to an optional chain**

```js
// user?.name = "test";      // SyntaxError - invalid assignment target
```

**d) Do not overuse it**

If a value is supposed to always exist, hiding the error with `?.` turns a clear crash into a silent `undefined` that shows up much later as a confusing bug. Use `?.` for data that is genuinely optional (API responses, user input), not to hide programming mistakes.

---

## Key points

- `?.` → safe reading; returns `undefined` instead of crashing.
- Three forms: `?.prop`, `?.[expr]`, `?.()`.
- `?.` short-circuits — everything after it is skipped.
- `??` → default value only for `null`/`undefined`, unlike `||` which also triggers on `0`, `""`, `false`.
- `??=` assigns a default only when the value is nullish.
- Combine them: `data?.deep?.value ?? fallback` is the standard safe-read pattern.
