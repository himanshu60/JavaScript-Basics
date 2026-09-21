# Go Basics

## 1. What is Go?

**Definition:** Go (or Golang) is a **statically typed, compiled** language created at Google. It compiles to a single native binary with no runtime dependency, has built-in concurrency, and deliberately keeps the language small.

**Why it gets chosen:**

| Feature | Meaning |
|---|---|
| **Compiled to one binary** | No runtime to install — copy the file and run it |
| **Statically typed** | Type errors caught at compile time |
| **Fast compilation** | Seconds, not minutes |
| **Built-in concurrency** | Goroutines and channels are language features |
| **Garbage collected** | With very low pause times |
| **Small language** | ~25 keywords; readable by anyone on the team |
| **Standard library** | Production HTTP server, JSON, crypto — no framework needed |

**Trade-offs, honestly:** verbose error handling, no exceptions, generics arrived late (1.18), and the simplicity is enforced — there is usually exactly one way to do something.

---

## 2. Hello World and structure

```go
package main            // every file belongs to a package; "main" is executable

import "fmt"            // standard library

func main() {           // entry point
    fmt.Println("Hello, World!")
}
```

```bash
go run main.go          # compile and run
go build                # produce a binary
go mod init myapp       # start a module
go test ./...           # run all tests
go fmt ./...            # format (non-negotiable in Go)
go vet ./...            # catch suspicious code
```

---

## 3. Variables and types

```go
var name string = "Amit"
var age = 25              // type inferred
count := 10               // short declaration - ONLY inside functions
const Pi = 3.14159

var a, b int = 1, 2
x, y := 1, "two"          // multiple, mixed types
```

**Zero values** — Go has no `undefined`. Every variable is initialised:

| Type | Zero value |
|---|---|
| `int`, `float64` | `0` |
| `string` | `""` |
| `bool` | `false` |
| pointer, slice, map, chan, func, interface | `nil` |

```go
var s string    // "" not nil
var n int       // 0
var p *int      // nil
```

**Types:** `bool`, `string`, `int`/`int8..64`, `uint`, `float32/64`, `byte` (= uint8), `rune` (= int32, a Unicode code point), `complex64/128`.

> **Go has no implicit conversion.** `int` + `int64` is a compile error — you must convert explicitly: `int64(x) + y`.

---

## 4. Arrays vs Slices

**Definition of an Array:** Fixed length, part of the type. `[3]int` and `[4]int` are different types. Rarely used directly.
**Definition of a Slice:** A dynamically sized view over an underlying array. This is what you actually use.

```go
arr := [3]int{1, 2, 3}          // array - fixed
s := []int{1, 2, 3}             // slice - no size in brackets
s = append(s, 4)

s2 := make([]int, 0, 10)        // len 0, capacity 10 - preallocate when you know the size
len(s)                          // current length
cap(s)                          // capacity before reallocation
sub := s[1:3]                   // slicing - SHARES the underlying array
```

**The slice gotcha that gets asked:**

```go
a := []int{1, 2, 3, 4, 5}
b := a[1:3]        // [2 3] - shares memory with a
b[0] = 99
fmt.Println(a)     // [1 99 3 4 5]  ← a changed too!

// To copy properly
c := make([]int, len(b))
copy(c, b)
```

**A slice is a struct** of `{pointer, len, cap}`. Passing it to a function copies that header, not the data — so the function can modify the elements but `append` inside it may not be visible to the caller.

---

## 5. Maps

```go
m := map[string]int{"a": 1, "b": 2}
m2 := make(map[string]int)

m["c"] = 3
delete(m, "a")
len(m)

// The comma-ok idiom - distinguishes "missing" from "zero value"
value, ok := m["x"]
if !ok {
    fmt.Println("key not present")
}
```

**Key facts:**
- Maps are **unordered** — iteration order is deliberately randomised
- Reading a missing key returns the **zero value**, never an error
- Writing to a **nil map panics**; reading from it is fine
- Maps are **not** safe for concurrent use — use `sync.Map` or a mutex

```go
var m map[string]int    // nil
m["a"] = 1              // panic: assignment to entry in nil map
m = make(map[string]int) // fix
```

---

## 6. Structs

**Definition:** A typed collection of fields. Go has no classes — structs plus methods do the job.

```go
type Person struct {
    Name string `json:"name"`      // struct tags control JSON encoding
    Age  int    `json:"age"`
    email string                    // lowercase = unexported (package-private)
}

p := Person{Name: "Amit", Age: 25}
p2 := &Person{Name: "Priya"}        // pointer to struct
fmt.Println(p.Name)                 // no -> in Go, dot works on pointers too
```

**Definition of Exported vs unexported:** A capitalised identifier is **exported** (visible outside the package). Lowercase is package-private. This is Go's entire access control system.

**Embedding** — composition instead of inheritance:

```go
type Animal struct { Name string }
func (a Animal) Speak() string { return a.Name + " makes a sound" }

type Dog struct {
    Animal        // embedded - Dog gets Speak() automatically
    Breed string
}

d := Dog{Animal{"Rex"}, "Labrador"}
d.Speak()         // promoted method
```

---

## 7. Methods and receivers

**Definition:** A method is a function with a **receiver** — the type it is attached to.

