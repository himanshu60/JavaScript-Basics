# Map, Set, WeakMap and WeakSet in JavaScript

These four are **built-in collection types** added in ES6 for storing groups of data.

---

## 1. What is a Map?

**Definition:** A `Map` is a collection of **key–value pairs** where the key can be of **any data type** (object, function, number, string) and the insertion order of the items is always remembered.

**In simple words:** It is like an object, but smarter — you can use anything as a key, and the order never changes.

```js
const map = new Map();

map.set("name", "Himanshu");     // string key
map.set(1, "number key");        // number key
map.set(true, "boolean key");    // boolean key

const objKey = { id: 1 };
map.set(objKey, "object as key"); // object key - impossible with plain objects

console.log(map.get("name"));    // "Himanshu"
console.log(map.get(objKey));    // "object as key"
```

### Map methods (each one defined)

| Method | Definition |
|---|---|
| `map.set(key, value)` | Adds or updates an entry. Returns the map, so calls can be chained. |
| `map.get(key)` | Returns the value for that key, or `undefined` if not found. |
| `map.has(key)` | Returns `true`/`false` telling whether the key exists. |
| `map.delete(key)` | Removes that entry. Returns `true` if something was removed. |
| `map.clear()` | Removes **all** entries. |
| `map.size` | A property (not a method) giving the number of entries. |
| `map.keys()` | Returns an iterator of all keys. |
| `map.values()` | Returns an iterator of all values. |
| `map.entries()` | Returns an iterator of `[key, value]` pairs. |
| `map.forEach(cb)` | Runs a callback for every entry as `(value, key, map)`. |

```js
const scores = new Map();

scores.set("math", 90).set("science", 85).set("english", 78); // chaining

console.log(scores.size);              // 3
console.log(scores.has("math"));       // true
scores.delete("english");
console.log(scores.size);              // 2

// Looping
for (const [subject, mark] of scores) {
  console.log(subject, mark);
}

scores.forEach((value, key) => console.log(key, "=", value));

console.log([...scores.keys()]);       // ["math", "science"]
console.log([...scores.values()]);     // [90, 85]
console.log([...scores.entries()]);    // [["math",90], ["science",85]]
```

### Creating a Map from an array, and converting back

```js
const map = new Map([
  ["a", 1],
  ["b", 2],
]);

const obj = Object.fromEntries(map);   // Map → object: { a: 1, b: 2 }
const backToMap = new Map(Object.entries(obj)); // object → Map
const arr = [...map];                  // Map → array of pairs
```

---

## 2. Map vs Object

| Point | Object | Map |
|---|---|---|
| Key types | Only `string` and `Symbol` | **Any** type (object, function, number) |
| Order | Integer-like keys are sorted first | Insertion order is always kept |
| Size | `Object.keys(obj).length` | `map.size` |
| Iteration | Needs `Object.entries()` first | Directly iterable with `for...of` |
| Performance | Slower for frequent add/delete | Faster for frequent add/delete |
| Default keys | Inherits from `Object.prototype` | Completely clean, no defaults |
| JSON support | Works directly | Must be converted first |

**The "default keys" problem with objects:**

```js
const obj = {};
console.log(obj.toString);  // function! ← inherited, can cause bugs

const map = new Map();
console.log(map.get("toString")); // undefined ← clean
```

**When to use which:** Use an **object** for simple records and anything going to JSON. Use a **Map** when keys are dynamic, non-string, or when you add and delete entries frequently.

---

## 3. What is a Set?

**Definition:** A `Set` is a collection of **unique values**. If you add a value that already exists, it is simply ignored — duplicates are impossible.

**In simple words:** A list that automatically removes duplicates.

```js
const set = new Set([1, 2, 2, 3, 3, 3]);

console.log(set);       // Set(3) { 1, 2, 3 }  ← duplicates removed automatically
console.log(set.size);  // 3
```

### Set methods (each one defined)

| Method | Definition |
|---|---|
| `set.add(value)` | Adds a value if it is not already present. Returns the set (chainable). |
| `set.has(value)` | Returns `true`/`false` telling whether the value exists. |
| `set.delete(value)` | Removes the value. Returns `true` if it was there. |
| `set.clear()` | Removes all values. |
| `set.size` | Number of values stored. |
| `set.values()` / `set.keys()` | Iterator of all values (both are the same for a Set). |
| `set.forEach(cb)` | Runs a callback for each value. |

