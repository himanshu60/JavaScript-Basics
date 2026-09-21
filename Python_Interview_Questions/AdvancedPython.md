# Advanced Python — Generators, GIL, Concurrency and Memory

---

## 1. Iterators and iterables

**Definition of an Iterable:** An object with an `__iter__` method — it can be looped over. Lists, strings, dicts, sets and files are iterables.
**Definition of an Iterator:** An object with a `__next__` method — it produces values one at a time and remembers its position.

```python
nums = [1, 2, 3]          # iterable
it = iter(nums)           # iterator

next(it)    # 1
next(it)    # 2
next(it)    # 3
next(it)    # StopIteration
```

A `for` loop is just this, with the `StopIteration` handled for you.

**Custom iterator:**

```python
class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1

for n in Countdown(3):    # 3, 2, 1
    print(n)
```

---

## 2. Generators

**Definition:** A function containing `yield` that produces values **lazily**, one at a time, remembering its state between calls. Calling it returns a generator object without running any code.

```python
def countdown(n):
    print("Starting")
    while n > 0:
        yield n           # PAUSE here and hand out the value
        n -= 1

gen = countdown(3)        # nothing has run yet
print(next(gen))          # "Starting" then 3
print(next(gen))          # 2
```

**Why generators matter — memory:**

```python
# ❌ Builds 10 million integers in memory (~400 MB)
nums = [x**2 for x in range(10_000_000)]

# ✅ Produces one at a time (~200 bytes)
nums = (x**2 for x in range(10_000_000))
total = sum(nums)
```

**Reading a huge file line by line:**

```python
def read_large_file(path):
    with open(path) as f:
        for line in f:        # files are already lazy iterators
            yield line.strip()

for line in read_large_file("10gb.log"):
    process(line)             # constant memory regardless of file size
```

**`yield from`** — delegate to another generator:

```python
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)     # recurse
        else:
            yield item

list(flatten([1, [2, [3, [4]]]]))        # [1, 2, 3, 4]
```

**Infinite generators are safe** because they are lazy:

```python
def infinite_ids():
    i = 0
    while True:
        i += 1
        yield i
```

---

## 3. The GIL

**Definition:** The Global Interpreter Lock is a mutex in CPython that allows **only one thread to execute Python bytecode at a time**, even on a multi-core CPU.

**The consequence:** Python threads do **not** give you parallel CPU execution.

```
CPU-bound work with 4 threads:
  Thread 1 ████░░░░░░░░
  Thread 2 ░░░░████░░░░     ← only one runs at a time
  Thread 3 ░░░░░░░░████
  → no faster than one thread, sometimes slower
```

**But the GIL is released during I/O.** While a thread waits for a network response or a disk read, another thread runs. This is why threads still help I/O-bound work.

| Workload | Use | Why |
|---|---|---|
| **I/O-bound** (API calls, DB, files) | `threading` or `asyncio` | GIL is released while waiting |
| **CPU-bound** (maths, image processing) | `multiprocessing` | Separate processes, separate GILs |

> Python 3.13 introduced an experimental free-threaded build without the GIL, but the standard advice still applies.

---

## 4. Threading vs Multiprocessing vs Asyncio

```python
# THREADING - concurrent I/O, shared memory
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(fetch_url, urls))     # 10 requests at once

# MULTIPROCESSING - true parallelism for CPU work
from concurrent.futures import ProcessPoolExecutor

with ProcessPoolExecutor() as executor:
    results = list(executor.map(heavy_computation, data))

# ASYNCIO - thousands of concurrent I/O operations, single thread
import asyncio, aiohttp

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main(urls):
    async with aiohttp.ClientSession() as session:
        return await asyncio.gather(*[fetch(session, u) for u in urls])

asyncio.run(main(urls))
```

| | Threading | Multiprocessing | Asyncio |
|---|---|---|---|
| Parallel CPU | ❌ (GIL) | ✅ | ❌ |
| Memory | Shared | Separate (costly) | Shared |
| Overhead | Low | **High** | **Lowest** |
| Scale | Hundreds | ~CPU count | **Thousands** |
| Complexity | Medium (locks, races) | Medium (IPC) | Higher (async all the way down) |
| Best for | I/O with blocking libraries | CPU-bound work | Many concurrent network calls |

**The async trap — one blocking call ruins everything:**

```python
async def bad():
    time.sleep(5)              # ❌ BLOCKS the entire event loop
async def good():
    await asyncio.sleep(5)     # ✅ yields control to other tasks
```

Any synchronous library (`requests`, blocking DB drivers) inside async code has the same effect. Use `asyncio.to_thread()` to offload it.

---

## 5. Memory management

**Definition:** CPython manages memory with **reference counting** plus a **generational garbage collector** for cycles.

```python
import sys

a = [1, 2, 3]
b = a
sys.getrefcount(a)      # count of references to the object
del b                   # count decreases; at 0 the object is freed
```

**Why a garbage collector is needed on top:** reference counting cannot free **circular references**.