```go
type Counter struct { count int }

func (c Counter) Get() int {          // VALUE receiver - gets a copy
    return c.count
}

func (c *Counter) Increment() {       // POINTER receiver - can modify
    c.count++
}
```

**When to use which:**

| Use a pointer receiver when | Use a value receiver when |
|---|---|
| The method modifies the receiver | The type is small and immutable |
| The struct is large (avoid copying) | You want value semantics |
| **Any** method on the type uses a pointer | — |

> **Rule of thumb:** be consistent. If one method needs a pointer receiver, give them all pointer receivers.

---

## 8. Interfaces

**Definition:** An interface is a set of method signatures. A type satisfies it **implicitly** — there is no `implements` keyword. If it has the methods, it satisfies the interface.

```go
type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct{ R float64 }

func (c Circle) Area() float64      { return math.Pi * c.R * c.R }
func (c Circle) Perimeter() float64 { return 2 * math.Pi * c.R }
// Circle now satisfies Shape - nothing declared

func describe(s Shape) {
    fmt.Printf("Area: %.2f\n", s.Area())
}
```

**The empty interface** `interface{}` (or `any` since 1.18) holds any value.

**Type assertion and type switch:**

```go
value, ok := i.(string)       // safe assertion

switch v := i.(type) {
case string:  fmt.Println("string:", v)
case int:     fmt.Println("int:", v)
default:      fmt.Println("unknown")
}
```

**Go's interface philosophy:** *"Accept interfaces, return structs."* And keep interfaces small — `io.Reader` has one method and is the most reused interface in the language.

---

## 9. Error handling

**Definition:** Go has **no exceptions**. Errors are ordinary values returned alongside results, and you check them explicitly.

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 0)
if err != nil {
    log.Fatal(err)
}
```

**Wrapping errors** — `%w` preserves the chain:

```go
if err != nil {
    return fmt.Errorf("fetching user %d: %w", id, err)
}

// Unwrapping
errors.Is(err, sql.ErrNoRows)      // is this specific error in the chain?
var myErr *MyError
errors.As(err, &myErr)             // extract a typed error
```

**Custom errors:**

```go
type NotFoundError struct{ Resource string }

func (e *NotFoundError) Error() string {
    return e.Resource + " not found"
}
```

**Definition of panic/recover:** `panic` stops normal execution and unwinds the stack. `recover` inside a `defer` stops the unwinding. **Use them only for genuinely unrecoverable situations** — not for ordinary error handling.

```go
func safeHandler() {
    defer func() {
        if r := recover(); r != nil {
            log.Printf("recovered: %v", r)
        }
    }()
    riskyOperation()
}
```

---

## 10. defer

**Definition:** `defer` schedules a function call to run when the surrounding function returns — regardless of how it returns. It is Go's cleanup mechanism.

```go
func readFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()          // runs whatever happens below

    // ... use f
    return nil
}
```

**Two rules people get wrong:**

```go
// 1. Deferred calls run LIFO (last in, first out)
defer fmt.Println("1")
defer fmt.Println("2")
defer fmt.Println("3")
// prints 3, 2, 1

// 2. Arguments are evaluated IMMEDIATELY, not at execution
i := 0
defer fmt.Println(i)    // prints 0, not 1
i++
```

> **Never `defer` inside a loop** that runs many times — the calls stack up until the function returns, leaking file handles.

---

## 11. Control flow

```go
if x := compute(); x > 10 {        // statement before the condition
    fmt.Println(x)
}

for i := 0; i < 10; i++ { }        // classic
for x < 10 { }                      // while loop - no "while" keyword
for { }                             // infinite
for i, v := range slice { }         // range
for k, v := range myMap { }
for _, v := range slice { }         // _ discards the index

switch day {
case "Sat", "Sun":                  // multiple values, no fallthrough needed
    fmt.Println("weekend")
default:
    fmt.Println("weekday")
}

switch {                            // switch with no expression = cleaner if/else
case score >= 90: grade = "A"
case score >= 80: grade = "B"
}
```

Go has only `for` — no `while`, no `do-while`. `switch` does **not** fall through by default.

---

## 12. Pointers

```go
x := 10
p := &x            // & takes the address
fmt.Println(*p)    // * dereferences → 10
*p = 20            // modifies x through the pointer

func modify(n *int) { *n = 100 }
modify(&x)
```

**Go has no pointer arithmetic** (unlike C) — you cannot do `p++`. This removes a whole category of bugs.

> Go is **always pass by value**. Passing a pointer copies the pointer, which is how you modify the original.

---

## 13. Generics (Go 1.18+)

```go
func Map[T any, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = f(v)
    }
    return result
}

type Number interface { ~int | ~float64 }   // type constraint

func Sum[T Number](nums []T) T {
    var total T
    for _, n := range nums { total += n }
    return total
}
```

---

## Key points

- Go compiles to a **single binary**, is statically typed, and has no implicit type conversion.
- Every variable has a **zero value** — there is no `undefined`.
- **Slices share** their underlying array — use `copy()` when you need independence.
- Maps are unordered, return zero values for missing keys, and **panic on nil writes**.
- Capitalisation controls visibility: **exported** vs unexported.
- Interfaces are satisfied **implicitly**; keep them small.
- Errors are **values you check**, not exceptions. Wrap with `%w`.
- `defer` runs LIFO, and its arguments evaluate immediately.
- Composition via **embedding**, not inheritance.
