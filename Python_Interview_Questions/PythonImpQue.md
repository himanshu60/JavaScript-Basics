# Python Interview Questions and Answers

## Basics

## 1. What is Python?

A high-level, **interpreted**, dynamically typed programming language known for readable syntax. It supports procedural, object-oriented and functional programming, manages memory automatically, and treats everything as an object.

## 2. What are the key features of Python?

Easy to read, interpreted (no compile step), dynamically typed, cross-platform, garbage collected, a very large standard library, and a huge ecosystem of third-party packages.

## 3. Is Python dynamically typed or weakly typed?

**Dynamically** typed but **strongly** typed. A variable's type can change (`x = 5` then `x = "hi"`), but Python will not silently coerce types — `5 + "hello"` raises a `TypeError`.

## 4. Is Python compiled or interpreted?

Interpreted, but with a compilation step you do not see: source is compiled to **bytecode** (`.pyc`), which the Python Virtual Machine then executes.

## 5. What are Python's built-in data types?

Numeric (`int`, `float`, `complex`), sequence (`str`, `list`, `tuple`, `range`), mapping (`dict`), set (`set`, `frozenset`), boolean (`bool`), binary (`bytes`, `bytearray`), and `NoneType`.

## 6. Difference between a list and a tuple?

A list is **mutable**, uses `[]`, and is slightly slower. A tuple is **immutable**, uses `()`, is faster, and can be used as a dictionary key or set member because it is hashable.

## 7. What is the difference between a list, set and dictionary?

A **list** is ordered and allows duplicates with O(n) lookup. A **set** is unordered, removes duplicates, and has O(1) lookup. A **dictionary** stores key-value pairs with unique keys and O(1) lookup.

## 8. What are mutable and immutable types?

**Mutable** objects can be changed in place: `list`, `dict`, `set`, and most custom objects. **Immutable** objects cannot: `int`, `float`, `str`, `tuple`, `frozenset`, `bool`. Modifying an immutable object actually creates a new one.

## 9. Why is the mutable default argument a problem?

```python
def add(item, items=[]):     # the list is created ONCE at definition time
    items.append(item)
    return items

add(1)    # [1]
add(2)    # [1, 2]  ← same list reused
```
Fix it with `items=None` and create the list inside the function. **This is one of the most asked Python questions.**

## 10. Difference between `is` and `==`?

`==` compares **values**; `is` compares **identity** (the same object in memory). Use `is` only for `None`, `True` and `False`.

## 11. What are falsy values in Python?

`False`, `None`, `0`, `0.0`, `""`, `[]`, `()`, `{}`, `set()`, `range(0)`. Everything else is truthy.

## 12. What does slicing do?

`seq[start:stop:step]` extracts a portion — `start` inclusive, `stop` exclusive. `seq[::-1]` reverses. Slicing never raises an `IndexError`, unlike indexing.

## 13. Difference between shallow and deep copy?

A shallow copy (`list.copy()`, `[:]`) creates a new outer object but shares the nested objects. `copy.deepcopy()` recursively duplicates everything so nothing is shared.

## 14. How do you reverse a string?

`s[::-1]` — slicing with a step of -1.

## 15. Why is `"".join(list)` preferred over `+=` in a loop?

Strings are immutable, so `+=` creates a new string every iteration, making it O(n²). `join()` is O(n).

---

## Functions

## 16. What are `*args` and `**kwargs`?

`*args` collects extra **positional** arguments into a tuple; `**kwargs` collects extra **keyword** arguments into a dict. They let a function accept any number of arguments.

## 17. What is a lambda function?

An anonymous single-expression function: `lambda x: x**2`. Useful as a `key` for `sorted`, `map` or `filter`. PEP 8 discourages assigning one to a name — use `def` instead.

## 18. What is a closure?

A nested function that remembers variables from its enclosing scope even after the outer function has returned. Use `nonlocal` to modify (not just read) an enclosed variable.

## 19. What is a decorator?

A function that wraps another function to add behaviour without modifying it, applied with `@`. `@timer` is exactly `func = timer(func)`. Always use `@functools.wraps` inside so the original's `__name__` and docstring survive.

## 20. What is `@lru_cache`?

A decorator that memoizes a function's results, turning repeated calls into cache hits. It converts naive recursive Fibonacci from O(2ⁿ) to O(n).

