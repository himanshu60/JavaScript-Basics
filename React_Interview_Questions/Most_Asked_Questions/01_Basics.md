# Most Asked React Questions — Part 1: Basics (1–10)

[← Back to the list](README.md) · [Part 2: Hooks →](02_Hooks.md)

---

## 1. What is React and why is it popular?

**Short answer:** React is a JavaScript **library** for building user interfaces. You build the UI from small, reusable pieces called **components**, and React updates the screen for you when the data changes.

**Why it is popular:**

- **Component-based** — build a piece once, reuse it everywhere (Button, Navbar, Card).
- **Declarative** — you describe *what* the UI should look like. React handles *how* to update the DOM.
- **Virtual DOM** — React finds the smallest set of changes and updates only those parts of the page.
- **One-way data flow** — data goes parent → child, so bugs are easier to trace.
- **Huge ecosystem** — Next.js, React Router, Redux, React Native (mobile apps) and more.

**Example:**

```jsx
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}

function App() {
  return (
    <div>
      <Welcome name="Asha" />  {/* same component, different data */}
      <Welcome name="Ravi" />
    </div>
  );
}
```

> 💡 **Tip:** Say "library, not framework". React handles only the UI layer, so you pick your own router, state manager and data-fetching tool.

Deep dive: [ReactBenifits.md](../ReactBenifits.md)

---

## 2. What is JSX?

**Short answer:** JSX lets you write HTML-like code inside JavaScript. It is **not** HTML. A compiler (like Babel) converts it into normal JavaScript function calls.

```jsx
// What you write
const element = <h1 className="title">Hello</h1>;

// What it becomes (roughly)
const element = React.createElement("h1", { className: "title" }, "Hello");
```

Since React 17, the compiler uses `jsx()` from `react/jsx-runtime` instead of `React.createElement`. That is why you no longer need `import React` in every file. The idea is the same.

**JSX rules to remember:**

| Rule | Example |
|---|---|
| Return one parent element | Wrap in `<div>` or `<>...</>` |
| Use `className`, not `class` | `<div className="box">` |
| Use `htmlFor`, not `for` | `<label htmlFor="email">` |
| Attributes are camelCase | `onClick`, `onChange`, `tabIndex` |
| Close every tag | `<img />`, `<br />`, `<input />` |
| JavaScript goes inside `{ }` | `<p>{user.name}</p>`, `<p>{2 + 2}</p>` |

**Example:**

```jsx
function Profile() {
  const user = { name: "Priya", age: 25 };

  return (
    <div className="card">
      <h2>{user.name}</h2>
      <p>Age next year: {user.age + 1}</p>
    </div>
  );
}
```

> 💡 **Tip:** JSX is safe from XSS by default. Values inside `{ }` are escaped, so a string like `"<script>"` is shown as text, not run.

Deep dive: [JSX.md](../JSX.md)

---

## 3. What is the Virtual DOM and how does it work?

**Short answer:** The Virtual DOM is a lightweight JavaScript copy of the real DOM. When state changes, React builds a new virtual tree, compares it with the old one (**diffing**), and updates **only the changed parts** of the real DOM. This whole process is called **reconciliation**.

**Why?** Changing the real DOM is slow (the browser has to recalculate layout and repaint). Comparing JavaScript objects is fast.

**Step by step:**

1. State changes (for example, `setCount(1)`).
2. React calls the component again and creates a new Virtual DOM tree.
3. React compares the new tree with the previous one.
4. It finds the difference — only the text `0` became `1`.
5. It updates only that one text node in the real DOM.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>My Counter</h1>       {/* not touched */}
      <p>Count: {count}</p>      {/* only this text is updated */}
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

**Two diffing rules:**

- If the element **type** changes (`<div>` → `<span>`, or `<Login>` → `<Dashboard>`), React throws away the old part and builds a new one.
- In lists, React uses the **`key`** to match old items with new items (see Q7).

> 💡 **Tip:** Don't say "the Virtual DOM is faster than the DOM". Say: it helps React find the **minimum** number of real DOM updates and apply them together.

Deep dive: [VirtualDOM.md](../VirtualDOM.md) · [Reconciliation-And-Fiber.md](../Reconciliation-And-Fiber.md)

---

## 4. What is the difference between functional and class components?

