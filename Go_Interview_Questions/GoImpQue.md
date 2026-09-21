# Go Interview Questions and Answers

## Basics

## 1. What is Go and why would you choose it?

A statically typed, compiled language from Google. It produces a single native binary with no runtime dependency, compiles in seconds, has concurrency built into the language, and keeps the feature set deliberately small so codebases stay readable. Common uses: APIs, CLIs, infrastructure tooling.

## 2. What are Go's main drawbacks?

Verbose error handling (`if err != nil` everywhere), no exceptions, generics only arrived in 1.18, and the enforced simplicity means less expressive power than languages like Rust or Scala.

## 3. What are zero values?

Every declared variable is initialised automatically — there is no `undefined`. `int` is `0`, `string` is `""`, `bool` is `false`, and pointers, slices, maps, channels, functions and interfaces are `nil`.

## 4. Difference between `var` and `:=`?

`var` works at package level or inside functions and allows an explicit type. `:=` is short declaration with inferred type and works **only inside functions**.

## 5. Difference between an array and a slice?

An array has a **fixed length that is part of its type** — `[3]int` and `[4]int` are different types. A slice is a dynamically sized view over an underlying array, holding a pointer, length and capacity. You almost always use slices.

## 6. What happens when you slice a slice?

The new slice **shares the same underlying array**, so modifying one changes the other. Use `copy()` into a new slice when you need independence. This is a very common interview trap.

## 7. What does `append` actually do?

It adds elements and returns a slice. If capacity allows, it writes in place; if not, it **allocates a new larger array** and copies. That is why you must always use the return value: `s = append(s, x)`.

## 8. What are the rules for maps?

Maps are unordered (iteration order is randomised deliberately), reading a missing key returns the zero value rather than an error, **writing to a nil map panics**, and maps are not safe for concurrent use.

## 9. What is the comma-ok idiom?

`value, ok := m[key]` — `ok` tells you whether the key existed, which distinguishes "missing" from "present with a zero value". It also works for channel receives and type assertions.

## 10. How does Go control visibility?

By **capitalisation**. An identifier starting with an uppercase letter is exported (visible outside its package); lowercase is package-private. That is the entire access control system — no `public`/`private` keywords.

## 11. Does Go have classes and inheritance?

No. It has **structs with methods**, and **embedding** for composition. An embedded type's methods are promoted to the outer type, which gives reuse without an inheritance hierarchy.

## 12. Difference between a value receiver and a pointer receiver?

A value receiver gets a **copy**, so it cannot modify the original. A pointer receiver can modify it and avoids copying large structs. Rule of thumb: if any method needs a pointer receiver, give them all pointer receivers for consistency.

## 13. How do interfaces work in Go?

**Implicitly.** There is no `implements` keyword — if a type has the required methods, it satisfies the interface. This keeps packages decoupled, since the implementation does not need to import the interface.

## 14. What is the empty interface?

`interface{}` (or `any` since 1.18) has no methods, so **every** type satisfies it. Used for values of unknown type, extracted with a type assertion or type switch.

## 15. What is a type assertion vs a type switch?

A type assertion extracts a concrete type: `v, ok := i.(string)`. A type switch handles multiple possibilities: `switch v := i.(type) { case string: ... }`.

---

## Errors and defer

## 16. How does Go handle errors?

Errors are **values**, returned as the last return value and checked explicitly with `if err != nil`. There are no exceptions for ordinary failures.

## 17. What does `%w` do in `fmt.Errorf`?

It **wraps** the original error, preserving the chain so `errors.Is` and `errors.As` can inspect it further up the stack. `%v` would flatten it to a string and lose that.

## 18. Difference between `errors.Is` and `errors.As`?

`errors.Is` checks whether a specific error value appears anywhere in the chain (`errors.Is(err, sql.ErrNoRows)`). `errors.As` extracts a specific error **type** into a variable.

## 19. When should you use panic?

Almost never in library code. `panic` is for genuinely unrecoverable situations — a programming bug, or impossible state. Ordinary failures return an error. `recover` inside a `defer` can stop the unwinding, typically at an HTTP handler boundary.

## 20. How does `defer` work?

It schedules a call to run when the surrounding function returns, however it returns. Deferred calls run **LIFO**, and their **arguments are evaluated immediately**, not at execution time.

## 21. Why should you not `defer` inside a loop?

Deferred calls only run when the **function** returns, not the loop iteration. In a loop over 10,000 files, all 10,000 `Close()` calls queue up and you exhaust file handles first.

---

## Concurrency

## 22. What is a goroutine and how does it differ from a thread?

A function running independently, scheduled by the **Go runtime** rather than the OS. It starts with a ~2 KB stack that grows as needed, versus 1–8 MB for an OS thread, and switching happens in user space. You can run millions of goroutines.

## 23. What is the GMP scheduler?

Go's M:N scheduler mapping **G**oroutines onto OS threads (**M**) through logical processors (**P**). Many goroutines share few threads, so a blocked goroutine does not block a thread.

## 24. Why does this program print nothing?
```go
func main() { go fmt.Println("hello") }
```
When `main` returns the program exits immediately and all goroutines are killed. You must wait — with a `WaitGroup` or a channel.

## 25. What is a channel?

A typed conduit for passing values between goroutines. It both communicates and **synchronises**. The Go proverb is *"don't communicate by sharing memory; share memory by communicating."*

## 26. Difference between a buffered and unbuffered channel?