## 21. Difference between `@staticmethod`, `@classmethod` and an instance method?

An **instance method** takes `self` and can access instance and class state. A **`@classmethod`** takes `cls` and is often used as an alternative constructor. A **`@staticmethod`** takes neither — it is just a function living in the class namespace.

## 22. Difference between `global` and `nonlocal`?

`global` declares that a name refers to a module-level variable. `nonlocal` refers to the nearest **enclosing function** scope — used inside closures.

## 23. What is the LEGB rule?

The order Python resolves names: **L**ocal → **E**nclosing → **G**lobal → **B**uilt-in.

## 24. Difference between `return` and `yield`?

`return` ends the function and gives back one value. `yield` pauses the function, produces a value, and resumes from that point on the next call — making it a generator.

---

## OOP

## 25. What is `self`?

A reference to the current instance, passed automatically as the first argument to every instance method. It is a naming convention, not a keyword — but never rename it.

## 26. What are the four pillars of OOP in Python?

**Encapsulation** (bundling data with methods, with controlled access), **Inheritance** (deriving one class from another), **Polymorphism** (the same method behaving differently per class), and **Abstraction** (hiding implementation behind a stable interface, via `ABC`).

## 27. Does Python have private variables?

Not truly. A single underscore `_name` is a convention meaning "internal". A double underscore `__name` triggers **name mangling** to `_ClassName__name`, which prevents accidental clashes but is still accessible.

## 28. Difference between a class attribute and an instance attribute?

A class attribute is shared by **all** instances; an instance attribute belongs to one object. A **mutable class attribute is a classic bug** — all instances end up sharing the same list.

## 29. What is `super()`?

A proxy to the parent class, used to call its methods — most commonly `super().__init__()`. It is essential for cooperative multiple inheritance.

## 30. What is the MRO?

The **Method Resolution Order** — the sequence Python searches classes for a method, computed by the C3 linearisation algorithm. It resolves the diamond problem in multiple inheritance. Inspect it with `Class.__mro__`.

## 31. What are dunder (magic) methods?

Special double-underscore methods that hook into Python's syntax: `__init__` (construction), `__repr__`/`__str__` (representation), `__len__`, `__eq__`, `__iter__`, `__getitem__`, `__enter__`/`__exit__`, `__call__`.

## 32. Difference between `__str__` and `__repr__`?

`__str__` is the readable, user-facing version used by `print()`. `__repr__` is the unambiguous developer-facing version used in the REPL and debugging — it should ideally be valid Python that recreates the object.

## 33. What is duck typing?

Python does not check an object's type, only whether it has the needed method. *"If it walks like a duck and quacks like a duck, it is a duck."*

## 34. What is a dataclass?

A decorator (`@dataclass`) that auto-generates `__init__`, `__repr__` and `__eq__` from annotated attributes. Use `field(default_factory=list)` for mutable defaults, and `frozen=True` for an immutable, hashable class.

## 35. If you define `__eq__`, what else must you define?

`__hash__`. Defining `__eq__` sets `__hash__` to `None`, making the object unhashable and unusable in sets or as a dict key.

---

## Advanced

## 36. What is the difference between an iterable and an iterator?

An **iterable** has `__iter__` and can be looped over. An **iterator** has `__next__`, produces values one at a time, and remembers its position. `iter(list)` returns an iterator.

## 37. What is a generator and why use one?

A function using `yield` that produces values lazily, one at a time, keeping its state between calls. It uses constant memory regardless of how many values it produces — essential for large files and infinite sequences.

## 38. Difference between a list comprehension and a generator expression?

`[x for x in ...]` builds the entire list in memory. `(x for x in ...)` produces values on demand. Use the generator for large data or when you only iterate once.

## 39. What is the GIL?

The **Global Interpreter Lock** — a mutex in CPython allowing only one thread to execute Python bytecode at a time. It means threads give you **no CPU parallelism**, though the GIL is released during I/O so threads still help I/O-bound work.

## 40. When do you use threading vs multiprocessing vs asyncio?

**Threading** for I/O-bound work with blocking libraries. **Multiprocessing** for CPU-bound work (separate processes, separate GILs). **Asyncio** for thousands of concurrent network operations on a single thread.

## 41. What breaks asyncio?