```python
a = {}
b = {}
a["b"] = b
b["a"] = a          # each references the other - count never hits 0
# the cyclic GC detects and collects these
```

**Common memory issues:**

```python
# 1. Loading everything into memory
data = f.readlines()          # ❌ whole file
for line in f:                # ✅ lazy

# 2. Unbounded caches
cache = {}                    # ❌ grows forever
@lru_cache(maxsize=1000)      # ✅ bounded

# 3. Use __slots__ for many small objects
class Point:
    __slots__ = ("x", "y")    # no per-instance __dict__ - big saving at scale
```

---

## 6. Type hints

**Definition:** Optional annotations describing expected types. Python does **not** enforce them at runtime — tools like **mypy** check them statically.

```python
from typing import Optional, Union

def greet(name: str, times: int = 1) -> str:
    return f"Hello {name}! " * times

def find_user(user_id: int) -> Optional[dict]:      # dict or None
    ...

# Modern syntax (3.9+/3.10+)
def process(items: list[str]) -> dict[str, int]: ...
def handle(value: int | str) -> None: ...            # 3.10+
```

**Why bother:** editor autocomplete, catching bugs before running, and documentation that cannot go stale. Adopt gradually — hints on function signatures give most of the benefit.

---

## 7. Modules, packages and virtual environments

```python
import math
from math import sqrt, pi
from math import sqrt as square_root
from mypackage.module import function

if __name__ == "__main__":     # only runs when executed directly, not on import
    main()
```

**Definition of `if __name__ == "__main__"`:** When a file is run directly, `__name__` is `"__main__"`. When it is imported, `__name__` is the module name. This guard stops your script's code from running on import.

**Virtual environments:**

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip freeze > requirements.txt
deactivate
```

**Definition:** A virtual environment is an isolated Python installation per project, so two projects can use different versions of the same package without conflict. **Always use one.**

---

## 8. File handling and JSON

```python
# Always use "with" - guarantees the file closes
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()            # whole file
    # or
    for line in f:                # lazy, line by line
        process(line)

with open("out.txt", "w") as f:   # "w" truncates, "a" appends
    f.write("hello\n")

# JSON
import json

data = json.loads('{"a": 1}')             # string → dict
text = json.dumps(data, indent=2)         # dict → string

with open("config.json") as f:
    config = json.load(f)                 # file → dict
```

**Always specify `encoding="utf-8"`** — the default differs between operating systems, which causes bugs that only appear on someone else's machine.

---

## 9. Testing

```python
# test_calculator.py
import pytest
from calculator import add, divide

def test_add():
    assert add(2, 3) == 5

def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        divide(1, 0)

@pytest.mark.parametrize("a,b,expected", [
    (2, 3, 5),
    (-1, 1, 0),
    (0, 0, 0),
])
def test_add_many(a, b, expected):
    assert add(a, b) == expected

@pytest.fixture
def sample_user():
    return {"name": "Amit", "age": 25}

def test_user(sample_user):
    assert sample_user["name"] == "Amit"
```

```bash
pytest -v
pytest --cov=myapp
```

**Definition of a fixture:** Reusable setup (and teardown) injected into tests by naming it as a parameter.

---

## 10. Useful standard library modules

| Module | Use |
|---|---|
| `collections` | `defaultdict`, `Counter`, `deque`, `namedtuple` |
| `itertools` | `chain`, `groupby`, `combinations`, `product` |
| `functools` | `lru_cache`, `wraps`, `reduce`, `partial` |
| `datetime` | Dates and times |
| `pathlib` | Modern filesystem paths — prefer over `os.path` |
| `re` | Regular expressions |
| `json`, `csv` | Data formats |
| `logging` | Proper logging instead of `print` |
| `dataclasses` | Boilerplate-free classes |
| `typing` | Type hints |

```python
from collections import Counter, defaultdict, deque

Counter("hello").most_common(2)        # [('l', 2), ('h', 1)]

d = defaultdict(list)
d["key"].append(1)                     # no KeyError on a missing key

queue = deque([1, 2, 3])
queue.appendleft(0)                    # O(1) at both ends, unlike a list
```

```python
from pathlib import Path

p = Path("data") / "file.txt"          # cross-platform path joining
p.exists(), p.read_text(), p.suffix
```

---

## Key points

- **Iterable** has `__iter__`; **iterator** has `__next__`.
- **Generators** (`yield`) are lazy — essential for large files and infinite sequences.
- The **GIL** means threads give no CPU parallelism, but they still help **I/O**.
- CPU-bound → `multiprocessing`. I/O-bound → `threading` or `asyncio`.
- One blocking call inside async code freezes the whole event loop.
- Memory = reference counting + a cyclic garbage collector; `__slots__` saves memory at scale.
- **Type hints** are not enforced at runtime — mypy checks them.
- Always use a **virtual environment** and always specify `encoding="utf-8"`.
- `if __name__ == "__main__"` stops code running on import.
- Learn `collections`, `itertools`, `functools` and `pathlib` — they replace a lot of hand-written code.