An **unbuffered** channel blocks the sender until a receiver is ready — it is a synchronisation point. A **buffered** channel blocks only when the buffer is full, decoupling sender and receiver.

## 27. What happens if you send on a closed channel?

It **panics**. So does closing an already-closed channel or a nil channel. Receiving from a closed channel is fine — it returns the zero value with `ok == false`.

## 28. Who should close a channel?

**The sender**, never the receiver. If a receiver closes it, the sender panics on its next send. With multiple senders, coordinate with a `WaitGroup` and close after `Wait()`.

## 29. What does sending or receiving on a nil channel do?

It blocks **forever**. This is occasionally useful — setting a channel to nil in a `select` disables that case.

## 30. What is `select`?

It waits on multiple channel operations and proceeds with whichever is ready, choosing randomly if several are. Adding `default` makes it non-blocking; `case <-time.After(d)` gives you a timeout.

## 31. How do you wait for multiple goroutines?

`sync.WaitGroup` — call `wg.Add(1)` **before** starting each goroutine, `defer wg.Done()` inside it, and `wg.Wait()` to block. Calling `Add` inside the goroutine is a race.

## 32. When do you use a Mutex instead of a channel?

Use a **channel** to transfer ownership of data between goroutines. Use a **Mutex** to protect shared state that stays in one place — a counter, a cache, a map. Channels for communication, mutexes for protection.

## 33. What is `sync.RWMutex`?

A lock allowing **many concurrent readers or one writer**. Use `RLock()` for reads and `Lock()` for writes. Better than a plain Mutex for read-heavy data.

## 34. What is `context` used for?

Carrying cancellation signals, deadlines and request-scoped values across API boundaries. It is how you stop work that is no longer needed. Convention: `ctx` is the first parameter, never stored in a struct, and you always `defer cancel()`.

## 35. What is the loop variable trap?

Before Go 1.22, the loop variable was reused across iterations, so goroutines capturing it often all saw the final value. Fixes were passing it as an argument or shadowing it (`i := i`). **Go 1.22 made the variable per-iteration**, so the old code now works.

## 36. What is a race condition and how do you detect one?

Two goroutines accessing the same memory concurrently with at least one writing, so the result depends on timing. Detect it with the built-in race detector: `go run -race` or `go test -race`.

## 37. What causes a deadlock in Go?

All goroutines blocked waiting on each other — commonly sending on an unbuffered channel with no receiver, a forgotten `wg.Done()`, or circular lock ordering. Go's runtime detects the total case and panics with *"all goroutines are asleep"*.

## 38. What is a goroutine leak?

A goroutine blocked forever on a channel nobody will read, so it is never collected and memory grows. Prevent it with buffered channels or context cancellation. **Whenever you start a goroutine, know how it exits.**

## 39. Explain the worker pool pattern.

Start N workers each ranging over a shared `jobs` channel, send work into it, then `close(jobs)` so the workers' `range` loops terminate. A `WaitGroup` waits for them before closing `results`. It gives **bounded** concurrency instead of one goroutine per task.

## 40. How do you limit concurrency?

A buffered channel as a semaphore: `sem := make(chan struct{}, 10)`, acquire before starting work and release in a `defer`. `struct{}` is used because it occupies zero bytes.

---

## Practical

## 41. What is `go mod`?

Go's dependency management. `go mod init` creates `go.mod` (module path, Go version, dependencies); `go.sum` records checksums. `go mod tidy` adds what is missing and removes what is unused.

## 42. How do you write tests in Go?

Files ending `_test.go`, functions named `TestXxx(t *testing.T)`. Use **table-driven tests** — a slice of cases with `t.Run(name, ...)` for subtests. Benchmarks are `BenchmarkXxx(b *testing.B)`.

## 43. What is the standard project layout?

`cmd/` for entry points, `internal/` for private packages (the compiler **enforces** that `internal` can only be imported by the parent module), `pkg/` for public libraries. Keep it flat until complexity justifies more.

## 44. How do you build an HTTP server in Go?

With the standard library alone — `net/http` gives you a production-capable server. `http.HandleFunc` for routes, `http.ListenAndServe` to start. Frameworks like Gin or Chi add routing convenience, not necessity.

## 45. What are struct tags?

String metadata on struct fields read via reflection, most commonly controlling JSON encoding: `Name string \`json:"name"\``. Also used by database and validation libraries.

## 46. How does garbage collection work in Go?

A concurrent, tri-colour mark-and-sweep collector tuned for **low pause times** (sub-millisecond), running alongside your program rather than stopping it. Tune with `GOGC` if needed, but rarely necessary.

## 47. What does `go vet` do?

Static analysis catching suspicious constructs the compiler allows — wrong `Printf` verbs, unreachable code, mistakes with struct tags and lock copying. Run it in CI alongside tests.

## 48. Why is `gofmt` significant?

Go has **one** canonical format, applied automatically. This ends all formatting debate and means any Go code looks familiar. Formatting is not a matter of preference in Go.

## 49. What are generics used for in Go?

Writing functions and types that work across types without `interface{}` and runtime assertions — `func Map[T, U any](s []T, f func(T) U) []U`. Constraints like `~int | ~float64` limit which types are allowed.

## 50. How do you handle configuration and secrets?

Environment variables read with `os.Getenv`, validated at startup so the program fails fast on a missing value. Never commit secrets; `.env` files are for local development only.

---

**Related:** [GoBasics.md](GoBasics.md) · [GoConcurrency.md](GoConcurrency.md)
