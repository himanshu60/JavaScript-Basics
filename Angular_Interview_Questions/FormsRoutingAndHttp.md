# Angular Forms, Routing and HTTP

---

# PART 1 — Forms

## 1. The two approaches

**Definition of Template-driven forms:** The form is defined in the **template** using `ngModel`. Angular builds the form model implicitly. Simple, but hard to test and validate dynamically.

**Definition of Reactive forms:** The form is defined in the **component class** as a `FormGroup`. Explicit, typed, testable, and the standard for anything non-trivial.

```ts
// TEMPLATE-DRIVEN - import FormsModule
@Component({
  imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f)">
      <input name="email" [(ngModel)]="email" required email #e="ngModel">
      @if (e.invalid && e.touched) { <span>Invalid email</span> }
      <button [disabled]="f.invalid">Submit</button>
    </form>`,
})
```

```ts
// REACTIVE - import ReactiveFormsModule
@Component({
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email">
      @if (email.invalid && email.touched) { <span>Invalid email</span> }
      <button [disabled]="form.invalid">Submit</button>
    </form>`,
})
export class SignupComponent {
  form = new FormGroup({
    email: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  get email() { return this.form.controls.email; }

  onSubmit() {
    if (this.form.invalid) return;
    console.log(this.form.value);      // fully typed
  }
}
```

| | Template-driven | Reactive |
|---|---|---|
| Form model | Implicit, in the template | **Explicit, in the class** |
| Data flow | Asynchronous | Synchronous |
| Testing | Hard (needs the DOM) | **Easy (plain objects)** |
| Dynamic fields | Difficult | **Straightforward** |
| Type safety | Weak | **Strong (v14+)** |
| Best for | Simple forms (login) | **Everything else** |

---

## 2. Form building blocks

| Class | Definition |
|---|---|
| **`FormControl`** | A single input's value, validation state and status |
| **`FormGroup`** | A fixed collection of controls — an object shape |
| **`FormArray`** | A **dynamic** list of controls — add/remove at runtime |
| **`FormBuilder`** | A service with shorthand syntax for building the above |

```ts
private fb = inject(FormBuilder);

form = this.fb.group({
  name: ["", Validators.required],
  address: this.fb.group({ city: [""], pin: [""] }),      // nested
  phones: this.fb.array([this.fb.control("")]),            // dynamic
});

get phones() { return this.form.get("phones") as FormArray; }

addPhone() { this.phones.push(this.fb.control("")); }
removePhone(i: number) { this.phones.removeAt(i); }
```

**Control state properties** — commonly asked:

| Property | Meaning |
|---|---|
| `valid` / `invalid` | Passes / fails validation |
| `pristine` / `dirty` | Value unchanged / changed by the user |
| `touched` / `untouched` | Has / has not been blurred |
| `pending` | An async validator is running |

> Show errors on `invalid && touched`, not just `invalid` — otherwise every field is red before the user types anything.

---

## 3. Custom validators

```ts
// Synchronous validator
export function noSpaces(control: AbstractControl): ValidationErrors | null {
  return control.value?.includes(" ") ? { noSpaces: true } : null;   // null = valid
}

// Cross-field validator - applied to the GROUP, not a control
export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get("password")?.value === group.get("confirm")?.value
    ? null
    : { mismatch: true };
}

form = this.fb.group({
  password: [""],
  confirm: [""],
}, { validators: passwordsMatch });

// Async validator - returns an Observable
export function uniqueEmail(http: HttpClient): AsyncValidatorFn {
  return (control) =>
    http.get<boolean>(`/api/check?email=${control.value}`).pipe(
      map((taken) => (taken ? { emailTaken: true } : null)),
      catchError(() => of(null)),
    );
}
```

**The convention:** return `null` when **valid**, and an error object when invalid. This inversion catches people out.

---

# PART 2 — Routing

## 4. Route configuration

```ts
export const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "users/:id", component: UserComponent },           // route parameter
  {
    path: "admin",
    canActivate: [authGuard],
    loadComponent: () => import("./admin.component").then((m) => m.AdminComponent),
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    children: [                                               // nested routes
      { path: "stats", component: StatsComponent },
    ],
  },
  { path: "old", redirectTo: "/new", pathMatch: "full" },
  { path: "**", component: NotFoundComponent },               // wildcard - MUST be last
];

bootstrapApplication(AppComponent, { providers: [provideRouter(routes)] });
```

```html
<a routerLink="/users/1" routerLinkActive="active">User 1</a>
<router-outlet />                    <!-- where the matched component renders -->
```

> **Route order matters.** Angular takes the **first** match, so the `**` wildcard must always be last.

## 5. Reading route data

```ts
export class UserComponent {
  private route = inject(ActivatedRoute);

  // ✅ Observable - updates when the param changes without remounting
  user$ = this.route.paramMap.pipe(
    switchMap((params) => this.service.getUser(params.get("id")!)),
  );

  // ⚠️ Snapshot - read ONCE, does not update on param change
  id = this.route.snapshot.paramMap.get("id");

  // Query params: /users?page=2
  page$ = this.route.queryParamMap.pipe(map((p) => Number(p.get("page") ?? 1)));
}
```

**The snapshot trap:** navigating from `/users/1` to `/users/2` **reuses the component** — `ngOnInit` does not run again, so a snapshot value goes stale. Subscribe to `paramMap` instead.

## 6. Guards and resolvers

**Definition of a Guard:** A function that decides whether navigation is allowed.

| Guard | Controls |
|---|---|
| `CanActivate` | Entering a route |
| `CanActivateChild` | Entering child routes |
| `CanDeactivate` | **Leaving** a route (unsaved-changes warning) |
| `CanMatch` | Whether a route matches at all (before lazy loading) |

```ts
// Modern functional guard (v15+)
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(["/login"], { queryParams: { returnUrl: state.url } });
};

// Unsaved changes
export const unsavedGuard: CanDeactivateFn<FormComponent> = (component) =>
  component.form.pristine || confirm("Discard unsaved changes?");
```

**Definition of a Resolver:** Fetches data **before** the route activates, so the component renders with data already present instead of showing a spinner.

```ts
export const userResolver: ResolveFn<User> = (route) =>
  inject(UserService).getUser(route.paramMap.get("id")!);

// { path: "users/:id", component: UserComponent, resolve: { user: userResolver } }
// then: user = this.route.snapshot.data["user"];
```

> Resolvers delay navigation — the page appears frozen while loading. Use them for critical data only; otherwise render immediately and show a skeleton.

## 7. Lazy loading

```ts
// Component level (modern)
{ path: "admin", loadComponent: () => import("./admin.component").then(m => m.AdminComponent) }

// A group of routes
{ path: "admin", loadChildren: () => import("./admin.routes").then(m => m.ADMIN_ROUTES) }
```

Each becomes a separate JavaScript chunk, downloaded only when the route is visited.

---

# PART 3 — HTTP

## 8. HttpClient

```ts
bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
});
```

```ts
@Injectable({ providedIn: "root" })
export class UserService {
  private http = inject(HttpClient);

  getUsers(page = 1): Observable<User[]> {
    return this.http.get<User[]>("/api/users", {
      params: new HttpParams().set("page", page),
    }).pipe(
      retry(2),
      catchError(this.handleError),
    );
  }

  createUser(user: Partial<User>) {
    return this.http.post<User>("/api/users", user);
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.status === 0
      ? "Network error - check your connection"
      : `Server returned ${error.status}`;
    return throwError(() => new Error(message));
  }
}
```

**Key facts:**
- `HttpClient` returns a **cold** Observable — no subscribe, no request
- It **completes after one emission**, so you do not need to unsubscribe
- Unlike `fetch`, it **does** throw on 4xx/5xx status codes
- It parses JSON automatically

## 9. Interceptors

**Definition:** A function that sits between your app and the server, able to modify every outgoing request and incoming response. The standard place for auth tokens, logging and global error handling.

```ts
// Modern functional interceptor (v15+)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) inject(Router).navigate(["/login"]);
      return throwError(() => err);
    }),
  );
};
```

> **Requests are immutable** — you must use `req.clone()` to modify one. Mutating `req` directly does nothing.

---

## Key points

**Forms**
- **Reactive forms** for anything real — explicit, typed, testable.
- `FormArray` handles dynamic lists; `FormBuilder` is shorthand.
- Custom validators return **`null` when valid**, an error object when invalid.
- Show errors on `invalid && touched`.

**Routing**
- Route order matters; `**` must be last.
- Use **`paramMap`** not `snapshot` when the component can be reused across params.
- Guards and interceptors are now **functions**, not classes.
- Resolvers load data before navigation, but delay the page appearing.
- Lazy load with `loadComponent` / `loadChildren`.

**HTTP**
- `HttpClient` is **cold** and completes after one emission — no unsubscribe needed.
- It **does** error on 4xx/5xx, unlike `fetch`.
- Use `req.clone()` in interceptors — requests are immutable.

**Related:** [RxJSAndObservables.md](RxJSAndObservables.md) · [AngularBasics.md](AngularBasics.md)
