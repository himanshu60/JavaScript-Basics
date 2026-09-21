# Generators and Iterators in JavaScript

## 1. What is an Iterable?

**Definition:** An iterable is any object that has a method named `[Symbol.iterator]`. Having this method is what allows a value to be used with `for...of`, the spread operator `...`, and destructuring.

**Built-in iterables:** `Array`, `String`, `Map`, `Set`, `NodeList`, `arguments`.
**Not iterable:** plain objects `{}`.

```js
// These work because they are iterable
for (const ch of "hi") console.log(ch);     // h, i
console.log([..."hello"]);                  // ["h","e","l","l","o"]
const [a, b] = new Set([1, 2]);             // destructuring works

// This FAILS - plain objects are not iterable
// for (const x of { a: 1 }) {}             // TypeError: not iterable
```

---

## 2. What is an Iterator?

**Definition:** An iterator is an object that has a `next()` method. Every time you call `next()`, it returns an object with two properties:
- **`value`** — the next item
- **`done`** — `false` if there are more items, `true` when finished

**In simple words:** An iterator is like a TV remote's "next channel" button. Press it and you get the next item, until there are none left.

```js
const arr = [10, 20, 30];
const it = arr[Symbol.iterator]();   // get the iterator from the iterable

console.log(it.next()); // { value: 10, done: false }
console.log(it.next()); // { value: 20, done: false }
console.log(it.next()); // { value: 30, done: false }
console.log(it.next()); // { value: undefined, done: true }  ← finished
```

**The relationship:** Iterable → gives you an → Iterator → which gives you → values one at a time.

---

## 3. Writing an iterator by hand

**Definition:** You can make any object iterable by adding a `[Symbol.iterator]` method that returns an object with a `next()` method.

```js
const range = {
  from: 1,
  to: 5,

  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;

    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  },
};

console.log([...range]);                  // [1, 2, 3, 4, 5]
for (const n of range) console.log(n);    // 1 2 3 4 5
```

This is a lot of code — generators make it much shorter (see below).

---

## 4. What is a Generator Function?

**Definition:** A generator is a special function, written as `function*`, that can **pause** its execution in the middle and **resume** later from exactly the same place. It is declared with `function*` and paused with the `yield` keyword.

**In simple words:** A normal function is like a movie — once you press play it runs to the end. A generator is like a movie you can pause, walk away, and continue later from the same frame.

**Normal function vs Generator:**

| Point | Normal function | Generator function |
|---|---|---|
| Syntax | `function f(){}` | `function* f(){}` |
| Can pause | No | Yes, at every `yield` |
| Returns | A value, once | A generator object (an iterator) |
| Runs when called | Immediately, fully | Not at all — waits for `next()` |

---

## 5. The `yield` keyword

**Definition:** `yield` pauses the generator and sends a value out to whoever called `next()`. When `next()` is called again, the function continues from the line right after that `yield`.

```js
function* numberGenerator() {
  console.log("start running");
  yield 1;                          // PAUSE here, send out 1
  console.log("after first yield");
  yield 2;                          // PAUSE here, send out 2
  yield 3;
  return "done";                    // sets done: true
}

const gen = numberGenerator();      // nothing has run yet!

console.log(gen.next()); // logs "start running"       → { value: 1, done: false }
console.log(gen.next()); // logs "after first yield"   → { value: 2, done: false }
console.log(gen.next()); //                            → { value: 3, done: false }
console.log(gen.next()); //                            → { value: "done", done: true }
console.log(gen.next()); //                            → { value: undefined, done: true }
```

---

## 6. Generator object methods

**Definition of `next(value)`:** Resumes the generator until the next `yield`. Any value you pass becomes the result of the `yield` expression that was paused.

**Definition of `return(value)`:** Stops the generator immediately and marks it as done.

**Definition of `throw(error)`:** Throws an error inside the generator at the paused point, so it can be caught by a `try/catch` inside the generator.

```js
function* gen() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } catch (e) {
    console.log("Caught inside generator:", e.message);
  }
}

const g1 = gen();
console.log(g1.next());        // { value: 1, done: false }
console.log(g1.return("stop")); // { value: "stop", done: true } ← ended early
console.log(g1.next());        // { value: undefined, done: true }

const g2 = gen();
g2.next();
g2.throw(new Error("Something broke")); // "Caught inside generator: Something broke"
```

