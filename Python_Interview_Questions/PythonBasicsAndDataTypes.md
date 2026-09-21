# Python Basics and Data Types

## 1. What is Python?

**Definition:** Python is a high-level, **interpreted**, dynamically typed programming language. It runs code line by line through an interpreter rather than compiling to machine code ahead of time, and variable types are checked at runtime rather than at compile time.

**Key characteristics:**

| Feature | Meaning |
|---|---|
| **Interpreted** | No separate compile step — code runs directly |
| **Dynamically typed** | `x = 5` then `x = "hello"` is legal |
| **Strongly typed** | But `5 + "hello"` still raises a `TypeError` |
| **Garbage collected** | Memory freed automatically |
| **Multi-paradigm** | Procedural, object-oriented and functional |
| **Everything is an object** | Including functions, classes and modules |

> **Dynamically typed vs weakly typed** — a common confusion. Python is dynamic (types can change) but **strong** (it will not silently coerce a string into a number). JavaScript is dynamic and weak.

---

## 2. The built-in data types

| Type | Mutable? | Ordered? | Example |
|---|---|---|---|
| `int`, `float`, `complex` | ❌ | — | `5`, `3.14` |
| `str` | ❌ | ✅ | `"hello"` |
| `bool` | ❌ | — | `True` |
| `list` | ✅ | ✅ | `[1, 2, 3]` |
| `tuple` | ❌ | ✅ | `(1, 2, 3)` |
| `set` | ✅ | ❌ | `{1, 2, 3}` |
| `frozenset` | ❌ | ❌ | `frozenset([1,2])` |
| `dict` | ✅ | ✅ (since 3.7) | `{"a": 1}` |
| `NoneType` | ❌ | — | `None` |

---

## 3. Mutable vs immutable

**Definition of Immutable:** The object cannot be changed after creation. Any "modification" creates a **new** object.
**Definition of Mutable:** The object's contents can be changed in place, keeping the same identity.

```python
# Immutable - a new object is created
s = "hello"
print(id(s))       # e.g. 140234...
s += " world"
print(id(s))       # DIFFERENT id - a new string

# Mutable - same object, changed in place
lst = [1, 2]
print(id(lst))
lst.append(3)
print(id(lst))     # SAME id
```

**Why it matters — the classic bug:**

```python
# ❌ Mutable default argument - evaluated ONCE at definition time
def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item(1))   # [1]
print(add_item(2))   # [1, 2]  ← the SAME list is reused!

# ✅ Correct pattern
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

**This is one of the most asked Python interview questions.** The default value is created once when the function is defined, not each time it is called.

---

## 4. List vs Tuple vs Set vs Dictionary

```python
my_list  = [1, 2, 2, 3]        # ordered, mutable, duplicates allowed
my_tuple = (1, 2, 2, 3)        # ordered, immutable, duplicates allowed
my_set   = {1, 2, 2, 3}        # unordered, mutable, duplicates REMOVED → {1,2,3}
my_dict  = {"a": 1, "b": 2}    # key-value, mutable, unique keys
```

| | List | Tuple | Set | Dict |
|---|---|---|---|---|
| Mutable | ✅ | ❌ | ✅ | ✅ |
| Ordered | ✅ | ✅ | ❌ | ✅ (3.7+) |
| Duplicates | ✅ | ✅ | ❌ | Keys no, values yes |
| Indexable | ✅ | ✅ | ❌ | By key |
| Hashable (usable as a dict key) | ❌ | ✅* | ❌ | ❌ |
| Lookup speed | O(n) | O(n) | **O(1)** | **O(1)** |

\* only if all its elements are also hashable

**When to use which:**
- **List** — an ordered collection you will modify
- **Tuple** — fixed data, or a dictionary key, or returning multiple values
- **Set** — membership tests and removing duplicates (O(1) lookup)
- **Dict** — key-value mapping, counting, caching

```python
# Removing duplicates while keeping order
unique = list(dict.fromkeys([1, 2, 2, 3]))    # [1, 2, 3]

# Fast membership check
if user_id in allowed_set:        # O(1)
if user_id in allowed_list:       # O(n) - slow on large lists
```

---

## 5. Strings

**Definition:** Python strings are **immutable** sequences of Unicode characters.

```python
s = "Hello World"

s.upper()           # "HELLO WORLD"
s.lower()
s.strip()           # remove surrounding whitespace
s.split()           # ['Hello', 'World']
s.replace("World", "Python")
s.startswith("He")  # True
"-".join(["a","b"]) # "a-b"
s.find("World")     # 6 (or -1 if not found)
len(s)              # 11
```

**f-strings** (the modern way to format):

```python
name, age = "Amit", 25
print(f"{name} is {age}")                 # "Amit is 25"
print(f"{3.14159:.2f}")                   # "3.14"
print(f"{age=}")                          # "age=25"  (debugging shortcut)
print(f"{name:>10}")                      # right-aligned in 10 chars
```

**Building strings in a loop — the performance point:**

```python
# ❌ O(n²) - each += creates a NEW string
result = ""
for word in words:
    result += word

# ✅ O(n)
result = "".join(words)
```

---

## 6. Slicing

**Definition:** `sequence[start:stop:step]` extracts a portion. `start` is inclusive, `stop` is exclusive.

```python
nums = [0, 1, 2, 3, 4, 5]

