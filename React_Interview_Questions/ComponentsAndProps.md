# Components and Props in React

## 1. What is a Component?

**Definition:** A component is a **reusable, independent piece of UI**. It is a JavaScript function (or class) that accepts input data and returns React elements describing what should appear on the screen.

**In simple words:** Components are like LEGO blocks. You build small pieces (Button, Card, Navbar) and combine them to build a whole page.

```jsx
function Welcome() {
  return <h1>Hello World</h1>;
}

// Use it like an HTML tag
<Welcome />
```

**Rule:** a component name **must start with a capital letter**. React treats lowercase names as plain HTML tags.

---

## 2. Types of components

### a) Functional Component (modern standard)

**Definition:** A plain JavaScript function that returns JSX. With Hooks, it can use state and lifecycle features, so it can do everything a class component can.

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Arrow function version
const Greeting = ({ name }) => <h1>Hello, {name}!</h1>;
```

### b) Class Component (older style)

**Definition:** An ES6 class that extends `React.Component` and must have a `render()` method returning JSX. State is held in `this.state` and lifecycle methods are used for side effects.

```jsx
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
```

### Functional vs Class comparison

| Point | Functional | Class |
|---|---|---|
| Syntax | Simple function | ES6 class with `render()` |
| State | `useState` hook | `this.state` + `setState` |
| Side effects | `useEffect` hook | Lifecycle methods |
| `this` keyword | Not needed | Required, and often confusing |
| Code length | Shorter | More boilerplate |
| Recommended | **Yes** | Legacy code only |

---

## 3. What are Props?

**Definition:** Props (short for "properties") are the **inputs** passed from a parent component to a child component. They let you configure and reuse a component with different data.

**In simple words:** Props are like arguments to a function, or like attributes on an HTML tag.

```jsx
// Parent passes props
function App() {
  return (
    <div>
      <UserCard name="Himanshu" age={25} isAdmin={true} />
      <UserCard name="Rahul" age={30} isAdmin={false} />
    </div>
  );
}

// Child receives props
function UserCard(props) {
  return (
    <div>
      <h2>{props.name}</h2>
      <p>Age: {props.age}</p>
      {props.isAdmin && <span>Admin</span>}
    </div>
  );
}
```

**Passing different types:**

```jsx
<Component
  text="hello"                  // string - quotes
  number={42}                   // number - braces
  bool={true}                   // boolean (or just: bool)
  array={[1, 2, 3]}             // array
  object={{ id: 1 }}            // object
  fn={() => console.log("hi")}  // function
  element={<Icon />}            // JSX element
/>
```

---

## 4. Props are read-only (immutable)

**Definition:** A component must **never modify its own props**. Props flow downward from the parent, and only the parent can change them. React calls this rule "components must act like pure functions with respect to their props".

```jsx
function Bad({ count }) {
  count = count + 1;   // ❌ never do this
  return <p>{count}</p>;
}

function Good({ count }) {
  const nextCount = count + 1;   // ✅ use a local variable instead
  return <p>{nextCount}</p>;
}
```

---

## 5. What is One-Way Data Flow?

**Definition:** In React, data flows in **one direction only** — from parent to child through props. A child can never directly change data owned by a parent. This makes the app predictable and easy to debug.

**How a child updates the parent:** the parent passes down a **function**, and the child calls it.

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <Child onIncrement={() => setCount(count + 1)} />
    </div>
  );
}

function Child({ onIncrement }) {
  return <button onClick={onIncrement}>Add</button>;
  // The child cannot touch "count" - it just asks the parent to update it
}
```

---

## 6. Destructuring props (recommended)

**Definition:** Instead of writing `props.x` everywhere, you can destructure the props object directly in the parameter list.

```jsx
// Without destructuring
function Card(props) {
  return <h2>{props.title}</h2>;
}

// With destructuring - cleaner
function Card({ title, description }) {
  return (
    <>
      <h2>{title}</h2>
      <p>{description}</p>
    </>
  );
}

// With default values
function Button({ text = "Click me", type = "button", disabled = false }) {
  return <button type={type} disabled={disabled}>{text}</button>;
}
```

---

## 7. What is `props.children`?

**Definition:** `children` is a special prop that contains whatever you put **between** a component's opening and closing tags. It is what makes wrapper components possible.

```jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage - everything inside becomes "children"
<Card title="My Card">
  <p>This paragraph is the children</p>
  <button>So is this button</button>
</Card>
```

**Real use — a Layout component:**

```jsx
function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

<Layout>
  <HomePage />
</Layout>
```

---

## 8. Passing the rest of the props

**Definition:** Rest destructuring collects all the props you did not name, so you can forward them to an inner element.

```jsx
function Input({ label, error, ...rest }) {
  return (
    <div>
      <label>{label}</label>
      <input {...rest} />   {/* type, placeholder, onChange, value all pass through */}
      {error && <span className="error">{error}</span>}
    </div>
  );
}

<Input label="Email" type="email" placeholder="Enter email" onChange={handleChange} />
```

---

## 9. Component composition

**Definition:** Composition means building complex UI by **combining smaller components**, rather than by inheritance. React strongly prefers composition over inheritance.

```jsx
function App() {
  return (
    <Layout>
      <Header>
        <Logo />
        <Navigation />
      </Header>
      <Sidebar>
        <Menu items={menuItems} />
      </Sidebar>
      <Content>
        <ArticleList articles={articles} />
      </Content>
    </Layout>
  );
}
```

**Passing components as props (slots):**

```jsx
function SplitPane({ left, right }) {
  return (
    <div className="split">
      <div className="left">{left}</div>
      <div className="right">{right}</div>
    </div>
  );
}

<SplitPane left={<FileTree />} right={<Editor />} />
```

---

## 10. Props validation

**Definition:** Prop validation checks that a component receives the correct type of data. It is done with **PropTypes** (a runtime check) or **TypeScript** (a compile-time check).

```jsx
// Option 1 - PropTypes (runtime warnings in the console)
import PropTypes from "prop-types";

function UserCard({ name, age, tags }) { /* ... */ }

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  tags: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func,
};

UserCard.defaultProps = { age: 18 };
```

```tsx
// Option 2 - TypeScript (errors before the app even runs) - preferred today
type UserCardProps = {
  name: string;
  age?: number;
  tags: string[];
  onSelect: (id: number) => void;
};

function UserCard({ name, age = 18, tags, onSelect }: UserCardProps) { /* ... */ }
```

---

## 11. Props vs State (quick difference)

| Point | Props | State |
|---|---|---|
| Who owns it | The **parent** | The component **itself** |
| Can it be changed | **No** — read-only | Yes, with the setter function |
| Purpose | Pass data **down** | Track data that **changes over time** |
| Causes re-render | Yes, when the parent re-renders | Yes, when updated |

---

## Key points

- A component is a reusable function returning JSX; the name must be capitalised.
- Functional components + Hooks are the modern standard.
- Props are read-only inputs that flow **parent → child** only.
- A child updates a parent by calling a **callback function** passed as a prop.
- `children` holds whatever is written between the tags.
- Prefer **composition** over inheritance.
- Validate props with TypeScript (or PropTypes in JavaScript projects).
