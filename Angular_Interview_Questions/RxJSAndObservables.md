# RxJS and Observables

RxJS is the part of Angular that most candidates are weakest on, and it is where interviews go deep.

---

## 1. What is an Observable?

**Definition:** An Observable is a **stream of values over time** that you can subscribe to. Unlike a Promise, it can emit many values, is lazy, and can be cancelled.

**In simple words:** A Promise is a single letter that arrives once. An Observable is a newspaper subscription — issues keep arriving until you cancel it.

```ts
import { Observable } from "rxjs";

const numbers$ = new Observable<number>((subscriber) => {
  subscriber.next(1);           // emit a value
  subscriber.next(2);
  subscriber.complete();        // stream finished

  return () => console.log("cleanup on unsubscribe");
});

const sub = numbers$.subscribe({
  next: (v) => console.log(v),
  error: (e) => console.error(e),
  complete: () => console.log("done"),
});

sub.unsubscribe();              // cancel
```

> The `$` suffix (`users$`) is the Angular convention for "this variable is an Observable".

---

## 2. Observable vs Promise

| | Promise | Observable |
|---|---|---|
| Values emitted | **One** | **Many** (0 to infinite) |
| Execution | **Eager** — runs on creation | **Lazy** — runs on subscribe |
| Cancellable | ❌ No | ✅ `unsubscribe()` |
| Operators | `.then` chains | 100+ (`map`, `filter`, `debounceTime`…) |
| Retry built in | ❌ | ✅ `retry()` |
| Native | ✅ | ❌ Needs RxJS |

**The laziness point interviewers check:**

```ts
// A Promise runs IMMEDIATELY, even without .then()
const p = new Promise((res) => { console.log("runs now"); res(1); });

// An Observable runs only WHEN SUBSCRIBED
const o$ = new Observable((s) => { console.log("not yet"); s.next(1); });
// nothing logged until:
o$.subscribe();
```

This is why `http.get()` alone sends no request — Angular's `HttpClient` returns a **cold** Observable, and the request only fires on `subscribe()` (or via the `async` pipe).

---

## 3. Cold vs Hot Observables

**Definition of Cold:** Each subscriber gets its **own independent execution**. HTTP calls are cold — two subscribers means two requests.

**Definition of Hot:** All subscribers **share** one execution. DOM events and Subjects are hot.

```ts
// ❌ Cold - this sends THREE separate HTTP requests
const users$ = this.http.get<User[]>("/api/users");
users$.subscribe();
users$.subscribe();
users$.subscribe();

// ✅ shareReplay makes it hot and caches the result
const users$ = this.http.get<User[]>("/api/users").pipe(shareReplay(1));
```

**This is a very common real bug** — using `| async` twice on the same cold observable in a template fires the request twice.

```html
<!-- ❌ two requests -->
<div *ngIf="users$ | async">{{ (users$ | async)?.length }}</div>

<!-- ✅ subscribe once, alias it -->
<div *ngIf="users$ | async as users">{{ users.length }}</div>
```

---

## 4. Subjects

**Definition:** A Subject is **both an Observable and an Observer** — you can subscribe to it *and* push values into it. It is how you create a stream you control.

| Type | Definition |
|---|---|
| **`Subject`** | No initial value. Subscribers only get values emitted **after** they subscribe |
| **`BehaviorSubject`** | Requires an initial value. New subscribers **immediately get the current value** |
| **`ReplaySubject(n)`** | Replays the last `n` values to new subscribers |
| **`AsyncSubject`** | Emits only the final value, and only on `complete()` |

```ts
const subject = new Subject<number>();
subject.subscribe((v) => console.log("A:", v));
subject.next(1);                      // A: 1
subject.subscribe((v) => console.log("B:", v));
subject.next(2);                      // A: 2, B: 2   ← B missed the 1

const behavior = new BehaviorSubject<number>(0);
behavior.subscribe((v) => console.log("A:", v));    // A: 0  ← gets it immediately
behavior.next(1);                                    // A: 1
behavior.subscribe((v) => console.log("B:", v));    // B: 1  ← gets the CURRENT value
```

**`BehaviorSubject` is the standard choice for shared state**, because a component subscribing late still gets the current value:

```ts
@Injectable({ providedIn: "root" })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();     // expose read-only

  login(user: User) { this.userSubject.next(user); }
}
```

> Always expose `.asObservable()`. If you expose the Subject itself, any component can call `.next()` and you lose control of who writes to your state.

---

## 5. The operators that actually matter

**Definition:** Operators are pure functions that transform a stream. You apply them with `.pipe()`.

### Transformation

```ts
map((user) => user.name)              // transform each value
tap((v) => console.log(v))            // side effect, doesn't change the stream
scan((acc, v) => acc + v, 0)          // like reduce, but emits each step
```

### Filtering

```ts
filter((n) => n > 5)
take(3)                               // first 3, then complete
takeUntil(this.destroy$)              // until another stream emits - unsubscribe pattern
debounceTime(300)                     // wait for a pause in emissions
distinctUntilChanged()                // ignore consecutive duplicates
```

### The four flattening operators — the classic question

**Definition:** These handle an Observable that produces another Observable (for example, a keystroke triggering an HTTP call). The difference is **what happens to the previous inner observable**.