**Short answer:** A **functional component** is a plain JavaScript function that uses **Hooks** for state and side effects. A **class component** extends `React.Component` and uses `this.state` and lifecycle methods. Functional components are the modern standard.

**Example — the same counter written both ways:**

```jsx
// Functional component
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// Class component
class Counter extends React.Component {
  state = { count: 0 };

  render() {
    return (
      <button onClick={() => this.setState({ count: this.state.count + 1 })}>
        {this.state.count}
      </button>
    );
  }
}
```

| | Functional | Class |
|---|---|---|
| Syntax | Plain function | `class extends React.Component` |
| State | `useState`, `useReducer` | `this.state`, `this.setState` |
| Side effects | `useEffect` | `componentDidMount`, `componentDidUpdate`, `componentWillUnmount` |
| `this` keyword | Not needed | Needed everywhere |
| Code size | Shorter | Longer |
| Reusing logic | Custom hooks | HOCs, render props |

> 💡 **Tip:** Class components still work, but new code uses functional components. The one thing that still needs a class is an **Error Boundary** (Q26).

Deep dive: [ComponentsAndProps.md](../ComponentsAndProps.md)

---

## 5. What is the difference between props and state?

**Short answer:** **Props** are data passed **into** a component by its parent, and they are read-only. **State** is data a component **owns and manages itself**, and it can change. When either one changes, the component re-renders.

Easy way to think about it: props are like **function arguments**, and state is like a **variable the component remembers** between renders.

```jsx
function Parent() {
  const [likes, setLikes] = useState(0); // state — owned by Parent

  return <LikeButton likes={likes} onLike={() => setLikes(likes + 1)} />;
}

function LikeButton({ likes, onLike }) { // props — received from Parent
  return <button onClick={onLike}>👍 {likes}</button>;
}
```

| | Props | State |
|---|---|---|
| Who owns it | The parent | The component itself |
| Can the component change it? | ❌ No (read-only) | ✅ Yes, with its setter |
| Where it comes from | Passed from parent → child | Created inside the component |
| Purpose | Configure a component | Remember data that changes |

> 💡 **Tip:** A child must never change its props. If it needs to change something, the parent passes a function down (like `onLike`). See Q6.

Deep dive: [ComponentsAndProps.md](../ComponentsAndProps.md)

---

## 6. How do you pass data from a child to a parent? (Lifting state up)

**Short answer:** In React, data flows only one way — **parent to child**. To send data **up**, the parent passes a **callback function** as a prop, and the child calls it. When two sibling components need the same data, you move ("lift") the state up to their **closest common parent**.

```jsx
function Parent() {
  const [city, setCity] = useState("");

  return (
    <>
      <CityInput onCityChange={setCity} />  {/* child sends data up */}
      <Weather city={city} />               {/* sibling receives it */}
    </>
  );
}

function CityInput({ onCityChange }) {
  return <input onChange={(e) => onCityChange(e.target.value)} />;
}

function Weather({ city }) {
  return <p>Showing weather for: {city || "nothing yet"}</p>;
}
```

`CityInput` and `Weather` are siblings, so they cannot talk to each other directly. The state lives in `Parent`, which shares it with both.

> 💡 **Tip:** If you lift state very high and pass it down through many levels, you get **prop drilling**. Fix that with Context (Q18).

Deep dive: [propDrilling.md](../propDrilling.md)

---

## 7. Why do we need keys in lists? Why is index a bad key?

