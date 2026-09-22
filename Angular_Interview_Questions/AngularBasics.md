# Angular Basics — Components, DI, Directives and Pipes

## 1. What is Angular?

**Definition:** Angular is a **complete frontend framework** built by Google, written in TypeScript. Unlike React (a UI library), Angular ships with routing, HTTP, forms, testing and dependency injection built in.

| | Angular | React |
|---|---|---|
| Type | **Framework** (opinionated) | Library (UI only) |
| Language | TypeScript (enforced) | JavaScript or TypeScript |
| Routing, HTTP, forms | **Built in** | Install separately |
| Structure | Prescribed | You decide |
| Templates | HTML files with Angular syntax | JSX inside JavaScript |
| Learning curve | Steeper (more concepts) | Gentler start |
| Best for | Large enterprise apps, big teams | Anything, especially fast iteration |

**The trade-off:** Angular gives you one obvious way to do things, which makes large codebases consistent. React gives you freedom, which means every team's codebase looks different.

---

## 2. Components

**Definition:** A component is the basic building block — a TypeScript class with a `@Component` decorator, controlling a piece of the screen through its template.

```ts
@Component({
  selector: "app-user",                      // how it is used: <app-user />
  imports: [CommonModule],                   // standalone dependencies
  template: `<h1>{{ name }}</h1>`,           // inline, or templateUrl
  styles: [`h1 { color: blue; }`],           // inline, or styleUrls
})
export class UserComponent {
  name = "Amit";
}
```

**Definition of a Decorator:** A TypeScript feature (`@Something`) that attaches metadata to a class. `@Component` tells Angular "this class is a component, here is its selector and template".

**View encapsulation:** by default, styles are **scoped to the component** — Angular adds unique attributes to the elements so your CSS cannot leak out. This is built in, unlike React where you reach for CSS modules or styled-components.

---

## 3. Data binding — the four types

**Definition:** Data binding connects the component class to the template.

```html
<!-- 1. Interpolation - class → template -->
<p>{{ user.name }}</p>

<!-- 2. Property binding - class → template (any DOM property) -->
<img [src]="imageUrl" [alt]="description">
<button [disabled]="isLoading">Save</button>

<!-- 3. Event binding - template → class -->
<button (click)="save()">Save</button>
<input (input)="onType($event)">

<!-- 4. Two-way binding - both directions -->
<input [(ngModel)]="name">
```

**Definition of "banana in a box" `[()]`:** The `[(ngModel)]` syntax is shorthand for a property binding **plus** an event binding:

```html
<input [ngModel]="name" (ngModelChange)="name = $event">
<!-- is exactly the same as -->
<input [(ngModel)]="name">
```

You can make any component two-way bindable by pairing an input with an output named `<input>Change` — or, in modern Angular, using `model()`.

---

## 4. Dependency Injection

**Definition:** DI is a pattern where a class receives the objects it needs from the outside instead of creating them itself. Angular has a built-in **hierarchical injector** that supplies these dependencies.

**Why it matters:** the class does not know how its dependencies are built, so you can swap a real service for a mock in tests without touching the class.

```ts
@Injectable({ providedIn: "root" })          // a singleton for the whole app
export class UserService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get<User[]>("/api/users");
  }
}

// Consuming it
export class UserComponent {
  private userService = inject(UserService);        // modern
  // constructor(private userService: UserService) {}  // classic - both work
}
```

**Definition of `providedIn: "root"`:** Registers the service once for the entire application (a singleton) **and** makes it tree-shakable — if nothing injects it, it is removed from the bundle.

**Hierarchical injection:** Angular looks for a provider on the component, then its parent, then up to the root. Providing a service at component level gives **each instance its own copy**:

```ts
@Component({
  providers: [CartService],      // a NEW CartService per component instance
})
```

**Injection tokens** — for values that are not classes:

```ts
export const API_URL = new InjectionToken<string>("apiUrl");

bootstrapApplication(AppComponent, {
  providers: [{ provide: API_URL, useValue: "https://api.example.com" }],
});

const apiUrl = inject(API_URL);
```

---

## 5. Lifecycle hooks

**Definition:** Methods Angular calls at specific points in a component's life.

| Hook | When it runs | Typical use |
|---|---|---|
| `ngOnChanges` | An `@Input` changes (before `ngOnInit`) | React to input changes |
| **`ngOnInit`** | Once, after the first `ngOnChanges` | **Initial data fetching** |
| `ngDoCheck` | Every change detection run | Custom detection (use sparingly) |
| `ngAfterContentInit` | Projected content initialised | Access `@ContentChild` |
| `ngAfterViewInit` | The view and child views are ready | Access `@ViewChild`, DOM measurement |
| **`ngOnDestroy`** | Just before the component is destroyed | **Cleanup — unsubscribe, clear timers** |

```ts
export class UserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.service.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => (this.users = users));
  }

  ngOnDestroy() {
    this.destroy$.next();      // the classic unsubscribe pattern
    this.destroy$.complete();
  }
}
```

> Modern Angular replaces that pattern with `takeUntilDestroyed()`, and replaces `ngOnChanges` reactions with `computed()` over signal inputs.

