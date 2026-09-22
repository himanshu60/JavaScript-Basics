# The Virtual DOM

## 1. What is the DOM?

**Definition:** The DOM (Document Object Model) is the browser's tree representation of your HTML. JavaScript changes the page by changing this tree.

**Why direct DOM manipulation is slow:** changing a DOM node can force the browser to recalculate styles, recompute layout (**reflow**) and redraw pixels (**repaint**). Doing this hundreds of times in a loop is expensive.

```js
// ❌ 1000 separate DOM operations, each potentially triggering layout work
for (let i = 0; i < 1000; i++) {
  document.getElementById("list").innerHTML += `<li>${i}</li>`;
}
```

---

## 2. What is the Virtual DOM?

**Definition:** The Virtual DOM is a lightweight **JavaScript object** representation of the real DOM, kept in memory. React makes all changes to this copy first, compares it with the previous version, and then applies only the differences to the real DOM.

**In simple words:** Instead of editing the actual page a hundred times, React sketches the new page on paper, compares it with the old sketch, and only changes the parts that differ.

```jsx
// This JSX...
<div className="card">
  <h1>Hello</h1>
</div>

// ...is just this plain JavaScript object
{
  type: "div",
  props: {
    className: "card",
    children: { type: "h1", props: { children: "Hello" } }
  }
}
```

Creating and comparing plain objects is **cheap**. Touching the real DOM is **expensive**. That is the entire trade.

---

## 3. How an update works

```
1. State changes (setState / setCount)
        ↓
2. React re-runs the component function
        ↓
3. A NEW Virtual DOM tree is produced
        ↓
4. React DIFFS it against the previous tree
        ↓
5. Only the actual differences are applied to the real DOM
```

**Definition of Reconciliation:** Steps 4 and 5 — comparing the two trees and working out the minimum set of real DOM changes.

```jsx
// Before: <h1>Count: 0</h1>
// After:  <h1>Count: 1</h1>
// React updates ONLY the text node - it does not recreate the <h1>
```

---

## 4. The diffing algorithm

**Definition:** A perfect tree-comparison algorithm is O(n³), far too slow. React uses a **heuristic O(n)** algorithm built on two assumptions.

**Assumption 1 — different element types produce different trees.**

```jsx
// Type changed from div to span
<div><Counter /></div>   →   <span><Counter /></span>

// React DESTROYS the entire old subtree and rebuilds it.
// Counter's state is completely lost.
```

**Assumption 2 — `key` identifies which children are stable.**

```
Without keys (compares by position):     With keys (matches by identity):
[A, B] → [X, A, B]                       [A, B] → [X, A, B]
  pos 0: A→X  update                       X is new → insert
  pos 1: B→A  update                       A, B unchanged → reuse
  pos 2: --→B insert
  = 3 operations                           = 1 operation
```

This is exactly why React warns when a list has no `key`.

---

## 5. The practical consequence

**Changing an element type destroys state:**

```jsx
// ❌ The input is unmounted and remounted every time isEditing flips,
//    so whatever the user typed is lost
{isEditing ? <input value={text} /> : <p>{text}</p>}

// ✅ Same element type - state is preserved
<input value={text} readOnly={!isEditing} />
```

**And you can use this deliberately** — changing a `key` forces a fresh component:

```jsx
<UserForm key={userId} />     // switching users resets the form completely
```

---

## 6. Common misconceptions

| Myth | Reality |
|---|---|
| "The Virtual DOM is faster than the real DOM" | It is **not**. It is an extra step. It is faster than *badly batched* manual DOM work. |
| "React only re-renders what changed" | React re-runs the whole component function; the **DOM update** is what gets minimised. |
| "The Virtual DOM makes apps fast" | It makes them *predictably* fast. Hand-optimised vanilla JS can beat it. |
| "Only React has one" | Vue uses one too. Svelte and Solid deliberately do not — they compile to direct updates. |

**The honest value of the Virtual DOM is not raw speed — it is the programming model.** You write "this is what the UI should look like for this state", and React works out the DOM operations. You never write `appendChild` or track which node needs updating.

---

## 7. Virtual DOM vs Real DOM

| | Real DOM | Virtual DOM |
|---|---|---|
| What it is | Browser's actual tree | Plain JS objects in memory |
| Update cost | Expensive (reflow, repaint) | Cheap (object comparison) |
| Direct manipulation | Immediate | Batched, then applied |
| Memory | Heavier nodes | Lightweight |

> **Definition of the Shadow DOM** — often confused with this. The Shadow DOM is a **browser feature** for encapsulating a component's DOM and CSS (used by Web Components). It is unrelated to the Virtual DOM.

---

## Key points

- The Virtual DOM is a **JavaScript object copy** of the UI, cheap to create and compare.
- React diffs the new tree against the old one and applies **only the differences**.
- The diffing algorithm is **O(n)** thanks to two heuristics: type changes rebuild, and `key` identifies children.
- **A changed element type destroys the subtree and its state** — which you can also use deliberately via `key`.
- The Virtual DOM is not inherently faster than the DOM; its real value is the **declarative programming model**.
- The **Shadow DOM** is a different, unrelated browser feature.

**Related:** [Reconciliation-And-Fiber.md](Reconciliation-And-Fiber.md) · [KeysInLists.md](KeysInLists.md) · [PerformanceOptimization.md](PerformanceOptimization.md)
