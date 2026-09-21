# useReducer in React

## 1. What is useReducer?

**Definition:** `useReducer` is a React Hook for managing **complex state logic**. Instead of calling a setter directly, you **dispatch an action** describing what happened, and a **reducer function** decides the next state.

**In simple words:** `useState` is you changing the value yourself. `useReducer` is you telling a manager "the user clicked add", and the manager decides how the state should change.

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

---

## 2. The three parts explained

### a) State

**Definition:** The current data of your component. With `useReducer` it is usually an object holding several related values.

```jsx
const initialState = { count: 0, step: 1, history: [] };
```

### b) Action

**Definition:** A plain object that **describes what happened**. By convention it has a `type` field (a string naming the event) and an optional `payload` field carrying extra data.

```jsx
{ type: "increment" }
{ type: "setStep", payload: 5 }
{ type: "addTodo", payload: { id: 1, text: "Learn React" } }
```

### c) Reducer

**Definition:** A **pure function** that takes the current state and an action, and returns the **new** state. It must never mutate the old state and must never contain side effects (no API calls, no timers).

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + state.step };
    case "decrement":
      return { ...state, count: state.count - state.step };
    case "setStep":
      return { ...state, step: action.payload };
    case "reset":
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
```

### d) dispatch

**Definition:** The function React gives you to **send an action** to the reducer. Its identity is stable — it never changes between renders, so it is safe to leave out of dependency arrays.

```jsx
dispatch({ type: "increment" });
dispatch({ type: "setStep", payload: 5 });
```

---

## 3. Complete working example

```jsx
import { useReducer } from "react";

const initialState = { count: 0, step: 1 };

function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + state.step };
    case "decrement":
      return { ...state, count: state.count - state.step };
    case "setStep":
      return { ...state, step: Number(action.payload) };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <input
        type="number"
        value={state.step}
        onChange={(e) => dispatch({ type: "setStep", payload: e.target.value })}
      />
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </div>
  );
}
```

---

## 4. useState vs useReducer

| Point | `useState` | `useReducer` |
|---|---|---|
| **Best for** | Simple, independent values | Complex or related state |
| **How state changes** | You set it directly | A reducer decides |
| **Update logic lives** | Scattered in event handlers | Centralised in one function |
| **Testing** | Needs a component | The reducer is a pure function — test it alone |
| **Multiple related fields** | Many `useState` calls | One state object |
| **Next state depends on previous** | Functional updates | Natural fit |
| **Passing down to children** | Pass several setters | Pass one stable `dispatch` |

### When to switch from useState to useReducer

Switch when you notice any of these:
1. You have **many `useState` calls** whose values change together.
2. The next state **depends on** the previous state in complicated ways.
3. The same update logic is **repeated** in several event handlers.
4. You are passing **many setter functions** down to children.
5. You want to **test** the state logic without rendering a component.

```jsx
// ❌ Getting messy - 5 related useStates
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

// ✅ One reducer, impossible states prevented
const [state, dispatch] = useReducer(fetchReducer, {
  data: null, loading: false, error: null, page: 1, hasMore: true,
});
```

---

## 5. Real example — data fetching reducer

```jsx
const initialState = { status: "idle", data: null, error: null };

function fetchReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { status: "loading", data: null, error: null };
    case "FETCH_SUCCESS":
      return { status: "success", data: action.payload, error: null };
    case "FETCH_ERROR":
      return { status: "error", data: null, error: action.payload };
    default:
      return state;
  }
}

function UserList() {
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      dispatch({ type: "FETCH_START" });
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (!cancelled) dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        if (!cancelled) dispatch({ type: "FETCH_ERROR", payload: err.message });
      }
    }

    load();
    return () => { cancelled = true; };   // cleanup prevents setting state after unmount
  }, []);

  if (state.status === "loading") return <Spinner />;
  if (state.status === "error") return <p>Error: {state.error}</p>;
  return <ul>{state.data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

**Why this is better than 3 separate useStates:** impossible combinations (like `loading: true` **and** `error: "..."` at the same time) simply cannot happen, because each action sets the whole state at once.

---

## 6. Real example — todo list

```jsx
function todoReducer(state, action) {
  switch (action.type) {
    case "added":
      return [...state, { id: action.id, text: action.text, done: false }];
    case "toggled":
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
    case "edited":
      return state.map((t) => (t.id === action.id ? { ...t, text: action.text } : t));
    case "deleted":
      return state.filter((t) => t.id !== action.id);
    case "clearCompleted":
      return state.filter((t) => !t.done);
    default:
      return state;
  }
}

function TodoApp() {
  const [todos, dispatch] = useReducer(todoReducer, []);

  return (
    <>
      <AddTodo onAdd={(text) => dispatch({ type: "added", id: crypto.randomUUID(), text })} />
      <TodoList todos={todos} dispatch={dispatch} />
    </>
  );
}
```

---

## 7. The third argument — lazy initialisation

**Definition:** `useReducer(reducer, initialArg, init)` takes an optional third argument: an `init` function that is called **once** with `initialArg` to compute the initial state. Use it when creating the initial state is expensive.

```jsx
function init(initialCount) {
  return { count: initialCount, history: [] };   // runs only on the first render
}

const [state, dispatch] = useReducer(reducer, 0, init);

// It also makes resetting clean
case "reset":
  return init(action.payload);
```

---

## 8. useReducer + useContext = mini Redux

**Definition:** Combining `useReducer` with `useContext` gives you global state management without any library. The reducer holds the logic, and context delivers the state and `dispatch` to any component.

```jsx
const StateContext = createContext(null);
const DispatchContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// Custom hooks for easy access
export const useAppState = () => useContext(StateContext);
export const useAppDispatch = () => useContext(DispatchContext);

// Any component, at any depth
function Cart() {
  const { items } = useAppState();
  const dispatch = useAppDispatch();
  return <button onClick={() => dispatch({ type: "clearCart" })}>Clear</button>;
}
```

> **Why two separate contexts?** Components that only dispatch will not re-render when the state changes, because `dispatch` never changes.

---

## 9. Rules for reducers

| Rule | Why |
|---|---|
| Must be **pure** | Same state + same action = same result, always |
| Must **not mutate** state | Return a new object/array; React compares references |
| **No side effects** inside | No API calls, timers or logging — do those in effects/handlers |
| Must **always return** a state | Never return `undefined`; handle the `default` case |

```jsx
// ❌ Mutation
case "add":
  state.items.push(action.item);
  return state;

// ✅ New array
case "add":
  return { ...state, items: [...state.items, action.item] };
```

---

## Key points

- `useReducer` centralises complex state logic in one pure function.
- Flow: **dispatch(action) → reducer(state, action) → new state → re-render**.
- The reducer must be pure, must not mutate, and must handle the default case.
- `dispatch` has a stable identity, so it is safe in dependency arrays.
- The optional third argument gives lazy initialisation and a clean reset.
- `useReducer` + `useContext` is a lightweight Redux alternative for medium apps.