| Operator | Behaviour | Use for |
|---|---|---|
| **`switchMap`** | **Cancels** the previous inner observable | **Search / autocomplete** |
| **`mergeMap`** | Runs all in **parallel**, order not guaranteed | Independent parallel requests |
| **`concatMap`** | Queues them, runs **in order**, one at a time | Ordered writes, sequential saves |
| **`exhaustMap`** | **Ignores** new ones while one is running | **Login buttons** — blocks double-submit |

```ts
// ✅ Search - cancel the previous request when the user types again
this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((query) => this.http.get<Result[]>(`/api/search?q=${query}`)),
).subscribe((results) => (this.results = results));
```

**Why `switchMap` and not `mergeMap` here:** without cancellation, a slow earlier request can resolve *after* a newer one and overwrite the correct results — the classic race condition.

```ts
// ✅ Login - exhaustMap ignores repeated clicks while the request is in flight
this.loginClicks$.pipe(
  exhaustMap(() => this.auth.login(credentials)),
).subscribe();
```

### Combination

```ts
combineLatest([a$, b$])        // emits when EITHER emits (after both have emitted once)
forkJoin([a$, b$])             // waits for ALL to complete - like Promise.all
merge(a$, b$)                  // interleaves emissions from both
startWith(initialValue)        // emit a value immediately on subscribe
withLatestFrom(other$)         // pair with the latest value of another stream
```

**`forkJoin` vs `combineLatest`** — another common question: `forkJoin` emits **once**, when every source has **completed** (good for parallel HTTP calls). `combineLatest` emits **every time any source emits** (good for combining live state like filters + page number).

### Error handling

```ts
this.http.get("/api/data").pipe(
  retry(3),                                    // retry 3 times on failure
  catchError((err) => {
    console.error(err);
    return of([]);                             // recover with a fallback value
    // or: return throwError(() => err);       // re-throw
  }),
);
```

> `catchError` **must return an Observable**. Returning `of([])` keeps the stream alive with a fallback; `throwError` propagates the failure.

---

## 6. Memory leaks — the number one RxJS bug

**Definition:** A manual `.subscribe()` that is never unsubscribed keeps running after the component is destroyed, holding references and causing repeated work.

```ts
// ❌ LEAK - this subscription outlives the component
ngOnInit() {
  this.service.data$.subscribe((d) => (this.data = d));
}
```

**Four fixes, best first:**

```ts
// 1. ✅ BEST - async pipe: Angular subscribes and unsubscribes for you
data$ = this.service.data$;
// template: {{ data$ | async }}

// 2. ✅ takeUntilDestroyed (Angular 16+)
constructor() {
  this.service.data$.pipe(takeUntilDestroyed()).subscribe();
}

// 3. ✅ The classic destroy$ pattern
private destroy$ = new Subject<void>();
ngOnInit() {
  this.service.data$.pipe(takeUntil(this.destroy$)).subscribe();
}
ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

// 4. ✅ Manual - fine for one, unmanageable for many
private sub = new Subscription();
ngOnDestroy() { this.sub.unsubscribe(); }
```

**When you do NOT need to unsubscribe:** streams that complete on their own — `HttpClient` calls (they complete after one emission), and anything with `take(1)` or `first()`.

> **Prefer the `async` pipe.** If a component has no `.subscribe()` calls at all, it cannot leak.

---

## 7. RxJS and Signals together

**Definition:** They are complementary, not competing. Signals hold synchronous state; RxJS handles asynchronous streams.

```ts
import { toSignal, toObservable } from "@angular/core/rxjs-interop";

// Observable → Signal (no async pipe, no manual subscription)
users = toSignal(this.http.get<User[]>("/api/users"), { initialValue: [] });

// Signal → Observable → back to Signal: debounced search
query = signal("");
results = toSignal(
  toObservable(this.query).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((q) => this.http.get<Result[]>(`/api/search?q=${q}`)),
  ),
  { initialValue: [] },
);
```

**The rule:** signals for state, RxJS for time-based and async operations. Anything involving debouncing, cancellation, retries or merging streams stays in RxJS.

---

## Key points

- An Observable is a **lazy, cancellable stream** of many values; a Promise is one eager value.
- `HttpClient` returns a **cold** observable — no subscribe, no request. Two subscribes, two requests.
- Use **`shareReplay(1)`** or `async as` to avoid duplicate requests.
- **`BehaviorSubject`** is the standard for shared state — new subscribers get the current value.
- Always expose `.asObservable()`, never the Subject itself.
- **`switchMap`** cancels (search), **`concatMap`** queues (ordered writes), **`mergeMap`** parallelises, **`exhaustMap`** ignores (login).
- `forkJoin` waits for completion (like `Promise.all`); `combineLatest` emits on every change.
- `catchError` **must return an Observable**.
- **Unsubscribe or leak** — prefer the `async` pipe, then `takeUntilDestroyed()`.
- Signals and RxJS work together via `toSignal` / `toObservable`.

**Related:** [ChangeDetectionAndSignals.md](ChangeDetectionAndSignals.md) · [FormsRoutingAndHttp.md](FormsRoutingAndHttp.md) · [Promises.md](../JavaScript_Interview_Questions/Promises.md)
