# Go Concurrency — Goroutines, Channels and sync

Concurrency is why most teams pick Go. It is also where every Go interview goes.

---

## 1. Concurrency vs Parallelism

**Definition of Concurrency:** *Dealing* with many things at once — structuring a program so tasks can make progress independently.
**Definition of Parallelism:** *Doing* many things at once — actually executing simultaneously on multiple CPU cores.

> Rob Pike: *"Concurrency is not parallelism."* Go gives you concurrency as a language feature; the runtime delivers parallelism when cores are available.

---

## 2. Goroutines

**Definition:** A goroutine is a function executing independently, managed by the **Go runtime** rather than the operating system. Start one by putting `go` in front of a call.

```go
go doSomething()                    // runs concurrently
go func() { fmt.Println("inline") }()
```

**Why they scale where threads do not:**

| | OS Thread | Goroutine |
|---|---|---|
| Initial stack | 1–8 MB | **~2 KB**, grows as needed |
| Created by | The OS | The Go runtime |
| Switching cost | Expensive (kernel) | Cheap (user space) |
| Practical limit | Thousands | **Millions** |

**Definition of the GMP scheduler:** Go multiplexes **G**oroutines onto OS threads (**M**) via logical processors (**P**). This is *M:N scheduling* — many goroutines share few threads, so a blocked goroutine does not block a thread.

**The mistake everyone makes first:**

```go
func main() {
    go fmt.Println("hello")
    // main exits immediately - the goroutine may never run
}
```
When `main` returns, the program exits and all goroutines die. You must wait for them.

---

## 3. Channels

**Definition:** A typed conduit for sending values between goroutines. Channels synchronise **and** communicate.

> **The Go proverb:** *"Do not communicate by sharing memory; share memory by communicating."*

```go
ch := make(chan int)          // unbuffered
ch <- 42                      // send (blocks until someone receives)
value := <-ch                 // receive (blocks until someone sends)
close(ch)
```

**Unbuffered vs buffered:**

```go
ch := make(chan int)       // unbuffered - send BLOCKS until a receiver is ready
ch := make(chan int, 3)    // buffered  - send blocks only when the buffer is full
```

**Unbuffered channels are a synchronisation point** — sender and receiver meet. Buffered channels decouple them up to the buffer size.

**Directional channels** — encode intent in the signature:

```go
func produce(out chan<- int) { out <- 1 }    // send-only
func consume(in <-chan int)  { <-in }        // receive-only
```

**Receiving until closed:**

```go
for v := range ch {          // exits automatically when ch is closed
    fmt.Println(v)
}

v, ok := <-ch                // ok == false means the channel is closed and drained
```

**Channel rules that cause panics:**

| Action | Result |
|---|---|
| Send on a **closed** channel | **panic** |
| Close an already-closed channel | **panic** |
| Close a **nil** channel | **panic** |
| Receive from a closed channel | Returns the zero value immediately, `ok=false` |
| Send/receive on a **nil** channel | Blocks **forever** |

> **The sender closes the channel, never the receiver.** A receiver closing it causes the sender to panic.

---

## 4. select

**Definition:** `select` waits on multiple channel operations, proceeding with whichever is ready first. If several are ready, it picks one at random.

```go
select {
case msg := <-ch1:
    fmt.Println("from ch1:", msg)
case ch2 <- value:
    fmt.Println("sent to ch2")
case <-time.After(2 * time.Second):
    fmt.Println("timeout")           // the standard timeout pattern
default:
    fmt.Println("nothing ready")     // makes select NON-blocking
}
```

**Two key behaviours:** adding `default` makes `select` non-blocking, and `time.After` gives you timeouts for free.

---

## 5. sync package

### WaitGroup

**Definition:** Waits for a collection of goroutines to finish.

```go
var wg sync.WaitGroup

for i := 1; i <= 3; i++ {
    wg.Add(1)                       // increment BEFORE starting the goroutine
    go func(id int) {
        defer wg.Done()             // defer guarantees it runs
        fmt.Println("worker", id)
    }(i)                            // pass i as an argument
}

wg.Wait()                           // block until the counter hits zero
```

**Two classic bugs here:**
1. Calling `wg.Add(1)` *inside* the goroutine — a race, because `Wait` may run first
2. Not passing the loop variable as an argument (see section 7)

### Mutex

**Definition:** A mutual exclusion lock protecting shared data from concurrent access.

```go
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()             // defer so it unlocks even on panic
    c.count++
}
```

**`sync.RWMutex`** allows many concurrent readers or one writer — better for read-heavy data:

```go
mu.RLock(); defer mu.RUnlock()      // many readers at once
mu.Lock();  defer mu.Unlock()       // exclusive write
```

### Once

```go
var once sync.Once
once.Do(func() { initialize() })    // runs exactly once, even across goroutines
```

Other useful types: `sync.Map` (concurrent map), `sync/atomic` (lock-free counters), `errgroup` (WaitGroup that propagates errors).

---

## 6. Context

**Definition:** `context.Context` carries cancellation signals, deadlines and request-scoped values across API boundaries. It is how you stop work that is no longer needed.

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()                      // ALWAYS defer cancel - it releases resources

