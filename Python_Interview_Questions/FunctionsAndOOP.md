# Python Functions and OOP

---

# PART 1 — Functions

## 1. `*args` and `**kwargs`

**Definition of `*args`:** Collects any number of **positional** arguments into a tuple.
**Definition of `**kwargs`:** Collects any number of **keyword** arguments into a dictionary.

```python
def demo(a, b=10, *args, **kwargs):
    print(a)         # required positional
    print(b)         # optional with default
    print(args)      # tuple of extra positional args
    print(kwargs)    # dict of extra keyword args

demo(1, 2, 3, 4, x=5, y=6)
# 1
# 2
# (3, 4)
# {'x': 5, 'y': 6}
```

**Unpacking in the other direction:**

```python
nums = [1, 2, 3]
config = {"host": "localhost", "port": 8080}

print(*nums)              # same as print(1, 2, 3)
connect(**config)         # same as connect(host="localhost", port=8080)
```

**Parameter order is fixed:** `def f(positional, *args, keyword_only, **kwargs)`

```python
def f(a, b, /, c, *, d):
    ...
# a, b : positional-ONLY (before /)
# c    : positional or keyword
# d    : keyword-ONLY (after *)
```

---

## 2. Lambda functions

**Definition:** An anonymous single-expression function.

```python
square = lambda x: x ** 2
add = lambda x, y: x + y

sorted(people, key=lambda p: p["age"])
list(filter(lambda x: x > 0, nums))
```

**When NOT to use lambda:** if you assign it to a name, just use `def` — it gives a proper function name in tracebacks.

```python
square = lambda x: x**2      # ❌ discouraged by PEP 8
def square(x): return x**2   # ✅
```

---

## 3. Closures

**Definition:** A nested function that remembers variables from the enclosing scope even after the outer function has returned.

```python
def make_counter():
    count = 0                  # enclosed variable

    def increment():
        nonlocal count         # needed to MODIFY, not just read
        count += 1
        return count

    return increment

counter = make_counter()
counter()    # 1
counter()    # 2
```

**Definition of `nonlocal`:** Declares that a variable belongs to the nearest enclosing function scope, not the local one.
**Definition of `global`:** Declares that a variable belongs to the module scope.

```python
x = 10
def f():
    global x
    x = 20        # modifies the module-level x
```

---

## 4. Decorators

**Definition:** A function that takes another function and returns a modified version of it, without changing the original's code. Applied with `@`.

```python
import functools
import time

def timer(func):
    @functools.wraps(func)          # preserves __name__ and __doc__
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time() - start:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)

slow_function()     # "slow_function took 1.0012s"
```

`@timer` is exactly equivalent to `slow_function = timer(slow_function)`.

> **`@functools.wraps` matters.** Without it, the decorated function's `__name__` becomes `"wrapper"`, which breaks debugging, documentation tools and anything relying on introspection.

**Decorator with arguments** — needs three levels:

```python
def repeat(times):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def greet(name):
    print(f"Hello {name}")
```

**Useful built-in decorators:**

| Decorator | Purpose |
|---|---|
| `@property` | Expose a method as a read-only attribute |
| `@staticmethod` | A method that needs neither `self` nor `cls` |
| `@classmethod` | Receives the class (`cls`) instead of the instance |
| `@functools.lru_cache` | Memoize results automatically |
| `@functools.wraps` | Preserve metadata inside a decorator |
| `@dataclass` | Auto-generate `__init__`, `__repr__`, `__eq__` |

```python
@functools.lru_cache(maxsize=None)
def fib(n):
    if n < 2:
        return n
    return fib(n-1) + fib(n-2)      # now O(n) instead of O(2ⁿ)
```

---

# PART 2 — OOP

## 5. Classes and objects

