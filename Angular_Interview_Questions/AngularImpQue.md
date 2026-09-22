# Angular Interview Questions and Answers

## Fundamentals

## 1. What is Angular and how does it differ from React?

Angular is a **complete framework** from Google, written in TypeScript, with routing, HTTP, forms, DI and testing built in. React is a **UI library** — you add everything else yourself. Angular is opinionated (one obvious way to do things, good for large teams); React is flexible.

## 2. What is the difference between AngularJS and Angular?

They are **different frameworks**. AngularJS (1.x) was JavaScript-based with `$scope`, controllers and a digest cycle. Angular (2+, 2016) is a **complete rewrite** in TypeScript with a component architecture. Only the name is shared.

## 3. Why is there no Angular 3?

The router package had already reached version 3 while the core was at 2. To align every package on one version number, the team skipped 3 and released Angular 4.

## 4. What is a component?

A TypeScript class with a `@Component` decorator that controls a section of the screen through its template. It has a selector, a template, and component-scoped styles.

## 5. What is a decorator?

A TypeScript feature (`@Something`) that attaches metadata to a class, property or method. `@Component`, `@Injectable`, `@Input` and `@Output` tell Angular how to treat that class or member.

## 6. What are the types of data binding?

**Interpolation** `{{ }}` (class→template), **property binding** `[prop]` (class→template), **event binding** `(event)` (template→class), and **two-way binding** `[(ngModel)]`.

## 7. What does `[(ngModel)]` actually do?

It is shorthand for a property binding plus an event binding: `[ngModel]="x" (ngModelChange)="x = $event"`. The `[()]` "banana in a box" syntax works on any input/output pair named `x` and `xChange`.

## 8. Difference between `*ngIf` and `[hidden]`?

`*ngIf` **removes the element from the DOM** — the component is destroyed and its lifecycle hooks run. `[hidden]` only applies `display: none`, so the component still exists and still runs change detection.

## 9. What are the types of directives?

**Components** (a directive with a template), **structural directives** (`*ngIf`, `*ngFor` — change the DOM structure), and **attribute directives** (`ngClass`, `ngStyle` — change appearance or behaviour).

## 10. What is a pipe and what is the difference between pure and impure?

A pipe transforms a value for display (`{{ price | currency }}`). A **pure** pipe (default) only re-runs when its input **reference** changes. An **impure** pipe re-runs on **every change detection cycle** — slow, and usually a mistake.

## 11. Why doesn't my pipe update when I push to an array?

Because `push` mutates the array without changing its reference, and pure pipes only re-run on reference change. Create a new array instead: `this.items = [...this.items, newItem]`.

## 12. What is the `async` pipe?

It subscribes to an Observable, returns the latest value, and **unsubscribes automatically** when the component is destroyed. It is the safest way to consume observables and the best defence against memory leaks.

## 13. What is content projection?

`<ng-content>` renders content passed in from the parent — Angular's equivalent of React's `children`. `<ng-content select="[header]">` creates named slots.

---

## Dependency Injection

## 14. What is Dependency Injection?

A pattern where a class receives its dependencies from outside instead of creating them. Angular's **hierarchical injector** supplies them, which makes classes testable — you can swap a real service for a mock without changing the class.

## 15. What does `providedIn: "root"` do?

Registers the service as an application-wide **singleton** and makes it **tree-shakable** — if nothing injects it, it is removed from the bundle.

## 16. How do you get a new instance of a service per component?

Add it to the component's own `providers: [MyService]` array. Angular's injector is hierarchical, so each component instance gets its own copy instead of the root singleton.

## 17. What is `inject()` and how does it differ from constructor injection?

`inject()` (v14+) retrieves a dependency without constructor parameters, so it works in field initialisers, functional guards and interceptors. Both approaches work; `inject()` is the modern style.

---

## Lifecycle

## 18. What are the lifecycle hooks in order?