```js
const tags = new Set();

tags.add("js").add("react").add("js");  // "js" added only once

console.log(tags.size);        // 2
console.log(tags.has("react")); // true
tags.delete("react");

for (const tag of tags) console.log(tag);
```

### Common Set use cases

```js
// 1. Remove duplicates from an array (most common use)
const arr = [1, 1, 2, 3, 3, 4];
const unique = [...new Set(arr)];       // [1, 2, 3, 4]

// 2. Remove duplicate characters from a string
const uniqueChars = [...new Set("hello")].join(""); // "helo"

// 3. Set operations
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

const union = new Set([...a, ...b]);                           // {1,2,3,4}
const intersection = new Set([...a].filter((x) => b.has(x)));  // {2,3}
const difference = new Set([...a].filter((x) => !b.has(x)));   // {1}

// 4. Fast lookup (O(1) instead of array's O(n))
const blocked = new Set(["spam@x.com", "bot@y.com"]);
if (blocked.has(email)) console.log("Blocked!");
```

> **Careful:** `Set` uses the same rule as `===` for uniqueness. Two objects with identical contents are still different references, so both are kept.

```js
const s = new Set();
s.add({ a: 1 });
s.add({ a: 1 });
console.log(s.size); // 2 ← different objects, not duplicates
```

---

## 4. What is a WeakMap?

**Definition:** A `WeakMap` is like a `Map`, but with three restrictions:
1. Keys **must be objects** (not strings or numbers).
2. The keys are held **weakly** — if nothing else in the program uses that object, the garbage collector is free to delete it **and** its WeakMap entry.
3. It is **not iterable** and has no `size` property.

**What is Garbage Collection?** It is the JavaScript engine automatically freeing memory that is no longer reachable by any part of the program.

**In simple words:** A normal `Map` holds its keys tightly and never lets them be cleaned up, which can cause memory leaks. A `WeakMap` holds them loosely so memory can be freed automatically.

```js
const cache = new WeakMap();

let user = { name: "Himanshu" };
cache.set(user, { visits: 10 });

console.log(cache.get(user));  // { visits: 10 }
console.log(cache.has(user));  // true

user = null;   // nothing references the object anymore
// → the object AND its WeakMap entry are removed automatically by the GC
```

**Methods:** only `get()`, `set()`, `has()`, `delete()`. No `size`, no `clear()`, no looping — because the contents can disappear at any time.

**Where it is used:**
- Caching computed data linked to an object.
- Storing private data for class instances.
- Attaching metadata to DOM nodes without preventing their cleanup.

```js
// Private data pattern
const privateData = new WeakMap();

class Person {
  constructor(name, ssn) {
    privateData.set(this, { ssn });   // hidden from outside
    this.name = name;
  }
  getSSN() {
    return privateData.get(this).ssn;
  }
}
```

---

## 5. What is a WeakSet?

**Definition:** A `WeakSet` is like a `Set`, but it can only store **objects**, holds them weakly, and is not iterable.

```js
const visitedNodes = new WeakSet();

let node = { id: 1 };
visitedNodes.add(node);
console.log(visitedNodes.has(node)); // true

node = null; // entry is removed automatically
```

**Methods:** only `add()`, `has()`, `delete()`.

**Where it is used:** marking objects as "already processed" or "already visited" without keeping them alive in memory.

---

## 6. Full comparison table

| Feature | Map | Set | WeakMap | WeakSet |
|---|---|---|---|---|
| Stores | key → value | unique values | object key → value | unique objects |
| Key/value type | any | any | key must be object | must be object |
| Iterable | Yes | Yes | **No** | **No** |
| Has `.size` | Yes | Yes | **No** | **No** |
| Has `.clear()` | Yes | Yes | No | No |
| Garbage collected | No | No | **Yes** | **Yes** |
| Main use | Dynamic key-value data | Unique values, fast lookup | Private data, caches | Marking objects |

---

## Key points

- `Map` = key-value pairs with any key type and guaranteed order.
- `Set` = unique values; `[...new Set(arr)]` is the shortest way to de-duplicate an array.
- `WeakMap`/`WeakSet` = only objects, held weakly, not iterable, safe from memory leaks.
- All four have `O(1)` average lookup, much faster than searching through an array.
