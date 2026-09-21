# Redux and Redux Toolkit

## 1. What is Redux?

**Definition:** Redux is a **predictable state container** for JavaScript applications. It stores the entire application state in a single object called the **store**, and the only way to change that state is by **dispatching actions** that are processed by pure **reducer** functions.

**In simple words:** Instead of state being scattered across many components, everything lives in one central place, and every change goes through one controlled path.

---

## 2. The three principles of Redux

| Principle | Definition |
|---|---|
| **Single source of truth** | The whole app state lives in one store object |
| **State is read-only** | The only way to change it is to dispatch an action |
| **Changes are made by pure functions** | Reducers take the old state plus an action and return new state |

---

## 3. The core concepts

### Store

**Definition:** The single object that holds the entire application state. It provides `getState()`, `dispatch()` and `subscribe()`.

### Action

**Definition:** A plain JavaScript object describing **what happened**. It must have a `type` field and usually carries a `payload`.

```js
{ type: "cart/itemAdded", payload: { id: 1, name: "Shoes" } }
```

### Reducer

**Definition:** A **pure function** `(state, action) => newState` that decides how the state changes in response to an action. It must never mutate the old state and must have no side effects.

### Dispatch

**Definition:** The function used to send an action to the store, which then runs the reducers and notifies all subscribers.

**The data flow (one direction only):**

```
UI event → dispatch(action) → reducer(state, action) → new state → UI re-renders
```

---

## 4. What is Redux Toolkit (RTK)?

**Definition:** Redux Toolkit is the **official, recommended way to write Redux**. It removes the huge amount of boilerplate that classic Redux required, and includes good defaults (Immer, Thunk, DevTools) out of the box.

**The problems RTK solved:**

| Old Redux problem | RTK solution |
|---|---|
| Too much boilerplate | `createSlice` generates actions and reducers together |
| Manual immutable updates | Immer lets you write "mutating" code safely |
| Complex store setup | `configureStore` sets everything up in one call |
| Async needed extra libraries | `createAsyncThunk` is built in |
| Many separate files per feature | One slice file per feature |

```bash
npm install @reduxjs/toolkit react-redux
```

---

## 5. `createSlice` — the heart of RTK

**Definition:** `createSlice` takes a name, an initial state and a set of reducer functions, and automatically generates the **action types** and **action creators** for you.

```js
import { createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",                       // used as a prefix for action types
  initialState: { value: 0, step: 1 },

  reducers: {
    increment: (state) => {
      state.value += state.step;         // looks like mutation - Immer makes it safe
    },
    decrement: (state) => {
      state.value -= state.step;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    setStep: (state, action) => {
      state.step = action.payload;
    },
    reset: () => ({ value: 0, step: 1 }),  // returning a new object also works
  },
});

// Action creators are generated automatically
export const { increment, decrement, incrementByAmount, setStep, reset } =
  counterSlice.actions;

export default counterSlice.reducer;
```

**Definition of Immer:** A library RTK uses internally. It gives your reducer a **draft** copy of the state. You can write normal mutating code on the draft, and Immer produces a correct new immutable state behind the scenes.

> ⚠️ Important: this only works **inside** `createSlice`/`createReducer`. Anywhere else, mutating state is still a bug.

---

## 6. `configureStore` — setting up the store

**Definition:** `configureStore` creates the store, combines your reducers, adds the default middleware (including Thunk), and connects Redux DevTools automatically.

```js
import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./features/counterSlice";
import cartReducer from "./features/cartSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,     // state.counter
    cart: cartReducer,           // state.cart
  },
});
```

```jsx
// Connect it to React
import { Provider } from "react-redux";

<Provider store={store}>
  <App />
</Provider>
```

---

## 7. `useSelector` and `useDispatch`

**Definition of `useSelector(fn)`:** A hook that reads a value from the store. The component re-renders whenever the selected value changes.

**Definition of `useDispatch()`:** A hook that returns the `dispatch` function, used to send actions.

```jsx
import { useSelector, useDispatch } from "react-redux";
import { increment, incrementByAmount } from "./counterSlice";

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
    </div>
  );
}
```

**⚠️ Selector performance rule:** select the **smallest** piece of data you need. Returning a new object from a selector causes a re-render on every store change.

