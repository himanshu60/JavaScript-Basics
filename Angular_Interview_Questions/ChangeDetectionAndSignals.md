# Change Detection and Signals — Before and After

This is the most important Angular topic today, because it explains **why signals exist**. You cannot understand signals without first understanding what Angular did before them.

---

# PART 1 — How it worked BEFORE signals

## 1. What is Change Detection?

**Definition:** Change detection is the process Angular uses to check whether component data has changed, and to update the DOM to match.

**The core problem:** JavaScript objects do not announce when they change. If you write `this.count = 5`, nothing notifies the framework. So Angular needs some way to know *when* to look.

---

## 2. What is Zone.js?

**Definition:** Zone.js is a library that **monkey-patches** every asynchronous browser API — `setTimeout`, `addEventListener`, `fetch`, `XMLHttpRequest`, `Promise` — so it can tell Angular whenever any async operation completes.

**In simple words:** Zone.js taps every door in the building. Whenever anything happens anywhere, it rings a bell, and Angular re-checks the entire application to see if anything looks different.

```ts
// You write this
setTimeout(() => { this.count = 5; }, 1000);

// Zone.js has replaced setTimeout with its own version that does roughly:
// 1. run your callback
// 2. tell Angular "something async finished"
// 3. Angular runs change detection over the component tree
```

**The flow before signals:**

```
Any async event (click, timer, HTTP response)
        ↓
Zone.js notices it
        ↓
Angular runs change detection
        ↓
Walks the ENTIRE component tree from the root
        ↓
For each component, compares every template binding
        ↓
Updates the DOM where a value differs
```

---

## 3. Why that approach is wasteful

**Definition:** Zone.js knows that *something* happened, but not *what* changed. So Angular has to check **everything**, every time.

```ts
@Component({
  template: `{{ user.name }}`            // only this depends on user
})
export class ProfileComponent {
  user = { name: "Amit" };
}
```

If a completely unrelated `setTimeout` fires somewhere else in the app, Angular still re-checks this component's bindings — even though nothing here could possibly have changed.

**The consequences:**

| Problem | Effect |
|---|---|
| Whole-tree checking | Every binding in every component re-evaluated |
| Runs on **any** async event | Even a mouse move can trigger a full pass |
| Zone.js bundle cost | ~13 KB, loaded before your app |
| Patches everything | Some libraries break or behave oddly inside zones |
| Hard to debug | "Why did this render?" has no clear answer |
| `ExpressionChangedAfterItHasBeenCheckedError` | A notorious Angular-only error caused by this model |

---

## 4. The old optimisation — `OnPush`

**Definition:** `ChangeDetectionStrategy.OnPush` tells Angular to skip a component unless one of four things happens: an `@Input` **reference** changes, an event fires inside it, an `async` pipe emits, or change detection is triggered manually.

```ts
@Component({
  selector: "app-user",
  changeDetection: ChangeDetectionStrategy.OnPush,    // opt into the faster path
  template: `{{ user.name }}`,
})
export class UserComponent {
  @Input() user!: User;
}
```

**The catch — it compares references, not contents:**

```ts
// ❌ Mutation - the reference is unchanged, so OnPush does NOT update
this.user.name = "Priya";

// ✅ New reference - OnPush sees the change
this.user = { ...this.user, name: "Priya" };
```

This is why Angular codebases became full of immutable updates and manual `ChangeDetectorRef` calls:

```ts
constructor(private cdr: ChangeDetectorRef) {}

updateLater() {
  someCallback(() => {
    this.data = newData;
    this.cdr.markForCheck();      // "please check me on the next pass"
  });
}
```

**`OnPush` helped, but it was opt-in, easy to get wrong, and still worked at component granularity** — never at the level of an individual value.

---

# PART 2 — Signals

## 5. What is a Signal?

**Definition:** A signal is a **wrapper around a value that notifies interested consumers when that value changes**. It is a getter function you call to read the value, and Angular records exactly who read it.

**In simple words:** Instead of Angular asking "did anything change?" over and over, the value itself raises its hand and says "I changed, and here is exactly who depends on me."

```ts
import { signal, computed, effect } from "@angular/core";

const count = signal(0);        // create

count();                        // READ - call it like a function → 0
count.set(5);                   // write a new value
count.update((c) => c + 1);     // derive from the current value → 6
```

