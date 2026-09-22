# Angular Interview Questions

Covers both the **older Angular** you will find in existing codebases and the **modern Angular** interviewers ask about — signals, standalone components and the new control flow.

📄 **[AngularImpQue.md](AngularImpQue.md)** — all 60 questions with answers in one file.

---

## Topic files

| Topic | File | Covers |
|---|---|---|
| **Basics** | [AngularBasics.md](AngularBasics.md) | Components, decorators, data binding, DI, lifecycle hooks, directives, pipes, content projection |
| **Change Detection & Signals** | [ChangeDetectionAndSignals.md](ChangeDetectionAndSignals.md) | **How it worked before signals (Zone.js), why it was wasteful, OnPush, then signals, computed, effect, zoneless** |
| **RxJS & Observables** | [RxJSAndObservables.md](RxJSAndObservables.md) | Observable vs Promise, cold vs hot, Subjects, operators, switchMap family, memory leaks |
| **Forms, Routing & HTTP** | [FormsRoutingAndHttp.md](FormsRoutingAndHttp.md) | Template-driven vs reactive, validators, guards, resolvers, lazy loading, HttpClient, interceptors |
| **Versions — Old vs New** | [AngularVersions.md](AngularVersions.md) | AngularJS vs Angular, version timeline, NgModules→standalone, `*ngIf`→`@if`, Zone.js→signals, `@defer` |

---

## Start here — the signals question

The question you are most likely to get is some version of **"what are signals and why were they introduced?"**

The answer only makes sense if you can explain what came **before**:

| | Before signals (Zone.js) | With signals |
|---|---|---|
| Trigger | **Any** async event anywhere | A **specific value** changing |
| What Angular knows | "Something happened" | "**This** changed, and here is who depends on it" |
| What gets checked | The **entire** component tree | Only the affected bindings |
| Optimisation | `OnPush`, opt-in and reference-based | Automatic and fine-grained |
| Bundle | +13 KB Zone.js | None — enables **zoneless** |

**The one-sentence answer:** *signals let Angular know precisely what changed, so it stops guessing — which makes rendering faster and lets Angular drop Zone.js entirely.*

Full explanation with code: [ChangeDetectionAndSignals.md](ChangeDetectionAndSignals.md)

---

## Old vs new — quick reference

| Concept | Old | New |
|---|---|---|
| Component registration | `NgModule` | **Standalone** `imports` |
| Conditionals | `*ngIf` | `@if` |
| Loops | `*ngFor` + optional `trackBy` | `@for` + **required** `track` |
| State | Properties + Zone.js | **Signals** |
| Derived values | Getters | `computed()` |
| Inputs / Outputs | `@Input()` / `@Output()` | `input()` / `output()` |
| Two-way binding | Input + Output pair | `model()` |
| DI | Constructor params | `inject()` |
| Unsubscribing | `destroy$` + `takeUntil` | `takeUntilDestroyed()` |
| Guards / Interceptors | Classes | **Functions** |
| Lazy loading | `loadChildren` + module | `loadComponent` / `@defer` |

---

## All 60 questions ([AngularImpQue.md](AngularImpQue.md))

**Fundamentals (1–13)**
1. What is Angular and how does it differ from React?
2. Difference between AngularJS and Angular?
3. Why is there no Angular 3?
4. What is a component?
5. What is a decorator?
6. What are the types of data binding?
7. What does `[(ngModel)]` actually do?
8. Difference between `*ngIf` and `[hidden]`?
9. What are the types of directives?
10. What is a pipe, and pure vs impure?
11. Why doesn't my pipe update when I push to an array?
12. What is the `async` pipe?
13. What is content projection?

**Dependency Injection (14–17)**
14. What is Dependency Injection?
15. What does `providedIn: "root"` do?
16. How do you get a new instance of a service per component?
17. What is `inject()` and how does it differ from constructor injection?

**Lifecycle (18–21)**
18. What are the lifecycle hooks in order?
19. Why not initialise in the constructor instead of `ngOnInit`?
20. What is `ngOnDestroy` for?
21. What is `ngAfterViewInit` used for?

**Change Detection and Signals (22–32)**
22. How did change detection work before signals?
23. What is the problem with the Zone.js approach?
24. What is `ChangeDetectionStrategy.OnPush`?
25. What is a signal?
26. **What is the main role of signals?**
27. What are `signal`, `computed` and `effect`?
28. How does `computed()` know its dependencies?
29. When should you use `effect()` and when not?
30. Do signals replace RxJS?
31. What is zoneless Angular?
32. What are `input()`, `output()` and `model()`?

**RxJS (33–41)**
33. Difference between an Observable and a Promise?
34. What are cold and hot observables?
35. Why does my HTTP request fire twice?
36. Difference between `Subject` and `BehaviorSubject`?
37. Difference between `switchMap`, `mergeMap`, `concatMap` and `exhaustMap`?
38. Why is `switchMap` right for a search box?
39. Difference between `forkJoin` and `combineLatest`?
40. How do you avoid memory leaks with observables?
41. What must `catchError` return?

**Forms (42–45)**
42. Template-driven vs reactive forms?
43. What are `FormControl`, `FormGroup` and `FormArray`?
44. How do you write a custom validator?
45. Difference between `touched`, `dirty` and `pristine`?

**Routing (46–50)**
46. How do you read a route parameter, and what is the snapshot trap?
47. What are route guards?
48. What is a resolver and what is the downside?
49. How do you lazy load in Angular?
50. Why must the `**` wildcard route be last?

**HTTP (51–53)**
51. Do you need to unsubscribe from `HttpClient` calls?
52. How does `HttpClient` differ from `fetch`?
53. What is an HTTP interceptor?

**Modern Angular (54–60)**
54. What are standalone components?
55. What is the new control flow syntax?
56. What is `@defer`?
57. What is Ivy?
58. What is AOT compilation?
59. What is `takeUntilDestroyed()`?
60. How would you migrate an older Angular app to modern Angular?

---

## The answers that separate candidates

| Topic | What most people say | What lands |
|---|---|---|
| **Signals** | "Reactive state, like React state" | Explains **Zone.js whole-tree checking** and that signals give fine-grained reactivity → zoneless |
| **switchMap** | "It maps to another observable" | Names the **race condition** it prevents in search |
| **Cold observables** | — | "HTTP is cold, so two `async` pipes = two requests" |
| **OnPush** | "It makes it faster" | "It compares **references**, so mutation silently breaks it" |
| **Unsubscribing** | "Use ngOnDestroy" | "Prefer the `async` pipe — a component with no `.subscribe()` cannot leak" |
| **Snapshot vs paramMap** | — | "Navigating `/users/1` → `/users/2` reuses the component, so the snapshot goes stale" |
| **Migration** | "Rewrite in the new syntax" | "Incremental — old and new APIs interoperate, and there are schematics" |

---

## If your experience is on an older version

Say so, and show you know the direction of travel:

> "The project I worked on was Angular 14 — NgModules, `*ngIf`/`*ngFor`, RxJS for all state. I've since gone through what changed: standalone components remove the NgModule boilerplate, `@if`/`@for` are built into the compiler and make `track` mandatory, and signals replace Zone.js whole-tree change detection with fine-grained reactivity, which is what makes zoneless possible."

That is honest about what you used **and** demonstrates you understand what changed and why — which is what is actually being tested.

---

**Related:** [React vs Angular comparison](../React_Interview_Questions/) · [RxJS vs Promises](../JavaScript_Interview_Questions/Promises.md) · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
