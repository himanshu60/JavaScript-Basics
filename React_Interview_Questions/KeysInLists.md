# Keys in React Lists

## 1. What is a Key?

**Definition:** A `key` is a special string attribute you must add when rendering a list of elements. It gives each element a **stable identity**, so React can tell which items were added, changed, removed or reordered between renders.

**In simple words:** A key is like a roll number for each item. Even if students change seats, the roll number tells you exactly who is who.

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

Without keys React logs: `Warning: Each child in a list should have a unique "key" prop.`

---

## 2. Why does React need keys?

**Definition:** React uses a **reconciliation** process — it compares the new element tree with the previous one to work out the minimum number of DOM changes. Inside a list, keys are how React matches old elements with new ones.

**Without keys**, React compares items **by position (index)**:

```
Before:  [A, B, C]
After:   [X, A, B, C]        ← X was added at the start

React compares by position:
  position 0: A → X   (changed! update it)
  position 1: B → A   (changed! update it)
  position 2: C → B   (changed! update it)
  position 3: -- → C  (new! create it)
→ 4 DOM operations
```

**With keys**, React matches by identity:

```
React sees key "X" is new, and keys A, B, C are unchanged
→ 1 DOM operation (just insert X)
```

---

## 3. Rules for keys

| Rule | Explanation |
|---|---|
| **Unique among siblings** | Keys only need to be unique within the same list, not globally |
| **Stable** | The same item must keep the same key across every render |
| **Predictable** | Never generate a random key on each render |
| **A string or number** | Objects are not valid keys |

```jsx
// ✅ Good - stable unique id from the data
{users.map((u) => <User key={u.id} {...u} />)}

// ❌ Bad - a new key on every render destroys and recreates every element
{users.map((u) => <User key={Math.random()} {...u} />)}
{users.map((u) => <User key={crypto.randomUUID()} {...u} />)}
```

---

## 4. Why is the array index a bad key?

**Definition:** Using `index` as a key means the key changes whenever items are reordered, inserted or deleted — so React matches the wrong old element to the wrong new one. Component state and DOM state (like input text or focus) then attaches to the wrong row.

```jsx
// ❌ Problematic
{todos.map((todo, index) => <TodoItem key={index} todo={todo} />)}
```

**The classic bug demo:**

```jsx
function BuggyList() {
  const [items, setItems] = useState(["Apple", "Banana", "Cherry"]);

  const removeFirst = () => setItems(items.slice(1));

  return (
    <>
      <button onClick={removeFirst}>Remove first</button>
      {items.map((item, index) => (
        <div key={index}>
          {item} <input placeholder="type here" />
        </div>
      ))}
    </>
  );
}
```

**What happens:** type "hello" into Apple's input, then remove the first item. The inputs shift, but because keys are `0, 1, 2` both before and after, React keeps the DOM nodes in place — "hello" now appears next to **Banana**. With `key={item}` it would be removed correctly along with Apple.

### When IS the index acceptable?

Only when **all three** of these are true:
1. The list never changes order (no sorting, no filtering).
2. Items are never added or removed from the middle.
3. The items have no state, no inputs and no focus of their own.

A static, render-once list is fine. Anything interactive is not.

---

## 5. Where to put the key

**Definition:** The key goes on the **outermost element returned by `.map()`**, not on an inner element.

```jsx
// ❌ Wrong - key on the inner element
{users.map((user) => (
  <div>
    <User key={user.id} />
  </div>
))}

// ✅ Correct - key on the outermost element of the map
{users.map((user) => (
  <div key={user.id}>
    <User />
  </div>
))}

// ✅ With Fragments, use the long form so you can add a key
{users.map((user) => (
  <React.Fragment key={user.id}>
    <dt>{user.name}</dt>
    <dd>{user.email}</dd>
  </React.Fragment>
))}
// The short form <>...</> cannot take a key
```

---

## 6. What if there is no unique ID?

```jsx
// Option 1 - a naturally unique field
{users.map((u) => <li key={u.email}>{u.name}</li>)}

// Option 2 - combine fields to make a unique value
{items.map((i) => <li key={`${i.category}-${i.name}`}>{i.name}</li>)}

// Option 3 - generate IDs ONCE when the data is created, not during render
const [todos, setTodos] = useState([]);
const addTodo = (text) =>
  setTodos([...todos, { id: crypto.randomUUID(), text }]);  // ✅ id created once

// Option 4 - index, only for a truly static list
{["Home", "About", "Contact"].map((label, i) => <li key={i}>{label}</li>)}
```

---

## 7. Using a key to force a remount

**Definition:** Changing a component's key tells React the element is a **different** element, so React destroys the old one (losing all its state) and creates a fresh one. This is a deliberate and useful trick.

```jsx
// Reset the form's internal state whenever the user changes
<UserForm key={userId} userId={userId} />

// Restart an animation each time the value changes
<Animation key={animationTrigger} />
```

---

## 8. Keys are not props

**Definition:** `key` is consumed by React itself and is **not** passed down to the component. Trying to read `props.key` gives `undefined`.

```jsx
function Item({ key, id }) {
  console.log(key);   // undefined ❌
  console.log(id);    // works ✅
}

<Item key={user.id} id={user.id} />   // pass it again as a normal prop if needed
```

---

## Key points

- Keys give list items a stable identity so React can reconcile efficiently.
- Keys must be **unique among siblings**, **stable** and **predictable**.
- Never use `Math.random()` — it recreates every element on every render.
- Avoid the array index for any list that can reorder, filter or hold state.
- Put the key on the outermost element returned by `.map()`.
- Changing a key deliberately forces a remount and resets the component's state.
- `key` is used by React internally and is never received as a prop.