**Short answer:** A `key` gives each list item a **stable identity**, so React knows which items were **added, removed or moved**. Without good keys, React may reuse the wrong element, which causes bugs and slower updates.

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>  // ✅ unique, stable id
      ))}
    </ul>
  );
}
```

**Why is index a bad key?** When you delete or reorder items, the indexes shift. The item at index `0` is now a *different* item, but React thinks it is the same one. So things like typed input text or a checked checkbox stay on the **wrong row**.

```jsx
// ❌ Bad when the list can be reordered, filtered, or items can be deleted
{todos.map((todo, index) => <TodoItem key={index} todo={todo} />)}
```

**Example of the bug:** Each row has an input. You type "hello" in the first row, then delete the first row. The second row moves to index `0`, and now *it* shows "hello", because React kept the input for key `0`.

**Rules:**

- Use a unique id from your data (database id, or `crypto.randomUUID()` when the item is created).
- Index is OK **only** if the list never changes (no reorder, filter, add or delete).
- Never use `Math.random()` as a key. It changes on every render, so React re-creates every item.
- Keys only need to be unique among **siblings**, not across the whole app.

> 💡 **Tip:** `key` is not passed as a prop. Inside the child, `props.key` is `undefined`.

Deep dive: [KeysInLists.md](../KeysInLists.md)

---

## 8. What is the difference between controlled and uncontrolled components?

**Short answer:** In a **controlled** component, React state holds the input's value (`value` + `onChange`). In an **uncontrolled** component, the DOM holds the value, and you read it when you need it with a `ref`.

```jsx
// ✅ Controlled — React state is the "single source of truth"
function ControlledForm() {
  const [name, setName] = useState("");

  return (
    <>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <p>You typed: {name}</p>
    </>
  );
}

// Uncontrolled — the DOM keeps the value
function UncontrolledForm() {
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    alert(inputRef.current.value); // read it only when needed
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

| | Controlled | Uncontrolled |
|---|---|---|
| Value is stored in | React state | The DOM |
| Initial value | `value` | `defaultValue` |
| How you read the value | The state variable | `ref.current.value` |
| Re-renders on every key press | Yes | No |
| Live validation / formatting | Easy | Harder |
| Best for | Most forms | Simple forms, file inputs |

> 💡 **Tip:** `<input type="file">` is always uncontrolled. Libraries like **React Hook Form** use uncontrolled inputs for better performance.

Deep dive: [ControlledVsUncontrolled.md](../ControlledVsUncontrolled.md)

---

## 9. What is a Fragment?

**Short answer:** A Fragment lets a component return **multiple elements without adding an extra `<div>`** to the DOM. You write it as `<>...</>` or `<React.Fragment>...</React.Fragment>`.

**The problem it solves:** A component must return one parent element. Wrapping everything in a `<div>` can break your layout or your HTML. For example, a `<div>` between `<tr>` and `<td>` is invalid HTML.

```jsx
function Columns() {
  return (
    <>
      <td>Name</td>
      <td>Age</td>
    </>
  );
}

function Table() {
  return (
    <table>
      <tbody>
        <tr>
          <Columns />  {/* renders two <td> directly — no extra <div> */}
        </tr>
      </tbody>
    </table>
  );
}
```

**Need a `key`?** Use the long form. The short `<>` syntax cannot take a `key`:

```jsx
{items.map((item) => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.meaning}</dd>
  </React.Fragment>
))}
```

> 💡 **Tip:** A Fragment adds nothing to the DOM, so it doesn't break flex/grid layouts or HTML structure.

Deep dive: [FragmentsAndPortals.md](../FragmentsAndPortals.md)

---

## 10. What are the different ways of conditional rendering?

**Short answer:** You use normal JavaScript to decide what to show: **`if/else`**, the **ternary** operator `? :`, logical **`&&`**, or **return `null`** to show nothing.

```jsx
function Dashboard({ isLoggedIn, user, notifications }) {
  // 1. if / else — early return
  if (!user) return <p>Loading...</p>;

  return (
    <div>
      {/* 2. Ternary — choose between two things */}
      {isLoggedIn ? <LogoutButton /> : <LoginButton />}

      {/* 3. && — show something or nothing */}
      {notifications.length > 0 && <Badge count={notifications.length} />}
    </div>
  );
}

// 4. return null — render nothing
function Warning({ show }) {
  if (!show) return null;
  return <div className="warning">Warning!</div>;
}
```

**⚠️ The `0` trap with `&&`** (a favourite interview question):

```jsx
{items.length && <List items={items} />}      // ❌ shows "0" on the screen when the list is empty
{items.length > 0 && <List items={items} />}  // ✅ shows nothing when the list is empty
```

Why? `0 && anything` returns `0`, and React renders the number `0`. (`false`, `null` and `undefined` render nothing, but numbers do.)

> 💡 **Tip:** Use `&&` with a real boolean (`count > 0`, `!!value`). For many conditions, use a `switch` or an object map instead of nested ternaries.

Deep dive: [JSX.md](../JSX.md)

---

[← Back to the list](README.md) · [Part 2: Hooks →](02_Hooks.md)
