# JSX in React

## 1. What is JSX?

**Definition:** JSX stands for **JavaScript XML**. It is a syntax extension for JavaScript that lets you write HTML-like markup directly inside your JavaScript code. Browsers cannot understand JSX, so a compiler (Babel or SWC) converts it into normal JavaScript function calls.

**In simple words:** JSX lets you write your UI in a way that looks like HTML, which is far easier to read than building elements with JavaScript by hand.

```jsx
// What you write (JSX)
const element = <h1 className="title">Hello World</h1>;

// What it becomes after compilation
const element = React.createElement("h1", { className: "title" }, "Hello World");

// What React.createElement returns - a plain JavaScript object
{
  type: "h1",
  props: { className: "title", children: "Hello World" },
  key: null,
  ref: null
}
```

That plain object is called a **React Element** — a lightweight description of what should appear on screen.

---

## 2. Why is JSX used?

| Reason | Explanation |
|---|---|
| **Readability** | The markup looks like the final UI, so it is easy to scan |
| **Full JavaScript power** | Loops, conditions and variables work directly inside the markup |
| **Compile-time errors** | Typos and unclosed tags are caught before the app runs |
| **Safety** | JSX automatically escapes values, which prevents XSS attacks |

```jsx
// Without JSX - painful to read
React.createElement("div", { className: "card" },
  React.createElement("h2", null, title),
  React.createElement("p", null, description)
);

// With JSX - clear
<div className="card">
  <h2>{title}</h2>
  <p>{description}</p>
</div>
```

---

## 3. JSX rules (each one explained)

### a) Return a single root element

**Definition:** A component must return **one** parent element, because a JavaScript function can return only one value.

```jsx
// ❌ Wrong - two siblings at the top
return (
  <h1>Title</h1>
  <p>Text</p>
);

// ✅ Wrap in a div
return (
  <div>
    <h1>Title</h1>
    <p>Text</p>
  </div>
);

// ✅ Better - use a Fragment, which adds no extra DOM node
return (
  <>
    <h1>Title</h1>
    <p>Text</p>
  </>
);
```

### b) Close every tag

**Definition:** Unlike HTML, JSX requires all tags to be closed — including self-closing ones like `<img />` and `<br />`.

```jsx
<img src="a.png" alt="a" />     {/* ✅ */}
<br />                          {/* ✅ */}
<input type="text" />           {/* ✅ */}
{/* <img src="a.png">  ❌ error */}
```

### c) Use camelCase for attributes

**Definition:** JSX attributes follow JavaScript DOM property naming, not HTML naming, because reserved words like `class` and `for` cannot be used.

| HTML | JSX |
|---|---|
| `class` | `className` |
| `for` | `htmlFor` |
| `onclick` | `onClick` |
| `tabindex` | `tabIndex` |
| `readonly` | `readOnly` |
| `maxlength` | `maxLength` |
| `stroke-width` | `strokeWidth` |

### d) Use `{ }` for JavaScript expressions

**Definition:** Curly braces let you embed any JavaScript **expression** (something that produces a value) inside JSX. **Statements** like `if` and `for` are not allowed.

```jsx
const name = "Himanshu";
const user = { age: 25 };

<h1>Hello {name}</h1>                       {/* variable */}
<p>Next year: {user.age + 1}</p>            {/* expression */}
<p>{name.toUpperCase()}</p>                 {/* function call */}
<p>{user.age >= 18 ? "Adult" : "Minor"}</p> {/* ternary */}
<div style={{ color: "red", fontSize: 20 }}>Styled</div>  {/* object */}

{/* ❌ Not allowed - if is a statement, not an expression */}
{/* <p>{ if (x) { ... } }</p> */}
```

> **Why double braces in `style`?** The outer `{}` means "JavaScript starts here" and the inner `{}` is the object itself. Style values use camelCase and numbers become pixels.

---

## 4. Conditional rendering inside JSX

**Definition:** Conditional rendering means showing different UI depending on a condition. Since `if` statements do not work inside JSX, you use expressions.

### a) Ternary operator — for if/else

```jsx
<div>{isLoggedIn ? <Dashboard /> : <Login />}</div>
```

