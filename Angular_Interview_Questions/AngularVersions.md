# Angular Versions — Old vs New

Angular releases a major version roughly every **6 months**. Interviewers ask this to find out whether you have kept up, or whether your knowledge stopped at whatever version your last project used.

---

## 1. AngularJS vs Angular — a completely different framework

**Definition of AngularJS (1.x):** The original framework, released 2010. JavaScript-based, used `$scope`, controllers, and two-way data binding driven by a digest cycle.

**Definition of Angular (2+):** A **complete rewrite**, released 2016. TypeScript-based, component architecture, unidirectional data flow. It shares only the name.

| | AngularJS (1.x) | Angular (2+) |
|---|---|---|
| Language | JavaScript | **TypeScript** |
| Architecture | MVC, controllers + `$scope` | **Components** |
| Data binding | Two-way by default | One-way by default |
| Change detection | Digest cycle / dirty checking | Zone.js → now Signals |
| Mobile support | Poor | Designed for it |
| DI | Custom, string-based | Hierarchical, type-based |
| Status | End of life (2021) | Actively developed |

> **There is no "Angular 3".** The router package had already reached v3, so the team skipped it to align all package versions at 4.

---

## 2. Version timeline — what actually mattered

| Version | Year | The headline change |
|---|---|---|
| **2** | 2016 | Complete rewrite: TypeScript, components |
| 4 | 2017 | Smaller bundles, `*ngIf...else` |
| 5–7 | 2017–18 | Build optimisations, CLI improvements |
| **8** | 2019 | Differential loading, lazy-loading syntax with dynamic `import()` |
| **9** | 2020 | **Ivy renderer by default** — much smaller bundles, better debugging |
| 12 | 2021 | View Engine removed; Ivy only |
| **14** | 2022 | **Standalone components** (preview), **typed reactive forms**, `inject()` |
| **15** | 2022 | **Standalone APIs stable**, directive composition |
| **16** | 2023 | **Signals (preview)**, `takeUntilDestroyed`, required inputs, SSR hydration |
| **17** | 2023 | **New control flow** `@if`/`@for`/`@switch`, **`@defer`**, esbuild/Vite build, angular.dev |
| **18** | 2024 | **Zoneless (experimental)**, Material 3, unified control flow stable |
| **19** | 2024 | **Standalone by default**, incremental hydration, `linkedSignal`, `resource()` |
| **20** | 2025 | Signals APIs stabilising, further zoneless progress |

> Angular ships a major version every ~6 months (around May and November). Versions after 20 exist — check **angular.dev** for the current release rather than trusting any list, including this one.

---

## 3. The three changes that actually matter in interviews

### a) NgModules → Standalone components

**Definition of the old model:** Every component had to be declared in an `NgModule`, which listed its declarations, imports, providers and exports. This was Angular's biggest source of boilerplate and confusion.

```ts
// ❌ OLD - NgModule required
@NgModule({
  declarations: [AppComponent, UserComponent],
  imports: [BrowserModule, CommonModule, FormsModule, HttpClientModule],
  providers: [UserService],
  bootstrap: [AppComponent],
})
export class AppModule {}

@Component({ selector: "app-user", template: `...` })
export class UserComponent {}
```

**Definition of a Standalone component:** A component that declares its **own** dependencies via an `imports` array, with no NgModule at all.

```ts
// ✅ NEW - no module needed
@Component({
  selector: "app-user",
  standalone: true,                    // default from v19, so often omitted now
  imports: [CommonModule, RouterLink],  // this component's own dependencies
  template: `...`,
})
export class UserComponent {}
```

```ts
// Bootstrapping without AppModule
bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()],
});
```

**Why it is better:** dependencies are visible on the component itself, tree-shaking is more effective, lazy loading is simpler, and newcomers no longer have to learn NgModules before writing a component.

### b) `*ngIf` / `*ngFor` → the new control flow

**Definition:** Angular 17 introduced built-in template syntax that replaces the structural directives. It is faster, needs no imports, and has proper type narrowing.

```html
<!-- ❌ OLD - needs CommonModule imported -->
<div *ngIf="user; else loading">{{ user.name }}</div>
<ng-template #loading>Loading...</ng-template>

<li *ngFor="let item of items; trackBy: trackById">{{ item.name }}</li>

<div [ngSwitch]="status">
  <p *ngSwitchCase="'active'">Active</p>
  <p *ngSwitchDefault>Unknown</p>
</div>

<!-- ✅ NEW - built into the template compiler -->
@if (user) {
  <div>{{ user.name }}</div>
} @else {
  <div>Loading...</div>
}

@for (item of items; track item.id) {      <!-- track is REQUIRED -->
  <li>{{ item.name }}</li>
} @empty {
  <li>No items</li>                         <!-- built-in empty state -->
}

@switch (status) {
  @case ('active') { <p>Active</p> }
  @default { <p>Unknown</p> }
}
```