```python
class Person:
    species = "Homo sapiens"          # CLASS attribute - shared by all instances

    def __init__(self, name, age):    # constructor
        self.name = name              # INSTANCE attribute - per object
        self.age = age

    def greet(self):                  # instance method
        return f"Hi, I'm {self.name}"

    @classmethod
    def from_string(cls, s):          # alternative constructor
        name, age = s.split(",")
        return cls(name, int(age))

    @staticmethod
    def is_adult(age):                # a utility, no self or cls needed
        return age >= 18

    def __repr__(self):               # developer-facing representation
        return f"Person({self.name!r}, {self.age})"

    def __str__(self):                # user-facing representation
        return self.name
```

**Definition of `self`:** The reference to the current instance, passed automatically as the first argument to every instance method. It is a convention, not a keyword — but never rename it.

| Method type | First arg | Can access |
|---|---|---|
| Instance method | `self` | Instance and class attributes |
| `@classmethod` | `cls` | Class attributes only |
| `@staticmethod` | none | Neither — it is just a namespaced function |

**Class vs instance attribute — the mutable trap:**

```python
class Dog:
    tricks = []            # ❌ SHARED by every instance

d1, d2 = Dog(), Dog()
d1.tricks.append("sit")
print(d2.tricks)           # ['sit'] ← unexpected!

class Dog:
    def __init__(self):
        self.tricks = []   # ✅ per instance
```

---

## 6. The four pillars

### Encapsulation

**Definition:** Bundling data with the methods that operate on it, and controlling access to internal state.

```python
class Account:
    def __init__(self, balance):
        self._balance = balance        # single _ : "internal, please don't touch"
        self.__secret = "hidden"       # double __ : name mangling

    @property
    def balance(self):                 # read like an attribute
        return self._balance

    @balance.setter
    def balance(self, value):
        if value < 0:
            raise ValueError("Balance cannot be negative")
        self._balance = value

acc = Account(100)
acc.balance = 200        # calls the setter, validates
acc.balance = -50        # ValueError
```

> Python has **no true private members**. A single underscore is a convention. A double underscore triggers **name mangling** (`__secret` becomes `_Account__secret`), which prevents accidental clashes but is still accessible.

### Inheritance

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)        # call the parent constructor
        self.breed = breed

    def speak(self):
        return f"{self.name} says Woof"
```

**Definition of `super()`:** Returns a proxy to the parent class, letting you call its methods — essential for cooperative multiple inheritance.

### Polymorphism

**Definition:** Different classes responding to the same method call in their own way.

```python
for animal in [Dog("Rex"), Cat("Tom")]:
    print(animal.speak())        # each uses its own implementation
```

**Definition of Duck Typing:** Python does not check types — if an object has the method, it works. *"If it walks like a duck and quacks like a duck, it is a duck."*

```python
def render(obj):
    return obj.draw()      # anything with a .draw() method works
```

### Abstraction

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2

# Shape()  → TypeError: Can't instantiate abstract class
```

---

## 7. Multiple inheritance and the MRO

**Definition of MRO (Method Resolution Order):** The order Python searches classes when looking up a method. It uses the **C3 linearisation** algorithm, which guarantees a consistent, predictable order.

```python
class A:
    def hello(self): return "A"
class B(A):
    def hello(self): return "B"
class C(A):
    def hello(self): return "C"
class D(B, C):
    pass

print(D().hello())        # "B"
print(D.__mro__)          # D → B → C → A → object
```

**The diamond problem:** `D` inherits from both `B` and `C`, which both inherit from `A`. The MRO resolves which `hello` wins — left to right, depth first, but never visiting a class before its subclasses.

---

## 8. Dunder (magic) methods

**Definition:** Special methods with double underscores that hook into Python's built-in operators and functions.

