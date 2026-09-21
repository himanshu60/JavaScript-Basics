# Go Interview Questions

📄 **[GoImpQue.md](GoImpQue.md)** — all 50 questions with answers in one file.

---

## Topic files

| Topic | File | Covers |
|---|---|---|
| **Go Basics** | [GoBasics.md](GoBasics.md) | Types, zero values, slices vs arrays, maps, structs, methods, interfaces, errors, `defer`, pointers, generics |
| **Go Concurrency** | [GoConcurrency.md](GoConcurrency.md) | Goroutines, channels, `select`, `sync`, context, worker pools, deadlocks, race conditions, goroutine leaks |

---

## All 50 questions ([GoImpQue.md](GoImpQue.md))

**Basics (1–15)**
1. What is Go and why would you choose it?
2. What are Go's main drawbacks?
3. What are zero values?
4. Difference between `var` and `:=`?
5. Difference between an array and a slice?
6. What happens when you slice a slice?
7. What does `append` actually do?
8. What are the rules for maps?
9. What is the comma-ok idiom?
10. How does Go control visibility?
11. Does Go have classes and inheritance?
12. Difference between a value receiver and a pointer receiver?
13. How do interfaces work in Go?
14. What is the empty interface?
15. What is a type assertion vs a type switch?

**Errors and defer (16–21)**
16. How does Go handle errors?
17. What does `%w` do in `fmt.Errorf`?
18. Difference between `errors.Is` and `errors.As`?
19. When should you use panic?
20. How does `defer` work?
21. Why should you not `defer` inside a loop?

**Concurrency (22–40)**
22. What is a goroutine and how does it differ from a thread?
23. What is the GMP scheduler?
24. Why does a program with only `go fmt.Println("hello")` print nothing?
25. What is a channel?
26. Difference between a buffered and unbuffered channel?
27. What happens if you send on a closed channel?
28. Who should close a channel?
29. What does sending or receiving on a nil channel do?
30. What is `select`?
31. How do you wait for multiple goroutines?
32. When do you use a Mutex instead of a channel?
33. What is `sync.RWMutex`?
34. What is `context` used for?
35. What is the loop variable trap?
36. What is a race condition and how do you detect one?
37. What causes a deadlock in Go?
38. What is a goroutine leak?
39. Explain the worker pool pattern.
40. How do you limit concurrency?

**Practical (41–50)**
41. What is `go mod`?
42. How do you write tests in Go?
43. What is the standard project layout?
44. How do you build an HTTP server in Go?
45. What are struct tags?
46. How does garbage collection work in Go?
47. What does `go vet` do?
48. Why is `gofmt` significant?
49. What are generics used for in Go?
50. How do you handle configuration and secrets?

---

## The questions that actually decide a Go interview

Concurrency is the reason teams pick Go, so that is where the depth check happens:

| Question | Why it separates people |
|---|---|
| **Who closes a channel?** | Sending on a closed channel panics — tests real usage |
| **Buffered vs unbuffered** | Tests whether you understand channels as synchronisation |
| **Slices share memory** | The most common real Go bug |
| **Worker pool** | The standard pattern; you should be able to write it |
| **Goroutine leaks** | "How does this goroutine exit?" is the senior question |
| **Value vs pointer receiver** | Basic fluency check |
| **`-race`** | Knowing it exists signals production experience |
| **Loop variable trap** | Tests whether you track language changes (fixed in 1.22) |

---

**Related:** [Node.js & Backend](../Node_Backend_Questions/) for comparison · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
