# Throttling and Debouncing in JavaScript

Both are **performance optimisation techniques** used to control how often a function runs when an event fires very rapidly (typing, scrolling, resizing).

---

## 1. What is Throttling?

**Definition:** Throttling is a technique that makes sure a function runs **at most once in a fixed time period**, no matter how many times the event is triggered during that period. Extra calls in between are simply ignored.

**In simple words:** Imagine a water tap with a limiter. Even if you open it fully, only one glass of water comes out every 1 second.

**Example in life:** A lift door. You can press the button 50 times, but the lift will still respond only once every few seconds.

---

## 2. What is Debouncing?

**Definition:** Debouncing is a technique that **delays** running a function until the event has **stopped firing** for a given amount of time. Every new event cancels the previous timer and starts a fresh one.

**In simple words:** A lift waits for people. Every time a new person enters, the timer restarts. The door closes only when nobody enters for a few seconds.

**Example in life:** A search box — you don't want to hit the API on every letter, only when the user has stopped typing.

---

## 3. The difference (most asked interview point)

| Point | Debouncing | Throttling |
|---|---|---|
| **When it runs** | After the user **stops** (silence period) | At **fixed intervals** while the action continues |
| **Number of calls** | Only 1 call, at the end | 1 call per time interval |
| **Timer behaviour** | Timer **resets** on every event | Timer **ignores** events until the interval passes |
| **Best for** | Search box typing, form validation, auto-save | Scroll, resize, mouse move, button spam clicks |
| **Idea** | "Wait until they finish" | "Slow it down to a steady rate" |

**Visual example — user types 10 letters quickly, delay = 1000 ms:**

```
Debounce → API called 1 time  (after the last letter)
Throttle → API called ~3 times (once every second while typing)
```

---

## 4. Throttle - implementation using a timestamp

**Definition:** We store the time of the last successful call. On every new event we check if enough time has passed. If not, we ignore the call.

```js
function throttle(fn, delay) {
  let lastCall = 0;                    // remembers the last run time (closure)

  return function (...args) {
    const now = Date.now();            // current time in milliseconds

    if (now - lastCall >= delay) {     // has the waiting period finished?
      lastCall = now;                  // yes → note the new time
      fn.apply(this, args);            // and run the real function
    }
    // else → ignore this call completely
  };
}

function handleScroll() {
  console.log("Scroll position:", window.scrollY);
}

window.addEventListener("scroll", throttle(handleScroll, 1000));
// Even if you scroll 100 times in 1 second, it logs only ONCE per second.
```

**Terms used:**
- **`Date.now()`** — gives the current time in milliseconds.
- **`fn.apply(this, args)`** — calls the function with the correct `this` and an array of arguments.
- **Closure** — `lastCall` stays alive between calls because the inner function remembers it.

---

## 5. Throttle - implementation using setTimeout

**Definition:** Instead of comparing timestamps, we use a `waiting` flag. While the flag is `true`, all calls are ignored. A `setTimeout` resets the flag after the delay.

```js
function throttle(fn, delay) {
  let waiting = false;

  return function (...args) {
    if (waiting) return;               // still in cooldown → ignore

    fn.apply(this, args);              // run immediately
    waiting = true;                    // start the cooldown

    setTimeout(() => {
      waiting = false;                 // cooldown finished, allow again
    }, delay);
  };
}
```

---

## 6. Debounce - implementation

**Definition:** We keep a reference to the pending timer. Every new event clears the old timer and sets a new one, so the function only runs when the events stop.

```js
function debounce(fn, delay) {
  let timer;                           // holds the pending timer id

  return function (...args) {
    clearTimeout(timer);               // cancel the previously planned run

    timer = setTimeout(() => {         // schedule a fresh run
      fn.apply(this, args);
    }, delay);
  };
}

const search = debounce((text) => {
  console.log("Searching API for:", text);
}, 500);

// input.addEventListener("input", (e) => search(e.target.value));
// Types "hello" fast → API is called only ONCE, 500ms after the last letter.
```

**Terms used:**
- **`setTimeout(fn, delay)`** — runs `fn` once after `delay` milliseconds and returns a timer id.
- **`clearTimeout(id)`** — cancels a scheduled `setTimeout` before it runs.

---

## 7. Debounce with "immediate" option (leading edge)

**Definition:** Sometimes you want the function to run on the **first** event and then block further calls. This is called a leading-edge debounce.

```js
function debounce(fn, delay, immediate = false) {
  let timer;

  return function (...args) {
    const callNow = immediate && !timer;   // first call and no timer running

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(this, args); // trailing edge
    }, delay);

    if (callNow) fn.apply(this, args);      // leading edge
  };
}
```

**Leading edge** = run at the start. **Trailing edge** = run at the end (default).

---

## 8. Where to use which

**Use Debouncing for:**
- Search suggestions / autocomplete (API call while typing)
- Form validation while typing
- Auto-saving a draft
- Window resize → recalculate layout only once at the end

**Use Throttling for:**
- Scroll events (infinite scroll, sticky header, scroll animations)
- Mouse move / drag events
- Preventing double form submission on rapid clicks
- Rate-limiting API hits

---

## 9. Real React example

```js
import { useCallback, useEffect, useMemo } from "react";

function SearchBox() {
  // useMemo keeps the SAME debounced function between re-renders
  const debouncedSearch = useMemo(
    () => debounce((value) => fetch(`/api/search?q=${value}`), 500),
    []
  );

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

> Important: if you create the debounced function inside the component body without `useMemo`/`useCallback`, a **new** function is created on every render and the debounce never works.

---

## Key points

- Both techniques use **closures** and **timers**.
- Debounce = run **once after** the events stop.
- Throttle = run **regularly during** the events.
- Always `clearTimeout`/`clearInterval` on component unmount to avoid memory leaks.
- Libraries like **Lodash** provide ready-made `_.debounce()` and `_.throttle()`.