```jsx
// ❌ New object every time → re-renders constantly
const { name, email } = useSelector((state) => ({
  name: state.user.name,
  email: state.user.email,
}));

// ✅ Two separate primitive selections
const name = useSelector((state) => state.user.name);
const email = useSelector((state) => state.user.email);

// ✅ Or use the shallow equality function
import { shallowEqual } from "react-redux";
const user = useSelector((state) => state.user, shallowEqual);
```

---

## 8. `createAsyncThunk` — async logic

**Definition:** `createAsyncThunk` creates an action that performs async work (like an API call) and automatically dispatches three lifecycle actions: **`pending`**, **`fulfilled`** and **`rejected`**.

```js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",                  // action type prefix
  async (page, thunkAPI) => {
    try {
      const res = await fetch(`/api/users?page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();         // becomes action.payload of "fulfilled"
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);  // becomes payload of "rejected"
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},

  // extraReducers handles actions defined OUTSIDE this slice
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});
```

```jsx
function UserList() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.users);

  useEffect(() => {
    if (status === "idle") dispatch(fetchUsers(1));
  }, [status, dispatch]);

  if (status === "loading") return <Spinner />;
  if (status === "failed") return <p>{error}</p>;
  return <ul>{items.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

**Definition of `extraReducers`:** The place to respond to actions that were **not** created by this slice — thunk lifecycle actions, or actions from other slices.

---

## 9. What is RTK Query?

**Definition:** RTK Query is a data-fetching and caching layer built into Redux Toolkit. It generates hooks for your API endpoints and handles caching, re-fetching, loading states and invalidation automatically — removing the need to write thunks and slices for server data at all.

```js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["User"],

  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => "/users",
      providesTags: ["User"],           // this data is tagged "User"
    }),
    addUser: builder.mutation({
      query: (newUser) => ({ url: "/users", method: "POST", body: newUser }),
      invalidatesTags: ["User"],        // after adding, refetch anything tagged "User"
    }),
  }),
});

export const { useGetUsersQuery, useAddUserMutation } = api;
```

```jsx
function UserList() {
  const { data, isLoading, error } = useGetUsersQuery();   // caching handled for you
  const [addUser, { isLoading: isAdding }] = useAddUserMutation();

  if (isLoading) return <Spinner />;
  return (
    <>
      <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
      <button onClick={() => addUser({ name: "New" })} disabled={isAdding}>Add</button>
    </>
  );
}
```

**Definition of tags:** Labels attached to cached data. When a mutation `invalidatesTags`, RTK Query automatically refetches every query that `providesTags` with the same label.

---

## 10. Do you even need Redux?

**Definition:** Redux solves **global client state** shared across many unrelated components. Most apps need far less of it than people assume.

| Need | Better tool |
|---|---|
| Local UI state (a modal, a toggle) | `useState` |
| Complex local state | `useReducer` |
| Theme, language, logged-in user | Context API |
| **Server data** (API responses) | React Query / SWR / RTK Query |
| Large global client state, many writers | Redux Toolkit |
| Simpler global state | Zustand / Jotai |

**Use Redux when:** the state is genuinely global, many distant components read and write it, updates are complex, or you need time-travel debugging and a strict audit trail.

---

## 11. Redux vs Context API

| Point | Context API | Redux Toolkit |
|---|---|---|
| Built into React | Yes | No (a library) |
| Purpose | Avoid prop drilling | Manage complex global state |
| Re-render control | All consumers re-render | Fine-grained via selectors |
| DevTools | No | Yes, with time travel |
| Middleware | No | Yes |
| Async support | Manual | Thunks / RTK Query |
| Boilerplate | Very little | Moderate (much less with RTK) |
| Best for | Theme, locale, auth user | Large shared, frequently changing state |

---

## Key points

- Redux = one store, actions describe events, pure reducers produce new state.
- **Always use Redux Toolkit** — classic Redux boilerplate is obsolete.
- `createSlice` generates actions and reducers together; Immer makes "mutating" code safe.
- `configureStore` sets up the store, middleware and DevTools in one call.
- `useSelector` reads state (select the smallest value possible), `useDispatch` sends actions.
- `createAsyncThunk` handles async with automatic pending/fulfilled/rejected actions.
- **RTK Query** is the best choice for server data and removes most slice code.
- Do not reach for Redux by default — `useState`, Context and React Query cover most cases.
