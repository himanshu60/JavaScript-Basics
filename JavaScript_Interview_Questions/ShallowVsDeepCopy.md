# Shallow Copy vs Deep Copy in JavaScript

## 1. First - how JavaScript stores values

**Definition (Primitive types):** `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint` are stored **by value**. When you copy them, a completely new independent copy is made.

```js
let a = 10;
let b = a;   // b gets its OWN copy of 10
b = 20;
console.log(a); // 10  ← original is safe
```

**Definition (Reference types):** Objects, arrays and functions are stored **by reference**. The variable does not hold the data — it holds the **address** of the data in memory.

```js
let obj1 = { name: "Himanshu" };
let obj2 = obj1;          // obj2 gets the same ADDRESS, not a copy
obj2.name = "Rahul";
console.log(obj1.name);   // "Rahul"  ← both point to the same object
```

This is exactly why we need copying techniques.

---

## 2. What is a Shallow Copy?

**Definition:** A shallow copy creates a **new object**, but copies only the **first level** of properties. If a property is itself an object or array, only its **reference** is copied — so the nested data is still **shared** with the original.

**In simple words:** You get a new box, but the items inside the box are still the same items shared with the old box.

```js
const original = {
  name: "Himanshu",                  // primitive → real copy
  address: { city: "Delhi" },        // object → shared reference
};

const shallow = { ...original };

shallow.name = "Rahul";
console.log(original.name);          // "Himanshu"  ← top level is SAFE

shallow.address.city = "Mumbai";
console.log(original.address.city);  // "Mumbai"    ← nested object CHANGED
```

### Ways to make a shallow copy

#### a) Spread operator `{...obj}` / `[...arr]`

**Definition:** The spread operator expands all enumerable own properties of an object (or all items of an array) into a new object/array.

```js
const objCopy = { ...original };
const arrCopy = [...[1, 2, 3]];
```

#### b) `Object.assign(target, source)`

**Definition:** Copies all enumerable own properties from one or more source objects into a target object, and returns the target.

```js
const objCopy = Object.assign({}, original);

// Can also merge multiple objects
const merged = Object.assign({}, defaults, userSettings);
```

#### c) `Array.prototype.slice()`

**Definition:** Returns a **new array** containing a portion of the original. Called with no arguments it copies the whole array. It never changes the original.

```js
const arrCopy = [1, 2, 3].slice();
const part = [1, 2, 3, 4, 5].slice(1, 3); // [2, 3]
```

#### d) `Array.from()`

**Definition:** Creates a new array from an iterable or array-like value.

```js
const arrCopy = Array.from([1, 2, 3]);
```

#### e) `Object.fromEntries(Object.entries(obj))`

**Definition:** `Object.entries()` turns an object into an array of `[key, value]` pairs; `Object.fromEntries()` turns that array back into an object.

```js
const objCopy = Object.fromEntries(Object.entries(original));
```

> **All five of these are SHALLOW.** They do not protect nested objects.

---

## 3. What is a Deep Copy?

**Definition:** A deep copy creates a new object **and** recursively creates new copies of every nested object and array inside it. The result shares **nothing** with the original — changing one never affects the other.

**In simple words:** You get a new box **and** brand-new duplicates of every item inside it.

```js
const original = { name: "Himanshu", address: { city: "Delhi" } };

const deep = structuredClone(original);

deep.address.city = "Mumbai";
console.log(original.address.city); // "Delhi"  ← fully separate
```

### Ways to make a deep copy

#### a) `structuredClone(value)` — modern and best

**Definition:** A built-in browser/Node function that deeply clones a value using the structured clone algorithm. It supports `Date`, `Map`, `Set`, `RegExp`, `ArrayBuffer` and even **circular references**.

```js
const original = { joined: new Date(), tags: new Set(["a", "b"]) };
const deep = structuredClone(original);
console.log(deep.joined instanceof Date); // true ← Date stays a Date
```

**Cannot clone:** functions, DOM nodes, Symbols, class prototypes (it throws a `DataCloneError`).

#### b) `JSON.parse(JSON.stringify(obj))` — old trick

**Definition:** Converts the object into a JSON string and then parses it back into a brand-new object.

```js
const deep = JSON.parse(JSON.stringify(original));
```

**Problems with this method:**

| Problem | Result |
|---|---|
| `undefined` values | Removed completely |
| Functions | Removed completely |
| `Symbol` values | Removed completely |
| `Date` objects | Converted into a plain string |
| `Map`, `Set` | Become empty objects `{}` |
| `NaN`, `Infinity` | Become `null` |
| Circular references | Throws a `TypeError` |

#### c) Manual recursion

**Definition:** Writing your own function that walks through every level of the object and rebuilds it. **Recursion** means a function calling itself until it hits a stopping point (base case).

```js
function deepCopy(value) {
  // Base case: primitives and null are returned as they are
  if (value === null || typeof value !== "object") return value;

  // Handle special objects
  if (value instanceof Date) return new Date(value);
  if (value instanceof Array) return value.map(deepCopy);

  // Plain object → copy each key recursively
  const result = {};
  for (const key in value) {
    if (Object.hasOwn(value, key)) {
      result[key] = deepCopy(value[key]);
    }
  }
  return result;
}
```

#### d) Lodash `_.cloneDeep(obj)`

**Definition:** A well-tested library function that deep clones almost anything, including functions-by-reference, Maps, Sets and circular structures.

```js
import cloneDeep from "lodash/cloneDeep";
const deep = cloneDeep(original);
```

---

## 4. Full comparison table

| Method | Type | Handles nested? | Keeps Date/Map/Set? | Notes |
|---|---|---|---|---|
| `=` | Reference | No copy at all | — | Both names point to the same object |
| `{...obj}` | Shallow | No | — | Fastest, most common |
| `Object.assign({}, obj)` | Shallow | No | — | Can merge multiple objects |
| `arr.slice()` / `[...arr]` | Shallow | No | — | For arrays |
| `JSON.parse(JSON.stringify())` | Deep | Yes | **No** | Loses dates, functions, undefined |
| `structuredClone()` | Deep | Yes | **Yes** | Built-in, best modern option |
| `_.cloneDeep()` | Deep | Yes | **Yes** | Needs the Lodash library |

---

## 5. Where this matters in real projects

**React state** — React compares references to decide if it should re-render. Mutating state directly means the reference does not change, so React sees "nothing changed" and skips the update.

```js
// WRONG - mutation, React will not re-render
const [user, setUser] = useState({ name: "A", address: { city: "Delhi" } });
user.address.city = "Mumbai";
setUser(user);                       // same reference → no re-render

// CORRECT - new references at every changed level
setUser({
  ...user,
  address: { ...user.address, city: "Mumbai" },
});
```

**Redux** — reducers must return new state objects, never modify the old ones.

**API data** — copy before transforming, so the original response stays intact for other parts of the app.

---

## Key points

- Primitives copy by value, objects copy by reference.
- `=` is not a copy at all — it is just a second name for the same object.
- Shallow copy protects only the **top level**.
- Deep copy protects **every level**, but costs more performance.
- Use `structuredClone()` for deep copies in modern code.