`ngOnChanges` → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterContentChecked` → `ngAfterViewInit` → `ngAfterViewChecked` → `ngOnDestroy`.

## 19. Why not put initialisation in the constructor instead of `ngOnInit`?

The constructor runs **before Angular sets the `@Input` values**, so inputs are `undefined` there. Use the constructor for dependency injection and `ngOnInit` for initialisation that depends on inputs.

## 20. What is `ngOnDestroy` for?

Cleanup — unsubscribing from observables, clearing timers, removing event listeners. Skipping it is the most common cause of memory leaks in Angular.

## 21. What is `ngAfterViewInit` used for?

Accessing `@ViewChild` references and doing DOM measurement, because the view and its children are only guaranteed to exist at that point.

---

## Change Detection and Signals

## 22. How did change detection work before signals?

**Zone.js monkey-patches every async browser API** (`setTimeout`, events, HTTP). When any async operation completes, Zone.js notifies Angular, which then walks the **entire component tree** re-evaluating every binding — because it has no idea *what* changed.

## 23. What is the problem with the Zone.js approach?

It checks everything on every async event, even when nothing relevant changed. It adds ~13 KB, patches globals in ways that break some libraries, makes "why did this render?" hard to answer, and causes the `ExpressionChangedAfterItHasBeenCheckedError`.

## 24. What is `ChangeDetectionStrategy.OnPush`?

An opt-in strategy that skips a component unless an `@Input` **reference** changes, an event fires inside it, an `async` pipe emits, or you call `markForCheck()`. It reduced the work, but it is reference-based and easy to get wrong.

## 25. What is a signal?

A **wrapper around a value that notifies consumers when it changes**. You read it by calling it (`count()`) and Angular records exactly which bindings read it, building a dependency graph automatically.

## 26. What is the main role of signals?

**Fine-grained reactivity.** Angular now knows precisely which bindings depend on which values, so it can update only those instead of re-checking the tree. That precision is what makes **zoneless Angular** possible.

## 27. What are `signal`, `computed` and `effect`?

`signal()` holds writable state. `computed()` derives a cached read-only value that recalculates only when a dependency changes. `effect()` runs side effects whenever a signal it reads changes.

## 28. How does `computed()` know its dependencies?

Angular **tracks which signals are read** during the computation at runtime, automatically. Unlike React's `useMemo`, there is no dependency array to declare or forget.

## 29. When should you use `effect()` and when not?

Use it for side effects — logging, `localStorage`, calling non-signal APIs. **Do not** use it to compute a value (use `computed`) or to set other signals, which causes loops.

## 30. Do signals replace RxJS?

No. **Signals handle synchronous state; RxJS handles asynchronous streams.** Anything involving debouncing, cancellation, retries or merging stays in RxJS. Bridge them with `toSignal()` and `toObservable()`.

## 31. What is zoneless Angular?

Running without Zone.js, enabled with `provideExperimentalZonelessChangeDetection()`. It removes the 13 KB library and the whole-tree checking. It requires that reactive state driving the template uses signals or the `async` pipe.

## 32. What are `input()`, `output()` and `model()`?

Signal-based replacements for the decorators. `input()` / `input.required()` replace `@Input()`, `output()` replaces `@Output()` + `EventEmitter`, and `model()` creates a writable signal for two-way binding.

---

## RxJS

## 33. Difference between an Observable and a Promise?

A Promise emits **one** value, runs **eagerly** on creation, and cannot be cancelled. An Observable emits **many** values over time, is **lazy** (runs only on subscribe), can be cancelled with `unsubscribe()`, and has 100+ operators.

## 34. What are cold and hot observables?

**Cold**: each subscriber gets its own execution — `HttpClient` calls are cold, so subscribing twice sends two requests. **Hot**: all subscribers share one execution — DOM events and Subjects. `shareReplay(1)` converts cold to hot.

## 35. Why does my HTTP request fire twice?

Because `HttpClient` returns a cold observable and you used `| async` twice on it. Fix it with `*ngIf="data$ | async as data"` to subscribe once, or `shareReplay(1)`.

## 36. Difference between `Subject` and `BehaviorSubject`?

A `Subject` has no initial value and subscribers only receive values emitted **after** they subscribe. A `BehaviorSubject` requires an initial value and immediately gives new subscribers the **current** value — which is why it is the standard choice for shared state.

## 37. Difference between `switchMap`, `mergeMap`, `concatMap` and `exhaustMap`?

**`switchMap`** cancels the previous inner observable (search/autocomplete). **`mergeMap`** runs all in parallel, order not guaranteed. **`concatMap`** queues them in order. **`exhaustMap`** ignores new ones while one is running (login buttons — blocks double-submit).

## 38. Why is `switchMap` the right choice for a search box?

Without cancellation, a slow earlier request can resolve **after** a newer one and overwrite the correct results — a race condition. `switchMap` cancels the previous request whenever a new one starts.

## 39. Difference between `forkJoin` and `combineLatest`?

`forkJoin` emits **once**, when every source **completes** — like `Promise.all`, good for parallel HTTP calls. `combineLatest` emits **every time any source emits** — good for combining live state such as filters plus page number.

## 40. How do you avoid memory leaks with observables?

Best: use the **`async` pipe** so Angular manages the subscription. Otherwise `takeUntilDestroyed()` (v16+), or the classic `destroy$` Subject with `takeUntil`. HTTP calls complete on their own, so they do not need unsubscribing.

## 41. What must `catchError` return?

**An Observable.** Return `of(fallbackValue)` to recover and keep the stream alive, or `throwError(() => err)` to propagate the failure.

---

## Forms

## 42. Template-driven vs reactive forms?

**Template-driven** defines the form in the template with `ngModel` — simple, but hard to test and to make dynamic. **Reactive** defines it in the class as a `FormGroup` — explicit, synchronous, typed and testable. Use reactive for anything non-trivial.

## 43. What are `FormControl`, `FormGroup` and `FormArray`?

`FormControl` is one input's value and validation state. `FormGroup` is a fixed collection (an object shape). `FormArray` is a **dynamic** list you can add to and remove from at runtime.

## 44. How do you write a custom validator?

A function taking an `AbstractControl` that returns **`null` when valid** and an error object when invalid. Cross-field validators go on the **FormGroup**, not the control. Async validators return an Observable.

## 45. Difference between `touched`, `dirty` and `pristine`?

`touched` means the field has been **blurred**. `dirty` means its value has been **changed**. `pristine` is the opposite of dirty. Show validation errors on `invalid && touched` so fields are not red before the user types.

---

## Routing

## 46. How do you read a route parameter, and what is the snapshot trap?

Use `route.paramMap` as an Observable. The **snapshot** reads the value once — but navigating from `/users/1` to `/users/2` **reuses the component**, so `ngOnInit` does not re-run and the snapshot goes stale.

## 47. What are route guards?

Functions controlling navigation: `CanActivate` (entering), `CanDeactivate` (leaving — unsaved changes), `CanActivateChild`, and `CanMatch` (before a lazy route matches). Since v15 they are plain functions, not classes.

## 48. What is a resolver and what is the downside?

A resolver fetches data **before** the route activates, so the component renders with data present. The downside is that **navigation is delayed** — the page appears frozen. Use it only for critical data.

## 49. How do you lazy load in Angular?

`loadComponent` for a single standalone component, `loadChildren` for a group of routes. Each becomes a separate chunk. Angular 17 also added `@defer` for **template-level** lazy loading.

## 50. Why must the `**` wildcard route be last?

Angular matches routes in order and takes the **first** match. A wildcard placed earlier would swallow every subsequent route.

---

## HTTP

## 51. Do you need to unsubscribe from `HttpClient` calls?

No — they emit once and then **complete**, which tears down the subscription automatically. You do need to unsubscribe from long-lived streams like Subjects and `valueChanges`.

## 52. How does `HttpClient` differ from `fetch`?

`HttpClient` returns a **cold Observable** (cancellable, retryable), parses JSON automatically, and **errors on 4xx/5xx**. `fetch` returns a Promise and does **not** reject on HTTP error status codes.

## 53. What is an HTTP interceptor?

A function that sits between your app and the server, able to modify every request and response — used for attaching auth tokens, logging and global error handling. Requests are **immutable**, so you must use `req.clone()`.

---

## Modern Angular

## 54. What are standalone components?

Components that declare their own dependencies in an `imports` array, with **no NgModule**. Introduced in v14, stable in v15, the **default from v19**. They remove Angular's biggest source of boilerplate and improve tree-shaking.

## 55. What is the new control flow syntax?

`@if`, `@for`, `@switch` (v17) replacing `*ngIf`, `*ngFor`, `[ngSwitch]`. They need no `CommonModule` import, make `track` **mandatory** in `@for`, add a built-in `@empty` block, give better type narrowing, and are significantly faster.

## 56. What is `@defer`?

Template-level lazy loading (v17). A block and its JavaScript load only when a trigger fires — `on viewport`, `on interaction`, `on hover`, `on timer`, `when condition` — with built-in `@placeholder`, `@loading` and `@error` blocks.

## 57. What is Ivy?

Angular's rendering engine, default since v9. It produces much smaller bundles through better tree-shaking, compiles faster, and gives far more readable error messages.

## 58. What is AOT compilation?

**Ahead-of-Time** compilation converts templates to JavaScript at **build** time rather than in the browser. It gives faster startup, smaller bundles (the compiler is not shipped), and catches template errors at build time. It is the default for production builds.

## 59. What is `takeUntilDestroyed()`?

A v16+ operator that automatically unsubscribes when the component is destroyed, replacing the manual `destroy$` Subject pattern. Called in an injection context (typically the constructor).

## 60. How would you migrate an older Angular app to modern Angular?

Incrementally: convert components to **standalone** (there is a schematic for this), migrate templates to the new **control flow** (also a schematic), replace class guards and interceptors with **functional** ones, adopt **signals** for component state, use `toSignal()` for HTTP, and only then consider **zoneless**. All the old and new APIs interoperate, so there is no big-bang rewrite.

---

**Related:** [AngularBasics.md](AngularBasics.md) · [ChangeDetectionAndSignals.md](ChangeDetectionAndSignals.md) · [RxJSAndObservables.md](RxJSAndObservables.md) · [FormsRoutingAndHttp.md](FormsRoutingAndHttp.md) · [AngularVersions.md](AngularVersions.md)