Any blocking call. `time.sleep(5)` or a synchronous `requests` call inside an async function freezes the **entire** event loop. Use `await asyncio.sleep()` and async libraries, or offload with `asyncio.to_thread()`.

## 42. How does Python manage memory?

**Reference counting** frees objects when their count reaches zero, plus a **generational garbage collector** that detects and collects circular references, which reference counting alone cannot free.

## 43. What is `__slots__`?

A class attribute that replaces the per-instance `__dict__` with a fixed set of attributes, significantly reducing memory when you create very many small objects.

## 44. What is a context manager?

An object defining `__enter__` and `__exit__`, used with `with`, that guarantees cleanup even if an exception occurs — closing files, releasing locks, rolling back transactions. `@contextmanager` provides a simpler generator-based form.

## 45. What are type hints and are they enforced?

Optional annotations like `def f(x: int) -> str`. Python does **not** enforce them at runtime — static checkers like **mypy** verify them. They improve editor support and act as documentation that cannot go stale.

## 46. What does `if __name__ == "__main__"` do?

When a file is run directly, `__name__` is `"__main__"`; when imported, it is the module's name. The guard prevents script code from executing on import.

## 47. What is a virtual environment and why use one?

An isolated Python installation per project (`python -m venv venv`), so different projects can use different versions of the same package without conflict. Always use one.

## 48. Difference between `.py` and `.pyc`?

`.py` is your source. `.pyc` is the compiled **bytecode** Python caches (in `__pycache__`) so subsequent imports skip recompilation.

## 49. What is monkey patching?

Modifying a class or module at runtime — replacing a method after import. Useful in testing, risky in production because the change is invisible to anyone reading the original source.

## 50. What is PEP 8?

Python's official style guide: 4-space indentation, `snake_case` for functions and variables, `PascalCase` for classes, ~79 character lines, and clear import ordering. Tools like `black`, `ruff` and `flake8` enforce it automatically.

---

## Error Handling

## 51. How do you handle exceptions in Python?

`try` / `except` / `else` / `finally`. `except` catches specific exception types, `else` runs only when no exception occurred, and `finally` always runs — making it the place for cleanup.

## 52. Why should you avoid a bare `except:`?

It catches **everything**, including `KeyboardInterrupt` and `SystemExit`, so you cannot stop your own program with Ctrl+C. Catch specific exceptions, or `except Exception` at minimum.

## 53. What is the `else` clause in a try block for?

It runs only when no exception was raised, keeping the `try` block small so you do not accidentally catch errors from unrelated code.

## 54. How do you create a custom exception?

Subclass `Exception` (not `BaseException`). Use `raise MyError(...) from original_error` to preserve the original cause in the traceback.

---

## Practical

## 55. How do you read a very large file without running out of memory?

Iterate over the file object directly — it is a lazy iterator that yields one line at a time. Never use `f.readlines()`, which loads everything into memory.

## 56. What are `enumerate` and `zip`?

`enumerate(items)` yields `(index, item)` pairs, replacing `range(len(items))`. `zip(a, b)` iterates two sequences in parallel. Both make loops far more readable.

## 57. Difference between `sort()` and `sorted()`?

`list.sort()` sorts **in place** and returns `None`. `sorted(iterable)` returns a **new** sorted list and works on any iterable. Assigning the result of `.sort()` to a variable is a common bug.

## 58. What are `Counter`, `defaultdict` and `deque`?

From `collections`: **`Counter`** counts occurrences and has `.most_common()`. **`defaultdict`** provides a default value instead of raising `KeyError`. **`deque`** gives O(1) appends and pops at **both** ends, unlike a list.

## 59. What is the difference between Flask, Django and FastAPI?

**Flask** is a minimal micro-framework — you choose every component. **Django** is batteries-included with an ORM, admin panel and auth built in. **FastAPI** is modern and async-first, generating OpenAPI docs automatically from type hints.

## 60. How do you write tests in Python?

Use **pytest**: plain `assert` statements, `@pytest.mark.parametrize` for table-driven tests, `pytest.raises` for expected exceptions, and **fixtures** for reusable setup injected as function parameters.

---

**Related:** [PythonBasicsAndDataTypes.md](PythonBasicsAndDataTypes.md) · [FunctionsAndOOP.md](FunctionsAndOOP.md) · [AdvancedPython.md](AdvancedPython.md)