| Method | Triggered by |
|---|---|
| `__init__` | `obj = Class()` |
| `__repr__` | `repr(obj)`, the REPL |
| `__str__` | `str(obj)`, `print(obj)` |
| `__len__` | `len(obj)` |
| `__eq__` | `obj1 == obj2` |
| `__lt__`, `__gt__` | `<`, `>` (enables `sorted`) |
| `__hash__` | Use as a dict key or in a set |
| `__getitem__` | `obj[key]` |
| `__iter__`, `__next__` | `for x in obj` |
| `__contains__` | `x in obj` |
| `__call__` | `obj()` |
| `__enter__`, `__exit__` | `with obj:` |
| `__add__` | `obj1 + obj2` |

```python
class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __eq__(self, other):
        return (self.x, self.y) == (other.x, other.y)

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

v = Vector(1, 2) + Vector(3, 4)     # Vector(4, 6)
```

> If you define `__eq__`, define `__hash__` too — otherwise the object becomes unhashable and cannot go in a set or dict.

---

## 9. Dataclasses

**Definition:** A decorator that auto-generates `__init__`, `__repr__` and `__eq__` from type-annotated class attributes — removing boilerplate.

```python
from dataclasses import dataclass, field

@dataclass
class Point:
    x: int
    y: int = 0                              # default
    tags: list = field(default_factory=list)  # ✅ avoids the mutable default bug

p = Point(1, 2)
print(p)              # Point(x=1, y=2, tags=[])
print(p == Point(1, 2))   # True - __eq__ generated

@dataclass(frozen=True)   # immutable and hashable
class Config:
    host: str
    port: int
```

---

## 10. Exception handling

```python
try:
    result = risky_operation()
except ValueError as e:
    print(f"Bad value: {e}")
except (TypeError, KeyError) as e:      # multiple types
    print(f"Type or key problem: {e}")
except Exception as e:
    logger.exception("Unexpected")       # logs the traceback
    raise                                # re-raise after logging
else:
    print("Ran only if NO exception")    # the else clause
finally:
    cleanup()                            # ALWAYS runs
```

**Definition of the `else` clause:** Runs only when no exception was raised. It keeps the `try` block small, so you are not accidentally catching errors from unrelated code.

**Custom exceptions:**

```python
class ValidationError(Exception):
    def __init__(self, field, message):
        self.field = field
        super().__init__(f"{field}: {message}")

raise ValidationError("email", "is not valid")
```

**Rules:**
- Catch **specific** exceptions, not bare `except:` (which also catches `KeyboardInterrupt`)
- Never silently `pass` in an except block
- Use `raise ... from e` to preserve the original cause

```python
except KeyError as e:
    raise ConfigError("Missing setting") from e     # keeps the chain
```

---

## 11. Context managers

**Definition:** An object defining `__enter__` and `__exit__`, used with `with`, that guarantees cleanup even if an exception occurs.

```python
# The file is closed automatically, even on an exception
with open("data.txt") as f:
    content = f.read()

# Custom context manager - class form
class Timer:
    def __enter__(self):
        self.start = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"Took {time.time() - self.start:.2f}s")
        return False          # False = do not suppress the exception

with Timer():
    slow_operation()

# Simpler - generator form
from contextlib import contextmanager

@contextmanager
def transaction(db):
    db.begin()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
```

---

## Key points

- `*args` collects positional args into a tuple; `**kwargs` collects keyword args into a dict.
- **Decorators** wrap functions — always use `@functools.wraps`.
- `@lru_cache` gives you memoization for free.
- `self` is explicit in Python; `@classmethod` gets `cls`, `@staticmethod` gets neither.
- **Class attributes are shared** — never use a mutable one.
- Python has **no true private members**, only conventions and name mangling.
- Use `super().__init__()`, and know the **MRO** resolves the diamond problem.
- Define `__hash__` whenever you define `__eq__`.
- **Dataclasses** remove boilerplate; use `field(default_factory=list)` for mutable defaults.
- Catch **specific** exceptions; `finally` always runs; `else` runs only on success.
- **Context managers** guarantee cleanup — `with` is almost always the right choice.