---

## 6. The three building blocks

### `signal()` — writable state

```ts
export class CounterComponent {
  count = signal(0);

  increment() {
    this.count.update((c) => c + 1);
  }
}
```

```html
<!-- Reading it in a template - note the () -->
<p>Count: {{ count() }}</p>
<button (click)="increment()">+</button>
```

### `computed()` — derived state

**Definition:** A read-only signal calculated from other signals. It recalculates **only when one of its dependencies actually changes**, and it caches the result (this is called *memoization* / lazy evaluation).

```ts
firstName = signal("Amit");
lastName = signal("Kumar");

fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

// fullName() recomputes ONLY if firstName or lastName changes
```

Angular builds a **dependency graph** automatically by tracking which signals were read during the computation. You never declare dependencies manually — unlike React's `useMemo` dependency array.

```ts
// A computed that depends on a computed - still only recalculates what's needed
total = computed(() => this.price() * this.quantity());
withTax = computed(() => this.total() * 1.18);
```

### `effect()` — side effects

**Definition:** Runs a function whenever any signal it reads changes. Use it for side effects — logging, syncing to `localStorage`, calling a non-signal API. **Not** for computing values (use `computed`) and not for updating other signals.

```ts
constructor() {
  effect(() => {
    console.log("Count is now", this.count());
    localStorage.setItem("count", String(this.count()));
  });
}
```

---

## 7. What changed — the whole point

**Definition:** Signals give Angular **fine-grained reactivity**. Angular now knows exactly which template bindings depend on which values, so it can update only those — instead of re-checking the tree.

```
BEFORE (Zone.js)                     AFTER (Signals)
any async event                      count.set(5)
      ↓                                    ↓
check the ENTIRE tree                update ONLY the bindings
      ↓                              that read count()
update what differs
```

| | Zone.js model | Signals model |
|---|---|---|
| Trigger | Any async event | A specific value changing |
| Granularity | Whole component tree | Individual binding |
| Angular knows what changed | ❌ No | ✅ **Yes** |
| Needs Zone.js | ✅ | ❌ (enables zoneless) |
| Dependencies declared | — | **Tracked automatically** |
| Bundle cost | +13 KB Zone.js | None |

**The main role of signals, in one sentence:** *they let Angular know precisely what changed, so it can stop guessing — which makes rendering faster and lets Angular drop Zone.js entirely.*

---

## 8. Signal-based inputs and outputs

**Definition:** Modern Angular replaces the `@Input()` and `@Output()` decorators with signal-based functions, so inputs are reactive values you can use in `computed()` directly.

```ts
// OLD - decorator based
export class UserComponent {
  @Input() name!: string;
  @Input({ required: true }) id!: number;
  @Output() saved = new EventEmitter<User>();

  // Reacting to an input change needed a lifecycle hook
  ngOnChanges(changes: SimpleChanges) {
    if (changes["name"]) { /* ... */ }
  }
}

// NEW - signal based
export class UserComponent {
  name = input<string>();                   // optional → Signal<string|undefined>
  id = input.required<number>();            // required
  age = input(0, { transform: numberAttribute });

  saved = output<User>();                   // replaces @Output + EventEmitter

  // Reacting is just a computed - no lifecycle hook needed
  greeting = computed(() => `Hello ${this.name()}`);

  save() { this.saved.emit(this.user); }
}
```

**`model()` — two-way binding:**

```ts
export class CounterComponent {
  value = model(0);                  // creates a writable signal input

  increment() { this.value.update(v => v + 1); }
}
```
```html
<app-counter [(value)]="count" />    <!-- banana-in-a-box still works -->
```

**Querying children:**

```ts
// OLD
@ViewChild("input") inputRef!: ElementRef;
@ViewChildren(ItemComponent) items!: QueryList<ItemComponent>;

// NEW - signal queries
inputRef = viewChild<ElementRef>("input");
items = viewChildren(ItemComponent);
```

---

## 9. Going zoneless

**Definition:** Because signals tell Angular exactly what changed, Zone.js becomes unnecessary. Zoneless Angular removes the 13 KB library and the whole-tree checking model.