**Improvements worth naming:** `track` is mandatory (it was an easily-forgotten performance fix before), `@empty` is built in, no `CommonModule` import, better type narrowing inside the block, and up to ~90% faster list re-rendering.

### c) Zone.js → Signals

Covered fully in [ChangeDetectionAndSignals.md](ChangeDetectionAndSignals.md). The short version: Angular moved from "something changed somewhere, check everything" to "this specific value changed, update exactly what depends on it".

---

## 4. `@defer` — deferrable views

**Definition:** Template-level lazy loading, introduced in v17. A block of template (and its JavaScript) is only loaded when a condition is met.

```html
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div>Scroll to load the chart</div>
} @loading (minimum 500ms) {
  <app-spinner />
} @error {
  <p>Failed to load</p>
}
```

**Triggers:** `on idle` (default), `on viewport`, `on interaction`, `on hover`, `on timer(5s)`, `when condition`, plus `prefetch` variants.

This is genuinely unique — the equivalent in React requires `React.lazy`, `Suspense`, an error boundary and an IntersectionObserver written by hand.

---

## 5. Other modern APIs worth knowing

```ts
// inject() instead of constructor injection (v14+)
export class UserComponent {
  private http = inject(HttpClient);       // works in field initialisers
  private route = inject(ActivatedRoute);
}

// takeUntilDestroyed - no more manual destroy$ Subject (v16+)
export class MyComponent {
  constructor() {
    this.service.data$
      .pipe(takeUntilDestroyed())
      .subscribe();                         // auto-unsubscribes on destroy
  }
}

// Typed reactive forms (v14+)
form = new FormGroup({
  email: new FormControl("", { nonNullable: true }),   // FormControl<string>
});
this.form.value.email;    // typed, not "any"

// Functional route guards (v15+) - replaced class-based guards
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn() || inject(Router).createUrlTree(["/login"]);
};

// Functional HTTP interceptors (v15+)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

---

## 6. Old vs new — the comparison table

| Concept | Old way | New way |
|---|---|---|
| Component registration | `NgModule` declarations | **Standalone** `imports` |
| Bootstrapping | `platformBrowserDynamic().bootstrapModule` | `bootstrapApplication()` |
| Conditionals | `*ngIf` / `*ngSwitch` | `@if` / `@switch` |
| Loops | `*ngFor` with optional `trackBy` | `@for` with **required** `track` |
| State | Plain properties + Zone.js | **Signals** |
| Derived state | Getters (recomputed constantly) | `computed()` (cached) |
| Inputs | `@Input()` | `input()` / `input.required()` |
| Outputs | `@Output() new EventEmitter()` | `output()` |
| Two-way binding | `@Input` + `@Output` pair | `model()` |
| Template queries | `@ViewChild` | `viewChild()` |
| DI | Constructor parameters | `inject()` |
| Unsubscribing | `destroy$` Subject + `takeUntil` | `takeUntilDestroyed()` |
| Guards | Class implementing `CanActivate` | Functional `CanActivateFn` |
| Interceptors | Class implementing `HttpInterceptor` | Functional `HttpInterceptorFn` |
| Lazy loading | `loadChildren` with a module | `loadComponent` / `@defer` |
| Change detection | Zone.js whole-tree | Signals, heading to **zoneless** |
| Forms typing | `any` everywhere | Typed reactive forms |

---

## 7. How to talk about this in an interview

**If your experience is on an older version, say so and show you know the direction:**

> "The project I worked on was on Angular 14, so it was NgModule-based with `*ngIf` and `*ngFor`, and RxJS for all state. I've since looked at what changed — standalone components remove the NgModule boilerplate, the new `@if`/`@for` control flow is built in and makes `track` mandatory, and signals replace the Zone.js whole-tree change detection with fine-grained reactivity, which is what enables zoneless."

**That answer works because it is honest about what you used, and demonstrates you understand what changed and *why* — which is what they are actually testing.**

**What not to do:** claim experience with signals if you have only read about them. The follow-up ("how does `computed` know its dependencies?") is easy to ask and hard to bluff.

---

## Key points

- **AngularJS (1.x) and Angular (2+) are different frameworks** — a complete rewrite, not an upgrade.
- There is **no Angular 3** — the version was skipped to align packages.
- Major releases arrive roughly every **6 months**.
- **Ivy (v9)** made bundles smaller and debugging better.
- **Standalone components (v14–15, default in v19)** removed NgModule boilerplate.
- **New control flow (v17)** replaced `*ngIf`/`*ngFor`, and made `track` mandatory.
- **`@defer` (v17)** gives template-level lazy loading with built-in triggers.
- **Signals (v16+)** replace Zone.js whole-tree checking with fine-grained reactivity.
- **Zoneless** is the destination that signals make possible.
- Modern DI is `inject()`; guards and interceptors are now **functions**, not classes.

**Related:** [ChangeDetectionAndSignals.md](ChangeDetectionAndSignals.md) · [AngularBasics.md](AngularBasics.md) · [AngularImpQue.md](AngularImpQue.md)
