# Event Delegation in JavaScript

## 1. First - what is an Event?

**Definition:** An event is an action or occurrence that happens in the browser — a click, a key press, a scroll, a page load. JavaScript can "listen" for these and run code in response.

**Definition of an Event Listener:** A function registered with `addEventListener()` that runs whenever a specific event happens on a specific element.

```js
element.addEventListener("click", function (event) {
  console.log("Element clicked");
});
```

---

## 2. What are the Event Propagation phases?

**Definition:** Event propagation is the process of an event travelling through the DOM tree. It happens in **three phases**:

| Phase | Definition |
|---|---|
| **1. Capturing (trickle down)** | The event travels **from the root** (`window` → `document` → `html` → `body`) **down** to the target element. |
| **2. Target** | The event reaches the exact element that was clicked. |
| **3. Bubbling (bubble up)** | The event travels **back up** from the target to all its ancestors, up to `window`. |

By default, listeners run in the **bubbling** phase. Pass `{ capture: true }` to listen during the capturing phase instead.

```js
parent.addEventListener("click", fn);                  // bubbling (default)
parent.addEventListener("click", fn, { capture: true }); // capturing
```

**Event delegation is built on the bubbling phase** — a click on a child also fires on its parents.

---

## 3. What is Event Delegation?

**Definition:** Event delegation is a technique where you attach a **single event listener to a parent element** instead of attaching separate listeners to every child, and then use `event.target` to figure out which child was actually clicked.

**In simple words:** A school has 500 students. Instead of giving a phone to each student, the school gives one phone to the principal. Any message goes to the principal, who then checks which student it was meant for.

---

## 4. The problem it solves

```html
<ul id="list">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

```js
// BAD WAY - one listener per item
document.querySelectorAll("#list li").forEach((li) => {
  li.addEventListener("click", () => console.log(li.textContent));
});
```

**Three problems with this:**
1. **Memory** — 1000 items means 1000 listener functions held in memory.
2. **Dynamic elements** — any `<li>` added later has **no** listener, so clicking it does nothing.
3. **Cleanup** — you must remove each listener when removing elements, or you leak memory.

---

## 5. The solution - event delegation

```js
const list = document.getElementById("list");

list.addEventListener("click", function (event) {
  // event.target = the exact element that was clicked
  if (event.target.tagName === "LI") {
    console.log("Clicked:", event.target.textContent);
  }
});

// Add a new item LATER - it still works, with no extra listener
const newItem = document.createElement("li");
newItem.textContent = "Item 4";
list.appendChild(newItem);
```

---

## 6. `event.target` vs `event.currentTarget`

**Definition of `event.target`:** The element where the event actually originated — the deepest element the user clicked on.

**Definition of `event.currentTarget`:** The element that the listener is attached to — the parent doing the delegation.

```js
list.addEventListener("click", (e) => {
  console.log(e.target);        // the <li> (or even a <span> inside it)
  console.log(e.currentTarget); // always <ul id="list">
});
```

This difference is the whole reason delegation works.

---

## 7. `closest()` — handling nested markup

**Definition:** `element.closest(selector)` walks **up** from the element through its ancestors and returns the first one that matches the CSS selector, or `null` if none matches.

**Why it is needed:** If the `<li>` contains other tags, the click may land on the inner `<span>` or `<b>`, not on the `<li>` itself. Checking `e.target.tagName === "LI"` would then fail.

```html
<ul id="menu">
  <li data-id="1"><span>Edit</span> <b>Profile</b></li>
  <li data-id="2"><span>Delete</span> <b>Account</b></li>
</ul>
```

```js
document.getElementById("menu").addEventListener("click", (e) => {
  const li = e.target.closest("li");   // walk up until we find an <li>
  if (!li) return;                     // clicked outside any <li> → ignore
  console.log("Selected id:", li.dataset.id);
});
```

**Definition of `dataset`:** A property that gives access to all `data-*` attributes of an element. `data-id="5"` is read as `element.dataset.id`.

---

## 8. Handling multiple actions with data attributes

**Definition:** A common professional pattern is to put the action name in a `data-action` attribute and map it to a function, so one listener can handle an entire toolbar.

```html
<div id="toolbar">
  <button data-action="save">Save</button>
  <button data-action="delete">Delete</button>
  <button data-action="share">Share</button>
</div>
```

```js
const actions = {
  save: () => console.log("Saving..."),
  delete: () => console.log("Deleting..."),
  share: () => console.log("Sharing..."),
};

document.getElementById("toolbar").addEventListener("click", (e) => {
  const button = e.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  actions[action]?.();          // optional call - safe if the action is unknown
});
```

---

## 9. Controlling propagation

**Definition of `event.stopPropagation()`:** Stops the event from travelling further up (or down) the DOM tree. Other listeners on ancestor elements will not run.

**Definition of `event.stopImmediatePropagation()`:** Does the same, and also stops any **other listeners on the same element** from running.

**Definition of `event.preventDefault()`:** Cancels the browser's default behaviour (like a link navigating or a form submitting), but does **not** stop propagation.

```js
child.addEventListener("click", (e) => {
  e.stopPropagation();   // the parent's listener will NOT run
});

form.addEventListener("submit", (e) => {
  e.preventDefault();    // stop the page from reloading
  // handle the form with JavaScript instead
});
```

> **Warning:** using `stopPropagation()` inside a child breaks event delegation on its parents. Use it carefully.

---

## 10. Events that do NOT bubble

**Definition:** A few events fire only on the target element and never travel up, so delegation does not work with them.

| Non-bubbling event | Bubbling alternative to use instead |
|---|---|
| `focus` | `focusin` |
| `blur` | `focusout` |
| `mouseenter` | `mouseover` |
| `mouseleave` | `mouseout` |
| `load`, `unload`, `scroll` (on elements) | — (attach directly) |

```js
// This will NOT work
form.addEventListener("focus", handler);      // focus does not bubble

// This WILL work
form.addEventListener("focusin", handler);    // focusin bubbles
```

---

## 11. Benefits of event delegation

| Benefit | Explanation |
|---|---|
| **Less memory** | One listener instead of hundreds or thousands |
| **Works with dynamic elements** | Elements added after page load are handled automatically |
| **Less cleanup** | No listeners to remove when elements are deleted |
| **Cleaner code** | All related handling lives in one place |
| **Better performance** | Faster initial page setup — no loop attaching listeners |

---

## Key points

- Event delegation works because of **event bubbling**.
- Attach the listener to a stable **parent**, not to each child.
- `event.target` = what was clicked; `event.currentTarget` = where the listener sits.
- Use `closest()` instead of `tagName` when children contain nested tags.
- `stopPropagation()` will break delegation — use it only when you really mean it.
- `focus`, `blur`, `mouseenter`, `mouseleave` do not bubble — use `focusin`, `focusout`, `mouseover`, `mouseout`.
