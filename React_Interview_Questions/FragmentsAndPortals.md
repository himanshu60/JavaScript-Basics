# Fragments and Portals in React

---

# PART 1 — Fragments

## 1. What is a Fragment?

**Definition:** A Fragment is a special React component that lets you group multiple children together **without adding an extra DOM node** to the page.

**Why it is needed:** a React component must return a single root element, because a JavaScript function can only return one value. Wrapping everything in a `<div>` solves that, but pollutes the HTML with meaningless nesting.

```jsx
// ❌ Error - two siblings at the top level
function List() {
  return (
    <li>Item 1</li>
    <li>Item 2</li>
  );
}

// ⚠️ Works, but adds a useless <div> to the DOM
function List() {
  return (
    <div>
      <li>Item 1</li>
      <li>Item 2</li>
    </div>
  );
}

// ✅ Fragment - grouped, with NO extra DOM node
function List() {
  return (
    <>
      <li>Item 1</li>
      <li>Item 2</li>
    </>
  );
}
```

---

## 2. The two syntaxes

**Definition of the short syntax `<>...</>`:** The common form. It is concise but **cannot accept any props**, including `key`.

**Definition of the long syntax `<React.Fragment>...</React.Fragment>`:** The full form. It is needed whenever you must pass a `key`, such as inside a `.map()`.

```jsx
// Short form - most common
<>
  <Child1 />
  <Child2 />
</>

// Long form - required when you need a key
{items.map((item) => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </React.Fragment>
))}
```

---

## 3. Why the extra div is a real problem

### a) It breaks CSS layouts

**Definition:** CSS Grid and Flexbox only apply to **direct children**. An unnecessary wrapper `div` becomes the child instead, and the layout collapses.

```jsx
// ❌ The div becomes the single grid item, so the 3 columns break
function Grid() {
  return (
    <div className="grid">   {/* display: grid; grid-template-columns: 1fr 1fr 1fr */}
      <Columns />            {/* returns <div><a/><b/><c/></div> */}
    </div>
  );
}

// ✅ With a Fragment, a, b and c become real grid children
function Columns() {
  return (
    <>
      <div>a</div>
      <div>b</div>
      <div>c</div>
    </>
  );
}
```

### b) It breaks invalid HTML structures

```jsx
// ❌ A <div> is not allowed inside <tbody> or <tr>
function Table() {
  return (
    <table>
      <tbody>
        <Rows />     {/* if Rows returns a wrapping div, the HTML is invalid */}
      </tbody>
    </table>
  );
}

// ✅ Fragment keeps the table structure valid
function Rows() {
  return (
    <>
      <tr><td>Row 1</td></tr>
      <tr><td>Row 2</td></tr>
    </>
  );
}
```

### c) It makes the DOM tree deeper

More nodes means more memory and slightly slower rendering and CSS matching. Fragments keep the DOM flat and clean.

---

## 4. Real example — definition lists

```jsx
function Glossary({ items }) {
  return (
    <dl>
      {items.map((item) => (
        <React.Fragment key={item.id}>
          <dt>{item.term}</dt>
          <dd>{item.definition}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
// Produces clean HTML: <dl><dt>..</dt><dd>..</dd><dt>..</dt><dd>..</dd></dl>
```

---

# PART 2 — Portals

## 5. What is a Portal?

**Definition:** A Portal renders a child component into a **different place in the DOM tree**, outside its parent's DOM hierarchy — while keeping it in the same **React tree** for props, context and events.

**In simple words:** The component still belongs to its parent in React, but physically appears somewhere else in the HTML — usually at the end of `<body>`.

```jsx
import { createPortal } from "react-dom";

createPortal(children, domNode);
```

---

## 6. Why Portals are needed

**Definition of the problem:** CSS properties like `overflow: hidden`, `z-index` and `position: relative` on a parent can **clip** or **stack** a child incorrectly. A modal inside such a parent gets cut off or hidden behind other content, and no amount of `z-index` fixes it.

```
Problem: a modal inside a card with overflow: hidden gets clipped

<div class="card" style="overflow: hidden">
  <div class="modal">  ← cut off by the parent
```

**The Portal fix:** render the modal directly into `<body>`, where no parent can clip it.

---

## 7. Modal example

```html
<!-- index.html -->
<body>
  <div id="root"></div>
  <div id="modal-root"></div>   <!-- portal target -->
</body>
```

```jsx
import { createPortal } from "react-dom";

function Modal({ isOpen, onClose, title, children }) {
  // Lock body scrolling while the modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };   // cleanup
  }, [isOpen]);

  // Close on the Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.getElementById("modal-root")     // ← rendered HERE in the DOM
  );
}
```

```jsx
// Used like any normal component
function Page() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Hello">
        <p>Modal content, not clipped by the card.</p>
      </Modal>
    </div>
  );
}
```

---

## 8. Events still bubble through the React tree

**Definition:** This is the most important and most surprising property of Portals. Even though the DOM node is elsewhere, events bubble up through the **React component tree**, not the DOM tree. So a parent's `onClick` still fires for clicks inside the portal.

```jsx
function Parent() {
  return (
    <div onClick={() => console.log("Parent clicked!")}>
      <Modal>
        <button>Click me</button>
        {/* Clicking this button DOES trigger the parent's onClick,
            even though the button lives in #modal-root in the DOM */}
      </Modal>
    </div>
  );
}
```

**Why this is good:** context, event delegation and state all keep working normally. The portal is only a DOM-level relocation.

---

## 9. Other Portal use cases

| Use case | Why a portal helps |
|---|---|
| **Modals / dialogs** | Escape `overflow: hidden` and `z-index` traps |
| **Tooltips** | Must be able to overflow their container |
| **Dropdown menus** | Long lists should not be clipped by the parent |
| **Toast notifications** | Fixed to a screen corner, independent of layout |
| **Context menus** | Positioned anywhere on screen |
| **Loading overlays** | Must cover the whole viewport |

```jsx
// Toast notification portal
function Toast({ message, type }) {
  return createPortal(
    <div className={`toast toast-${type}`}>{message}</div>,
    document.body            // you can portal directly into body
  );
}
```

---

## 10. Creating the portal target dynamically

**Definition:** Instead of adding a `<div>` to `index.html`, you can create and remove the container node from inside the component.

```jsx
function Portal({ children }) {
  const [container] = useState(() => document.createElement("div"));

  useEffect(() => {
    document.body.appendChild(container);
    return () => { document.body.removeChild(container); };  // cleanup
  }, [container]);

  return createPortal(children, container);
}
```

---

## 11. Accessibility reminders for portals

- Add `role="dialog"` and `aria-modal="true"` to modals.
- **Trap focus** inside the modal while it is open.
- **Return focus** to the trigger element when it closes.
- Support closing with the **Escape** key.
- Prevent background scrolling.

> Libraries like **Radix UI**, **Headless UI** and **React Aria** handle all of this correctly — strongly preferred over hand-rolling a modal in production.

---

## Key points

**Fragments**
- Group children **without** adding a DOM node.
- `<>...</>` is short; `<React.Fragment key={...}>` is needed for keys.
- They prevent broken CSS Grid/Flex layouts and invalid HTML like divs inside tables.

**Portals**
- `createPortal(children, domNode)` renders into a different DOM location.
- They escape `overflow: hidden` and `z-index` stacking problems.
- Events still bubble through the **React tree**, so context and handlers keep working.
- Used for modals, tooltips, dropdowns and toasts.
