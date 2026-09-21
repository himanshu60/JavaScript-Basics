# Destructuring in JavaScript

## 1. What is Destructuring?

**Definition:** Destructuring is a syntax that lets you **unpack values from an array** or **properties from an object** directly into separate variables, in a single short line.

**In simple words:** Instead of taking items out of a bag one by one, you write down the names of what you want, and JavaScript hands them to you all at once.

```js
// WITHOUT destructuring - long
const user = { name: "Himanshu", age: 25 };
const name = user.name;
const age = user.age;

// WITH destructuring - short
const { name, age } = user;
```

There are two types: **Array destructuring** (works by position) and **Object destructuring** (works by key name).

---

## 2. Array Destructuring

**Definition:** Array destructuring assigns values based on their **position/index** in the array. The variable names can be anything — only the order matters.

```js
const numbers = [1, 2, 3, 4, 5];

const [first, second] = numbers;
console.log(first, second); // 1 2
```

### a) Skipping items

**Definition:** Leave an empty slot (just a comma) to ignore a position you do not need.

```js
const [, , third] = numbers;
console.log(third); // 3
```

### b) Rest element (`...rest`)

**Definition:** The rest element collects all the **remaining** items into a new array. It must always be the **last** element.

```js
const [a, ...rest] = numbers;
console.log(a);    // 1
console.log(rest); // [2, 3, 4, 5]
```

### c) Default values

**Definition:** A default value is used **only when the extracted value is `undefined`** — not when it is `null`, `0` or `""`.

```js
const [x = 10, y = 20, z = 30] = [1, 2];
console.log(x, y, z); // 1 2 30   ← z was missing, so the default is used

const [p = 5] = [null];
console.log(p); // null  ← null is NOT undefined, so no default
```

### d) Swapping variables

**Definition:** Destructuring lets you swap two variables without a temporary third variable.

```js
let a1 = 1, b1 = 2;
[a1, b1] = [b1, a1];
console.log(a1, b1); // 2 1
```

### e) Nested array destructuring

```js
const nested = [1, [2, 3]];
const [one, [two, three]] = nested;
console.log(one, two, three); // 1 2 3
```

---

## 3. Object Destructuring

**Definition:** Object destructuring assigns values based on the **property name**. The variable name must match the key (unless you rename it).

```js
const user = { name: "Himanshu", age: 25, city: "Delhi" };

const { name, age } = user;
console.log(name, age); // "Himanshu" 25
```

### a) Renaming a variable

**Definition:** Use `key: newName` to store the value in a variable with a different name. Useful when the key name clashes with an existing variable.

```js
const { name: userName, city: userCity } = user;
console.log(userName, userCity); // "Himanshu" "Delhi"
// console.log(name);            // ReferenceError - "name" was never created
```

### b) Default values

```js
const { country = "India" } = user;
console.log(country); // "India" ← key does not exist, default used
```

### c) Renaming + default together

```js
const { salary: pay = 0 } = user;
console.log(pay); // 0
```

### d) Rest properties

**Definition:** Collects all the **remaining** properties into a new object. Very useful for removing a key immutably.

```js
const { name: n, ...others } = user;
console.log(others); // { age: 25, city: "Delhi" }

// Removing a property without mutating the original
const { password, ...safeUser } = userWithPassword;
```

### e) Nested object destructuring

```js
const person = {
  name: "Himanshu",
  address: { city: "Delhi", pin: 110001 },
  hobbies: ["coding", "music"],
};

const {
  address: { city, pin },       // go one level deeper
  hobbies: [firstHobby],        // mix object and array destructuring
} = person;

console.log(city, pin, firstHobby); // "Delhi" 110001 "coding"
```

> **Careful:** `address: { city }` does **not** create a variable called `address`. It only digs into it.

### f) Destructuring an existing variable (needs brackets)

**Definition:** When assigning to already-declared variables, wrap the statement in `()` so JavaScript does not read `{` as the start of a block.

```js
let title, price;
({ title, price } = { title: "Book", price: 200 });  // brackets required
```

---

## 4. Destructuring in function parameters

**Definition:** You can destructure directly inside the function's parameter list, so the function receives named values instead of a whole object.

```js
// Object parameter
function printUser({ name, age = 18 }) {
  console.log(`${name} is ${age}`);
}
printUser({ name: "Himanshu", age: 25 });  // "Himanshu is 25"
printUser({ name: "Rahul" });              // "Rahul is 18"
```

### Safe default when nothing is passed

**Definition:** Destructuring `undefined` throws an error. Adding `= {}` gives an empty object to destructure, which prevents the crash.

```js
function config({ theme = "light", lang = "en" } = {}) {
  console.log(theme, lang);
}

config();                    // "light" "en"  ← works because of "= {}"
config({ theme: "dark" });   // "dark" "en"

// Without "= {}", calling config() would throw:
// TypeError: Cannot destructure property 'theme' of 'undefined'
```

### Array parameter

```js
function sum([a, b]) {
  return a + b;
}
console.log(sum([3, 4])); // 7
```

---

## 5. Real-world usage

```js
// 1. React props
function Card({ title, description, onClick }) {
  return <div onClick={onClick}>{title}</div>;
}

// 2. React hooks (array destructuring)
const [count, setCount] = useState(0);
const [user, setUser] = useState(null);

// 3. API response (with renaming)
const { data: users, status } = await axios.get("/api/users");

// 4. Node.js imports
const { readFile, writeFile } = require("fs/promises");
import { useState, useEffect } from "react";

// 5. Looping over an object
for (const [key, value] of Object.entries(user)) {
  console.log(key, value);
}

// 6. Looping over an array of objects
const users = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
users.forEach(({ id, name }) => console.log(id, name));

// 7. Returning multiple values from a function
function getStats(arr) {
  return { min: Math.min(...arr), max: Math.max(...arr) };
}
const { min, max } = getStats([3, 1, 5]);

// 8. Express route handler
app.post("/login", (req, res) => {
  const { email, password } = req.body;
});
```

---

## 6. Common mistakes

```js
// 1. Destructuring null or undefined → crash
const { a } = null;          // TypeError
const { a } = obj || {};     // safe version

// 2. Defaults do not apply to null
const { x = 5 } = { x: null };
console.log(x);              // null, not 5

// 3. Array destructuring goes by POSITION, not name
const [age, name] = ["Himanshu", 25];
console.log(age);            // "Himanshu" ← wrong order, no error given

// 4. Forgetting brackets when assigning to existing variables
let y;
// { y } = { y: 1 };         // SyntaxError
({ y } = { y: 1 });          // correct
```

---

## Key points

- Array destructuring works by **position**; object destructuring works by **key name**.
- Defaults apply only for `undefined`, never for `null`, `0` or `""`.
- `...rest` must be the last element and collects whatever is left.
- Use `= {}` on destructured parameters so the function is safe when called with nothing.
- It makes React props, hooks, API responses and imports much cleaner to read.
