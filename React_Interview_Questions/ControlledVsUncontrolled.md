# Controlled vs Uncontrolled Components in React

## 1. What is a Controlled Component?

**Definition:** A controlled component is a form input whose value is stored in **React state**. React becomes the "single source of truth" — the input displays whatever state says, and every keystroke updates state through an `onChange` handler.

**In simple words:** React holds the value and tells the input what to show. The input has no memory of its own.

```jsx
function ControlledInput() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}                                 // React controls what is shown
      onChange={(e) => setName(e.target.value)}    // every keystroke updates state
    />
  );
}
```

**The data flow loop:**
```
User types → onChange fires → setState → component re-renders → input shows new value
```

---

## 2. What is an Uncontrolled Component?

**Definition:** An uncontrolled component is a form input that keeps its own value **inside the DOM**, exactly like plain HTML. React does not track it; you read the value only when you need it, using a **ref**.

**In simple words:** The input remembers its own value, and you ask for it only when you need it (usually on submit).

```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(inputRef.current.value);   // read the value only at submit time
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="Initial" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 3. `value` vs `defaultValue`

**Definition of `value`:** Makes the input **controlled**. React forces the input to always show this value.

**Definition of `defaultValue`:** Sets the **initial** value only. After that the DOM manages it — the input is **uncontrolled**.

```jsx
<input value={name} onChange={handleChange} />   // controlled
<input defaultValue="John" />                    // uncontrolled
```

For checkboxes and radios the same pair is `checked` (controlled) and `defaultChecked` (uncontrolled).

**⚠️ Common warning:** if you pass `value` without `onChange`, the input becomes read-only and React warns you.

```jsx
<input value={name} />                    // ❌ warning: no onChange
<input value={name} readOnly />           // ✅ intentionally read-only
<input value={name} onChange={handle} />  // ✅ controlled
```

**⚠️ Never switch between the two:**

```jsx
const [value, setValue] = useState();          // undefined → uncontrolled
<input value={value} onChange={...} />
// Later setValue("text") → now controlled → React warns:
// "A component is changing an uncontrolled input to be controlled"

const [value, setValue] = useState("");        // ✅ always start with "" not undefined
```

---

## 4. Full comparison table

| Point | Controlled | Uncontrolled |
|---|---|---|
| **Where the value lives** | React state | The DOM |
| **How you read it** | From state directly | Through a `ref` |
| **Initial value prop** | `value` | `defaultValue` |
| **Re-render on typing** | Yes, every keystroke | No |
| **Instant validation** | Easy | Hard |
| **Conditional formatting** | Easy | Hard |
| **Disabling submit dynamically** | Easy | Hard |
| **Code amount** | More | Less |
| **Performance on big forms** | Slower (re-renders) | Faster |
| **React recommendation** | ✅ Preferred | Only for simple cases |

---

## 5. Controlled form — full example

```jsx
function SignupForm() {
  const [form, setForm] = useState({ email: "", password: "", agree: false });
  const [errors, setErrors] = useState({});

  // One handler for all fields - uses the input's "name" attribute
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Live validation is easy because we have the value on every keystroke
  const isValid = form.email.includes("@") && form.password.length >= 6 && form.agree;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    console.log("Submitting:", form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={form.email} onChange={handleChange} />
      <input name="password" type="password" value={form.password} onChange={handleChange} />
      <label>
        <input name="agree" type="checkbox" checked={form.agree} onChange={handleChange} />
        I agree to the terms
      </label>
      <button type="submit" disabled={!isValid}>Sign up</button>
    </form>
  );
}
```

**What controlled inputs make easy here:** the live `isValid` check, the disabled button, and formatting or restricting input as the user types.

```jsx
// Force uppercase while typing
onChange={(e) => setCode(e.target.value.toUpperCase())}

// Allow digits only
onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}

// Limit length
onChange={(e) => setPin(e.target.value.slice(0, 6))}
```

---

## 6. Uncontrolled form — full example

```jsx
function ContactForm() {
  const formRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // FormData reads every named field from the form at once
    const data = Object.fromEntries(new FormData(formRef.current));
    console.log(data);  // { name: "...", email: "...", message: "..." }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input name="name" defaultValue="" />
      <input name="email" type="email" />
      <textarea name="message" />
      <button type="submit">Send</button>
    </form>
  );
}
```

**Definition of `FormData`:** A built-in browser API that collects all the named fields of a form into a key-value structure. It is the cleanest way to read an uncontrolled form.

---

## 7. File inputs are always uncontrolled

**Definition:** `<input type="file">` cannot be controlled, because its value is set by the user's file system and, for security reasons, cannot be set by JavaScript.

```jsx
function FileUpload() {
  const fileRef = useRef(null);

  const handleUpload = () => {
    const file = fileRef.current.files[0];
    console.log(file.name, file.size);
  };

  return <input type="file" ref={fileRef} onChange={handleUpload} />;
}
```

---

## 8. Which one should you use?

**Use controlled when you need:**
- Validation as the user types
- To enable/disable a submit button based on input
- To format or restrict the input while typing
- To sync one input's value with another part of the UI
- Dynamic fields that depend on other fields

**Use uncontrolled when:**
- The form is simple and you only need the values on submit
- You are integrating a non-React library that manages the DOM
- You have a very large form and re-rendering on each keystroke is slow
- You are handling file inputs

**The practical answer for real projects:** use a form library like **React Hook Form**, which keeps inputs uncontrolled internally (so it is fast) while still giving you validation and error handling.

```jsx
import { useForm } from "react-hook-form";

function Form() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register("email", { required: "Email is required" })} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Key points

- Controlled = value in **React state**, updated via `onChange`.
- Uncontrolled = value in the **DOM**, read via a `ref`.
- `value` makes it controlled; `defaultValue` makes it uncontrolled.
- Always initialise controlled state with `""`, never `undefined`.
- File inputs are always uncontrolled.
- React recommends controlled inputs; React Hook Form gives you the best of both.