```ts
// main.ts
bootstrapApplication(AppComponent, {
  providers: [provideExperimentalZonelessChangeDetection()],
});
```

Then remove `zone.js` from the `polyfills` in `angular.json`.

**What you gain:** a smaller bundle, faster and more predictable change detection, better debugging, and easier interop with non-Angular libraries.

**What you must do:** all reactive state that drives the template has to be signals (or the `async` pipe). Plain mutable properties updated inside a `setTimeout` will no longer trigger an update.

> Zoneless has moved from experimental toward stable across recent versions. Check the current Angular docs for the exact status in your version — the API name has been changing as it stabilises.

---

## 10. Signals and RxJS — not a replacement

**Definition:** Signals handle **synchronous state**. RxJS handles **asynchronous event streams**. They solve different problems and are designed to work together.

| Use | Signals | RxJS |
|---|---|---|
| Component state | ✅ | Overkill |
| Derived values | ✅ `computed` | Possible but verbose |
| HTTP requests | ❌ | ✅ |
| Debounce, retry, switchMap | ❌ | ✅ |
| WebSocket streams | ❌ | ✅ |
| Cancellation | ❌ | ✅ |

**Interop in both directions:**

```ts
import { toSignal, toObservable } from "@angular/core/rxjs-interop";

// Observable → Signal (very common: use HTTP with signals)
users = toSignal(this.http.get<User[]>("/api/users"), { initialValue: [] });
// no async pipe, no manual subscription, unsubscribes automatically

// Signal → Observable (use RxJS operators on signal changes)
query = signal("");
results = toSignal(
  toObservable(this.query).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((q) => this.http.get<Result[]>(`/api/search?q=${q}`))
  ),
  { initialValue: [] }
);
```

That last example is the practical answer to *"how do you do debounced search with signals?"* — signal for the input, RxJS for the async pipeline, signal for the result.

---

## 11. Common signal mistakes

```ts
// 1. Forgetting the () in a template
{{ count }}       // ❌ prints the signal function itself
{{ count() }}     // ✅

// 2. Using effect() to compute a value
effect(() => { this.total = this.price() * this.qty(); });   // ❌
total = computed(() => this.price() * this.qty());           // ✅

// 3. Setting a signal inside an effect - causes loops
effect(() => { this.count.set(this.other() + 1); });         // ❌ avoid
// use computed, or linkedSignal if you need writable derived state

// 4. Mutating an object inside a signal
this.user().name = "New";                    // ❌ no notification
this.user.update(u => ({ ...u, name: "New" }));  // ✅ new reference

// 5. Expecting signals to be async
const c = signal(0);
c.set(5);
console.log(c());     // 5 immediately - signals are synchronous
```

---

## 12. Migration — what to say in an interview

**If asked "how would you migrate a component to signals?":**

1. Convert component state: `count = 0` → `count = signal(0)`
2. Convert derived values: getters → `computed()`
3. Convert `@Input()` → `input()`, `@Output()` → `output()`
4. Replace `ngOnChanges` reactions with `computed()`
5. Convert HTTP observables with `toSignal()`
6. Add `()` in templates
7. Keep RxJS for actual async streams
8. Once the whole app is signal-driven, consider zoneless

**It is incremental.** Signals, decorators and RxJS all work side by side — there is no big-bang rewrite required.

---

## Key points

- **Before signals:** Zone.js patched every async API and triggered a **whole-tree** change detection pass, because Angular had no idea *what* had changed.
- `OnPush` reduced the work but was opt-in, reference-based, and easy to get wrong.
- **A signal is a value that announces its own changes** and tracks who reads it.
- `signal()` = writable state · `computed()` = cached derived state · `effect()` = side effects.
- Dependencies are **tracked automatically** — no dependency arrays.
- **The main role of signals is fine-grained reactivity** — Angular updates only the bindings that actually depend on the changed value.
- That precision is what makes **zoneless Angular** possible.
- `input()`, `output()`, `model()`, `viewChild()` are the signal replacements for the old decorators.
- **Signals do not replace RxJS** — use signals for state, RxJS for async streams, and `toSignal`/`toObservable` to bridge them.

**Related:** [AngularVersions.md](AngularVersions.md) · [RxJSAndObservables.md](RxJSAndObservables.md) · [AngularBasics.md](AngularBasics.md)