**Why the constructor is not `ngOnInit`:** the constructor runs before Angular has set the `@Input` values, so inputs are `undefined` there. Do dependency injection in the constructor and initialisation in `ngOnInit`.

---

## 6. Directives

**Definition:** A directive adds behaviour to an existing element. There are three kinds.

### Component directives
A component **is** a directive with a template. That is the whole difference.

### Structural directives — change the DOM structure

**Definition:** Prefixed with `*`, they add or remove elements from the DOM. Replaced by the new control flow in v17+.

```html
<div *ngIf="isVisible">Shown conditionally</div>
<li *ngFor="let item of items; trackBy: trackById">{{ item.name }}</li>
```

> `*ngIf` **removes the element from the DOM**. `[hidden]` only hides it with CSS — the component still exists and still runs. This distinction gets asked.

### Attribute directives — change appearance or behaviour

```html
<div [ngClass]="{ active: isActive, disabled: isDisabled }"></div>
<div [ngStyle]="{ color: textColor, 'font-size.px': size }"></div>
```

**A custom attribute directive:**

```ts
@Directive({ selector: "[appHighlight]" })
export class HighlightDirective {
  private el = inject(ElementRef);

  @Input() appHighlight = "yellow";

  @HostListener("mouseenter") onEnter() {
    this.el.nativeElement.style.backgroundColor = this.appHighlight;
  }

  @HostListener("mouseleave") onLeave() {
    this.el.nativeElement.style.backgroundColor = "";
  }
}
```
```html
<p appHighlight="lightblue">Hover me</p>
```

---

## 7. Pipes

**Definition:** A pipe transforms a value **for display** in a template, using the `|` syntax. It does not change the underlying data.

```html
{{ name | uppercase }}
{{ price | currency:'INR' }}
{{ date | date:'dd/MM/yyyy' }}
{{ obj | json }}
{{ items | slice:0:5 }}
{{ value | async }}                      <!-- unwraps an Observable/Promise -->
{{ text | uppercase | slice:0:10 }}      <!-- chained -->
```

**Definition of the `async` pipe:** Subscribes to an Observable, returns its latest value, and **unsubscribes automatically** when the component is destroyed. It is the safest way to consume observables in a template.

```html
<div *ngIf="users$ | async as users">
  <p *ngFor="let user of users">{{ user.name }}</p>
</div>
```

**Custom pipe:**

```ts
@Pipe({ name: "truncate" })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 20): string {
    return value.length > limit ? value.slice(0, limit) + "..." : value;
  }
}
```
```html
{{ description | truncate:50 }}
```

**Pure vs impure pipes:**

**Definition of a Pure pipe (default):** Only re-runs when its input **reference** changes. Fast.
**Definition of an Impure pipe:** Re-runs on **every change detection cycle**. Slow — avoid unless genuinely necessary.

```ts
@Pipe({ name: "filter", pure: false })   // ⚠️ runs constantly
```

> A common interview trap: *"why doesn't my pipe update when I push to the array?"* — because `push` mutates and the reference is unchanged, so a pure pipe does not re-run. Create a new array instead.

---

## 8. Content projection

**Definition:** `<ng-content>` lets a component render content passed in from its parent — Angular's equivalent of React's `children`.

```ts
@Component({
  selector: "app-card",
  template: `
    <div class="card">
      <div class="header"><ng-content select="[card-title]" /></div>
      <div class="body"><ng-content /></div>
    </div>`,
})
export class CardComponent {}
```
```html
<app-card>
  <h2 card-title>Title goes in the header slot</h2>
  <p>This goes in the default slot</p>
</app-card>
```

---

## 9. Component communication

```ts
// Parent → Child: inputs
@Input() user!: User;               // classic
user = input.required<User>();      // signal-based

// Child → Parent: outputs
@Output() saved = new EventEmitter<User>();   // classic
saved = output<User>();                        // signal-based

// Unrelated components: a shared service
@Injectable({ providedIn: "root" })
export class MessageService {
  private messageSource = new BehaviorSubject<string>("");
  message$ = this.messageSource.asObservable();

  send(msg: string) { this.messageSource.next(msg); }
}
```

```html
<app-child [user]="currentUser" (saved)="onSave($event)" />
```

---

## Key points

- Angular is a **full framework**; routing, HTTP, forms and DI are built in.
- A **component** is a class with `@Component`, a template and scoped styles.
- Four bindings: interpolation, `[property]`, `(event)`, `[(two-way)]`.
- `[(ngModel)]` is just a property binding plus a `Change` event binding.
- **DI** is hierarchical; `providedIn: "root"` gives a tree-shakable singleton.
- Use the **constructor for injection** and **`ngOnInit` for initialisation** — inputs are undefined in the constructor.
- **`ngOnDestroy` is where you unsubscribe** (or use `takeUntilDestroyed`).
- `*ngIf` removes the element; `[hidden]` only hides it.
- The **`async` pipe** subscribes and unsubscribes for you — prefer it over manual subscriptions.
- **Pure pipes** only re-run when the input reference changes; impure pipes run constantly.

**Related:** [ChangeDetectionAndSignals.md](ChangeDetectionAndSignals.md) · [RxJSAndObservables.md](RxJSAndObservables.md) · [FormsRoutingAndHttp.md](FormsRoutingAndHttp.md)