result, err := doWork(ctx)

func doWork(ctx context.Context) error {
    select {
    case <-time.After(10 * time.Second):
        return nil
    case <-ctx.Done():              // cancelled or timed out
        return ctx.Err()            // context.DeadlineExceeded or Canceled
    }
}
```

**Conventions:** `ctx` is always the **first parameter**, never stored in a struct, and never `nil` — use `context.Background()` or `context.TODO()`.

---

## 7. The loop variable trap

**Before Go 1.22** the loop variable was reused across iterations, so goroutines captured the same variable:

```go
// ❌ Pre-1.22: often prints 3, 3, 3
for i := 0; i < 3; i++ {
    go func() { fmt.Println(i) }()
}

// ✅ Fix 1 - pass as an argument
for i := 0; i < 3; i++ {
    go func(n int) { fmt.Println(n) }(i)
}

// ✅ Fix 2 - shadow it
for i := 0; i < 3; i++ {
    i := i
    go func() { fmt.Println(i) }()
}
```

**Go 1.22 changed this** — the loop variable is now per-iteration, so the original code works. Interviewers still ask it, so know both the bug and the fix.

---

## 8. Deadlocks and race conditions

**Definition of a Deadlock:** All goroutines are blocked waiting on each other. Go's runtime detects the total case and panics with `fatal error: all goroutines are asleep - deadlock!`

```go
// Deadlock - unbuffered channel with no receiver
func main() {
    ch := make(chan int)
    ch <- 1                    // blocks forever, nothing is receiving
}
```

**Common causes:** sending on an unbuffered channel with no receiver, forgetting `wg.Done()`, locking a mutex twice in the same goroutine, and circular lock ordering.

**Definition of a Race Condition:** Two goroutines access the same memory concurrently with at least one writing, and the result depends on timing.

```bash
go run -race main.go        # the race detector - use it in CI
go test -race ./...
```

> The race detector is one of Go's best features. **Run your tests with `-race`.**

---

## 9. Worker pool — the pattern to know

This comes up in almost every Go interview.

```go
func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {              // exits when jobs is closed
        results <- job * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)
    var wg sync.WaitGroup

    for w := 1; w <= 3; w++ {            // 3 workers
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    for j := 1; j <= 9; j++ { jobs <- j }
    close(jobs)                          // tells workers no more work is coming

    wg.Wait()                            // wait for workers
    close(results)                       // now safe to close

    for r := range results { fmt.Println(r) }
}
```

**Why this shape:** bounded concurrency (3 workers, not 9 goroutines), `close(jobs)` terminates the `range` loops, and `results` is closed only after all writers finish.

---

## 10. Other common patterns

```go
// Fan-out / fan-in: many workers read one channel, results merge into one

// Pipeline: each stage is a goroutine returning a channel
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums { out <- n }
    }()
    return out
}

// Semaphore: limit concurrency with a buffered channel
sem := make(chan struct{}, 10)     // max 10 at once
for _, task := range tasks {
    sem <- struct{}{}              // acquire
    go func(t Task) {
        defer func() { <-sem }()   // release
        process(t)
    }(task)
}

// errgroup: WaitGroup + error propagation + cancellation
g, ctx := errgroup.WithContext(ctx)
for _, url := range urls {
    url := url
    g.Go(func() error { return fetch(ctx, url) })
}
if err := g.Wait(); err != nil { return err }
```

`struct{}` is used as the semaphore element because it occupies **zero bytes**.

---

## 11. Goroutine leaks

**Definition:** A goroutine blocked forever on a channel that will never receive. It is never garbage collected, so memory grows steadily.

```go
// ❌ Leaks if nobody reads ch
func leak() {
    ch := make(chan int)
    go func() { ch <- expensive() }()    // blocks forever if the caller returns
}

// ✅ Buffered channel, or context cancellation
func noLeak(ctx context.Context) {
    ch := make(chan int, 1)              // send never blocks
    go func() { ch <- expensive() }()
    select {
    case v := <-ch:
        use(v)
    case <-ctx.Done():
        return                           // the goroutine can still finish and exit
    }
}
```

**Detecting them:** `runtime.NumGoroutine()` climbing over time, or `pprof` at `/debug/pprof/goroutine`.

**The rule:** whenever you start a goroutine, know exactly how it will **exit**.

---

## Key points

- Goroutines start at ~2 KB and are scheduled by the Go runtime, not the OS — millions are practical.
- **Channels synchronise and communicate**; unbuffered sends block until a receiver is ready.
- **The sender closes the channel.** Sending on a closed channel panics.
- `select` picks a ready case at random; `default` makes it non-blocking; `time.After` gives timeouts.
- `WaitGroup` waits for goroutines — `Add` before starting, `defer Done` inside.
- Guard shared state with a **Mutex**, and always `defer Unlock`.
- **Context** carries cancellation — first parameter, always `defer cancel()`.
- Know the **loop variable trap** and that Go 1.22 fixed it.
- Run tests with **`-race`**.
- Every goroutine you start must have a guaranteed exit, or it leaks.