---

## 7. Generators are automatically iterable

**Definition:** Every generator object is both an iterator (has `next()`) **and** an iterable (has `[Symbol.iterator]`), so it works directly with `for...of` and spread.

```js
function* colors() {
  yield "red";
  yield "green";
  yield "blue";
}

for (const c of colors()) console.log(c);  // red green blue
console.log([...colors()]);                // ["red", "green", "blue"]
const [first] = colors();                  // "red"
```

### Making a custom object iterable with a generator (short version)

```js
const range = {
  from: 1,
  to: 5,
  *[Symbol.iterator]() {               // generator method - much shorter
    for (let i = this.from; i <= this.to; i++) yield i;
  },
};

console.log([...range]); // [1, 2, 3, 4, 5]
```

---

## 8. Passing a value INTO a generator

**Definition:** `yield` is a two-way street. It sends a value out, and the value you pass to the next `next(value)` call comes back in as the result of that `yield`.

```js
function* chat() {
  const name = yield "What is your name?";   // waits for input
  const age = yield `Hello ${name}! How old are you?`;
  return `${name} is ${age} years old`;
}

const c = chat();
console.log(c.next().value);            // "What is your name?"
console.log(c.next("Himanshu").value);  // "Hello Himanshu! How old are you?"
console.log(c.next(25).value);          // "Himanshu is 25 years old"
```

---

## 9. `yield*` — delegating to another generator

**Definition:** `yield*` hands control over to another generator (or any iterable) and yields all of its values one by one.

```js
function* inner() {
  yield "a";
  yield "b";
}

function* outer() {
  yield 1;
  yield* inner();      // yields "a", then "b"
  yield* [7, 8];       // works with any iterable
  yield 2;
}

console.log([...outer()]); // [1, "a", "b", 7, 8, 2]
```

---

## 10. Infinite sequences (lazy evaluation)

**Definition:** Lazy evaluation means values are produced only when they are asked for. This lets a generator represent an infinite series without running out of memory.

```js
function* idGenerator() {
  let id = 1;
  while (true) {         // infinite loop is safe here - it pauses at yield
    yield id++;
  }
}

const ids = idGenerator();
console.log(ids.next().value); // 1
console.log(ids.next().value); // 2
console.log(ids.next().value); // 3
// Never write [...idGenerator()] - that would run forever!

// Fibonacci series
function* fibonacci() {
  let [prev, curr] = [0, 1];
  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

const fib = fibonacci();
const firstTen = Array.from({ length: 10 }, () => fib.next().value);
console.log(firstTen); // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```

---

## 11. Async Generators and `for await...of`

**Definition (async generator):** An `async function*` is a generator that can also use `await` inside it. Its `next()` returns a **Promise**.

**Definition (`for await...of`):** A loop that waits for each promise from an async iterable before moving to the next item.

```js
async function* fetchPages(urls) {
  for (const url of urls) {
    const res = await fetch(url);      // wait for the network
    yield await res.json();            // then hand out the result
  }
}

async function run() {
  const urls = ["/api/page1", "/api/page2", "/api/page3"];
  for await (const page of fetchPages(urls)) {
    console.log("Got page:", page);    // handled one at a time, as they arrive
  }
}
```

---

## 12. Where generators are used in real projects

- **Lazy / infinite data** — produce values only when needed, saving memory.
- **Custom iterators** — make your own data structures work with `for...of`.
- **Redux-Saga** — a popular library that manages side effects using generators.
- **Pagination / streaming** — pull one page or chunk of data at a time.
- **Unique ID generation** — a simple counter that never repeats.

---

## Key points

- **Iterable** = has `[Symbol.iterator]`. **Iterator** = has `next()`.
- `next()` always returns `{ value, done }`.
- A generator is written `function*` and paused with `yield`.
- Calling a generator does **not** run it — it returns a generator object.
- Generators are both iterators and iterables.
- `yield*` delegates to another generator or iterable.
- Async generators + `for await...of` handle streams of promises.
