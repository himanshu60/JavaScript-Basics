# == vs === and Type Coercion in JavaScript

## 1. What is Type Coercion?

**Definition:** Type coercion is JavaScript automatically converting a value from one data type into another (for example a string into a number) so that an operation can be performed.

**In simple words:** JavaScript tries to be "helpful". If you compare or add two different types, it silently converts one of them instead of throwing an error.

There are two kinds:

### a) Implicit coercion (automatic)

**Definition:** JavaScript converts the type on its own, without you asking.

```js
console.log("5" + 3);       // "53"   → 3 is converted to "3", then joined
console.log("5" - 3);       // 2      → "5" is converted to 5
console.log("5" * "2");     // 10     → both become numbers
console.log(1 + true);      // 2      → true becomes 1
console.log(1 + null);      // 1      → null becomes 0
console.log(1 + undefined); // NaN    → undefined becomes NaN
console.log([] + {});       // "[object Object]"
```

**Rule to remember:** The `+` operator means **concatenation** if any side is a string. All other maths operators (`-`, `*`, `/`, `%`) always force **numbers**.

### b) Explicit coercion (you do it on purpose)

**Definition:** You convert the type yourself using a built-in function. This is the clean, readable way.

```js
Number("42");        // 42        ← string to number
Number("abc");       // NaN
parseInt("42px");    // 42        ← reads the number until a non-digit
parseFloat("3.14m"); // 3.14
String(42);          // "42"      ← number to string
(42).toString();     // "42"
Boolean("");         // false     ← value to boolean
+"42";               // 42        ← unary plus, shortcut for Number()
!!"hello";           // true      ← double NOT, shortcut for Boolean()
```

---

## 2. What is `==` (Loose Equality)?

**Definition:** The `==` operator compares two values **after converting them to the same type**. It is called "loose" or "abstract" equality because it ignores the type difference.

```js
console.log(5 == "5");          // true  → "5" is converted to 5
console.log(0 == false);        // true  → false is converted to 0
console.log("" == 0);           // true  → "" is converted to 0
console.log(null == undefined); // true  → special rule
console.log([] == 0);           // true  → [] becomes "" then 0
console.log([1] == 1);          // true  → [1] becomes "1" then 1
```

---

## 3. What is `===` (Strict Equality)?

**Definition:** The `===` operator compares both the **value and the type**. No conversion is done. If the types are different, the result is immediately `false`.

```js
console.log(5 === "5");          // false → number vs string
console.log(0 === false);        // false → number vs boolean
console.log(null === undefined); // false → different types
console.log(5 === 5);            // true
```

---

## 4. `==` vs `===` comparison table

| Comparison | `==` (loose) | `===` (strict) |
|---|---|---|
| `5 == "5"` | `true` | `false` |
| `0 == false` | `true` | `false` |
| `"" == false` | `true` | `false` |
| `null == undefined` | `true` | `false` |
| `NaN == NaN` | `false` | `false` |
| `[] == false` | `true` | `false` |
| `{} == {}` | `false` | `false` (different references) |

> **Rule:** Always use `===` in real code. The only accepted use of `==` is `value == null`, which checks for **both** `null` and `undefined` in one go.

---

## 5. What is `Object.is()`?

**Definition:** `Object.is(a, b)` works almost like `===`, but fixes two special cases: it treats `NaN` as equal to `NaN`, and it treats `+0` and `-0` as different.

```js
console.log(NaN === NaN);          // false
console.log(Object.is(NaN, NaN));  // true

console.log(+0 === -0);            // true
console.log(Object.is(+0, -0));    // false
```

---

## 6. Truthy and Falsy values

**Definition (Falsy):** A falsy value is a value that becomes `false` when JavaScript converts it to a boolean — for example inside an `if` condition. There are exactly **8** falsy values.

```js
false
0
-0
0n          // BigInt zero
""          // empty string
null
undefined
NaN
```

**Definition (Truthy):** Every other value is truthy — including some that surprise people.

```js
"0"          // truthy → non-empty string
"false"      // truthy → non-empty string
[]           // truthy → empty array is still an object
{}           // truthy → empty object
function(){} // truthy
Infinity     // truthy
-1           // truthy (only 0 is falsy)
```

**The classic confusion:**

```js
if ([]) console.log("empty array is TRUTHY");  // this prints
console.log([] == false);                      // but this is true!
```

Why? In an `if`, `[]` is converted with `Boolean([])` → `true`. But with `==`, `[]` is first converted to a primitive `""`, then to `0`, and `false` also becomes `0`, so `0 == 0` is `true`. This is exactly why `==` should be avoided.

---

## 7. How to check things safely

```js
// Check for null OR undefined
if (value == null) { }                 // the one accepted use of ==
if (value === null || value === undefined) { }  // explicit version

// Check for NaN
Number.isNaN(value);   // correct
isNaN("abc");          // true - WRONG, it coerces first

// Check for an array
Array.isArray(value);  // correct
typeof [] === "object" // true - not useful

// Check for an integer
Number.isInteger(value);

// Check if a value actually exists (not just truthy)
if (value !== undefined) { }

// Safe default (keeps 0 and "")
const port = config.port ?? 3000;      // ?? only falls back on null/undefined
const port2 = config.port || 3000;     // WRONG if port is 0
```

---

## 8. The `typeof` operator

**Definition:** `typeof` returns a string describing the type of a value.

```js
typeof 42            // "number"
typeof "hi"          // "string"
typeof true          // "boolean"
typeof undefined     // "undefined"
typeof Symbol()      // "symbol"
typeof 10n           // "bigint"
typeof {}            // "object"
typeof []            // "object"   ← arrays are objects
typeof null          // "object"   ← famous old JavaScript bug
typeof function(){}  // "function"
```

---

## Key points

- Coercion = automatic type conversion; it is the reason `==` behaves strangely.
- `==` converts, `===` does not. Use `===`.
- Only 8 values are falsy — memorise them.
- `NaN` is never equal to itself; use `Number.isNaN()` or `Object.is()`.
- Convert types explicitly with `Number()`, `String()`, `Boolean()` so your intent is clear.