### b) `&&` operator — for "show only if"

**Definition:** `a && b` returns `b` only when `a` is truthy, so it renders the element only when the condition passes.

```jsx
{hasError && <p className="error">Something went wrong</p>}
{items.length > 0 && <ItemList items={items} />}
```

**⚠️ The `0` trap:** if the left side is the number `0`, React renders "0" on the screen instead of nothing.

```jsx
{items.length && <List />}        {/* ❌ renders "0" when the array is empty */}
{items.length > 0 && <List />}    {/* ✅ renders nothing */}
{!!items.length && <List />}      {/* ✅ also fine */}
```

### c) `if` before the return — for complex logic

```jsx
function Page({ status }) {
  if (status === "loading") return <Spinner />;
  if (status === "error") return <ErrorMessage />;
  return <Content />;
}
```

### d) Returning `null` — render nothing

```jsx
function Banner({ show }) {
  if (!show) return null;   // valid - React renders nothing
  return <div>Banner</div>;
}
```

---

## 5. Rendering lists

**Definition:** To render an array of items, use `.map()` to transform each item into a JSX element. Each element needs a unique `key`.

```jsx
const users = [
  { id: 1, name: "Himanshu" },
  { id: 2, name: "Rahul" },
];

<ul>
  {users.map((user) => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>
```

---

## 6. What JSX renders and what it ignores

**Definition:** Some values are displayed, and some are silently ignored by React.

```jsx
{"text"}      {/* ✅ renders the text */}
{42}          {/* ✅ renders 42 */}
{[1, 2, 3]}   {/* ✅ renders 123 */}
{<Component/>}{/* ✅ renders the component */}

{true}        {/* ignored - renders nothing */}
{false}       {/* ignored */}
{null}        {/* ignored */}
{undefined}   {/* ignored */}

{{ a: 1 }}    {/* ❌ ERROR - objects are not valid React children */}
```

---

## 7. Comments in JSX

**Definition:** JSX comments must be written inside curly braces using the `{/* */}` form.

```jsx
<div>
  {/* This is a JSX comment */}
  <p>Visible text</p>
</div>
```

---

## 8. Spread attributes

**Definition:** The spread operator can pass all properties of an object as individual props.

```jsx
const props = { id: "btn", className: "primary", disabled: false };

<button {...props}>Click</button>
// same as: <button id="btn" className="primary" disabled={false}>Click</button>

// Common pattern - pass through extra props
function Input({ label, ...rest }) {
  return (
    <>
      <label>{label}</label>
      <input {...rest} />   {/* type, placeholder, onChange etc. all pass through */}
    </>
  );
}
```

---

## 9. JSX and security (XSS protection)

**Definition:** XSS (Cross-Site Scripting) is an attack where malicious HTML/JavaScript is injected into a page. JSX automatically **escapes** all embedded values, converting them into plain text, so injected scripts never run.

```jsx
const userInput = "<img src=x onerror='alert(1)'>";

<div>{userInput}</div>
{/* Renders the text literally - the script does NOT execute. Safe. */}

{/* Only unsafe if you deliberately bypass the protection: */}
<div dangerouslySetInnerHTML={{ __html: userInput }} />
{/* The scary name is intentional - only use it with trusted/sanitised HTML */}
```

---

## 10. Important notes

- **Component names must start with a capital letter.** `<button>` is an HTML tag; `<Button>` is your component. Lowercase names are treated as DOM elements.
- **JSX is optional.** You could write `React.createElement` by hand, but nobody does.
- **`React` import is no longer required** with the new JSX transform (React 17+), which is why modern files do not have `import React from "react"` at the top.

---

## Key points

- JSX is syntax sugar that compiles to `React.createElement()` calls.
- One root element per return — use a Fragment `<>...</>` to avoid extra DOM nodes.
- `{}` holds **expressions** only, never statements like `if` or `for`.
- Attributes use camelCase: `className`, `htmlFor`, `onClick`.
- Conditional rendering uses ternary, `&&`, early returns or `null`.
- JSX escapes values automatically, which protects against XSS.
- Component names must be capitalised.