nums[1:4]      # [1, 2, 3]      - index 1 up to (not including) 4
nums[:3]       # [0, 1, 2]      - from the start
nums[3:]       # [3, 4, 5]      - to the end
nums[-2:]      # [4, 5]         - last two
nums[::2]      # [0, 2, 4]      - every second item
nums[::-1]     # [5, 4, 3, 2, 1, 0]  - REVERSED
nums[:]        # a shallow copy of the whole list
```

**Slicing never raises an IndexError:**

```python
nums[10:20]    # []  - no error, just empty
nums[10]       # IndexError
```

---

## 7. Shallow vs deep copy

```python
import copy

original = [[1, 2], [3, 4]]

reference = original                    # NOT a copy - same object
shallow   = original.copy()             # or original[:] or list(original)
deep      = copy.deepcopy(original)

shallow[0].append(99)
print(original)    # [[1, 2, 99], [3, 4]]  ← nested list is SHARED

deep[0].append(77)
print(original)    # unchanged ← fully independent
```

**Definition of Shallow copy:** A new outer object, but the nested objects are shared references.
**Definition of Deep copy:** Everything is recursively duplicated — nothing is shared.

---

## 8. `is` vs `==`

**Definition of `==`:** Compares **values** — are these equal?
**Definition of `is`:** Compares **identity** — are these literally the same object in memory?

```python
a = [1, 2, 3]
b = [1, 2, 3]
c = a

a == b    # True  - same contents
a is b    # False - different objects
a is c    # True  - the same object

# Always use "is" for None
if value is None:      # ✅ correct
if value == None:      # ❌ works but wrong style
```

**The integer caching surprise:**

```python
a = 256; b = 256
a is b        # True  - small ints (-5 to 256) are cached by CPython

a = 257; b = 257
a is b        # False (usually) - outside the cache range
```
This is a CPython implementation detail, not a language guarantee — which is exactly why you should never use `is` for value comparison.

---

## 9. Truthiness

**Definition:** Values that evaluate to `False` in a boolean context are called **falsy**.

```python
# Falsy values
False, None, 0, 0.0, "", [], (), {}, set(), range(0)

# Everything else is truthy
if []:          # does not run - empty list is falsy
if [0]:         # runs - non-empty list is truthy
if "False":     # runs - non-empty string is truthy
```

```python
# Pythonic emptiness check
if not items:            # ✅
if len(items) == 0:      # works, less idiomatic
```

---

## 10. Comprehensions

**Definition:** A concise syntax for building a list, dict, set or generator from an iterable.

```python
# List comprehension
squares = [x**2 for x in range(5)]                  # [0, 1, 4, 9, 16]
evens   = [x for x in range(10) if x % 2 == 0]      # with a filter
pairs   = [(x, y) for x in [1,2] for y in "ab"]     # nested loops

# Dict comprehension
squares = {x: x**2 for x in range(5)}
inverted = {v: k for k, v in original.items()}

# Set comprehension
unique_lengths = {len(w) for w in words}

# Generator expression - lazy, no brackets stored in memory
total = sum(x**2 for x in range(1_000_000))         # memory efficient
```

**List comprehension vs generator expression:**

```python
[x**2 for x in range(10_000_000)]     # builds the WHOLE list in memory
(x**2 for x in range(10_000_000))     # produces values one at a time
```

> Keep comprehensions to one level of nesting. Beyond that, a normal loop is more readable — and readability is the whole point of Python.

---

## 11. Common built-in functions

```python
len(x), type(x), id(x), isinstance(x, int)
range(5), enumerate(items), zip(a, b), reversed(items)
sorted(items, key=lambda x: x[1], reverse=True)
sum(nums), min(nums), max(nums), abs(-5), round(3.7)
any([False, True]), all([True, True])
map(str.upper, words), filter(lambda x: x > 0, nums)
```

**`enumerate` and `zip` — the two that make loops Pythonic:**

```python
# ❌ Not Pythonic
for i in range(len(items)):
    print(i, items[i])

# ✅ Pythonic
for i, item in enumerate(items):
    print(i, item)

# Iterating two lists together
for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

---

## 12. Sorting

```python
nums = [3, 1, 2]

sorted(nums)          # [1, 2, 3] - returns a NEW list
nums.sort()           # sorts IN PLACE, returns None

# Sort by a key
people = [{"name": "A", "age": 30}, {"name": "B", "age": 25}]
sorted(people, key=lambda p: p["age"])
sorted(people, key=lambda p: (p["age"], p["name"]))    # multiple keys
sorted(words, key=len, reverse=True)
```

> `nums.sort()` returns `None`, so `x = nums.sort()` is a common bug. Use `sorted()` when you need the result.

---

## Key points

- Python is **interpreted, dynamically typed but strongly typed**.
- Know which types are **mutable** (list, dict, set) and immutable (str, tuple, int).
- The **mutable default argument** bug is asked constantly — use `None` as the default.
- Set and dict lookups are **O(1)**; list lookups are O(n).
- Strings are immutable — build with `"".join()`, never `+=` in a loop.
- `==` compares values, `is` compares identity. Use `is` only for `None`.
- Slicing never raises an IndexError; `[::-1]` reverses.
- Use comprehensions for clarity, generator expressions for memory.
- `enumerate` and `zip` replace index-based loops.
