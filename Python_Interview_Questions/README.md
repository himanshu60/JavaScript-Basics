# Python Interview Questions

📄 **[PythonImpQue.md](PythonImpQue.md)** — all 60 questions with answers in one file.

---

## Topic files

| Topic | File | Covers |
|---|---|---|
| **Basics & Data Types** | [PythonBasicsAndDataTypes.md](PythonBasicsAndDataTypes.md) | Data types, mutability, list/tuple/set/dict, strings, slicing, copying, `is` vs `==`, comprehensions, sorting |
| **Functions & OOP** | [FunctionsAndOOP.md](FunctionsAndOOP.md) | `*args`/`**kwargs`, closures, decorators, classes, the four pillars, MRO, dunder methods, dataclasses, exceptions, context managers |
| **Advanced Python** | [AdvancedPython.md](AdvancedPython.md) | Iterators, generators, the GIL, threading vs multiprocessing vs asyncio, memory, type hints, testing, standard library |

## Smaller notes

| Topic | File |
|---|---|
| Decorators | [Decorators.md](Decorators.md) |
| Dictionary | [Dictionary.md](Dictionary.md) |
| Error handling | [ErrorHandling.md](ErrorHandling.md) |
| Function vs method | [Function&Method.md](Function&Method.md) |
| Immutable data types | [ImmutableDataTypes.md](ImmutableDataTypes.md) |
| The `self` keyword | [SelfKeyword.md](SelfKeyword.md) |
| Slicing | [Slicing.md](Slicing.md) |
| Tuple vs list | [tuplevsList.md](tuplevsList.md) |
| List comprehension | [comprehension.md](comprehension.md) |
| Python 2 vs Python 3 | [python2vspython3.md](python2vspython3.md) |

## Practice code

| File | Problem |
|---|---|
| [Palindrome.py](Palindrome.py) | Check if a string is a palindrome |
| [Prime.py](Prime.py) | Check if a number is prime |

---

## All 60 questions ([PythonImpQue.md](PythonImpQue.md))

**Basics (1–15)**
1. What is Python?
2. What are the key features of Python?
3. Is Python dynamically typed or weakly typed?
4. Is Python compiled or interpreted?
5. What are Python's built-in data types?
6. Difference between a list and a tuple?
7. Difference between a list, set and dictionary?
8. What are mutable and immutable types?
9. Why is the mutable default argument a problem?
10. Difference between `is` and `==`?
11. What are falsy values in Python?
12. What does slicing do?
13. Difference between shallow and deep copy?
14. How do you reverse a string?
15. Why is `"".join(list)` preferred over `+=` in a loop?

**Functions (16–24)**
16. What are `*args` and `**kwargs`?
17. What is a lambda function?
18. What is a closure?
19. What is a decorator?
20. What is `@lru_cache`?
21. Difference between `@staticmethod`, `@classmethod` and an instance method?
22. Difference between `global` and `nonlocal`?
23. What is the LEGB rule?
24. Difference between `return` and `yield`?

**OOP (25–35)**
25. What is `self`?
26. What are the four pillars of OOP in Python?
27. Does Python have private variables?
28. Difference between a class attribute and an instance attribute?
29. What is `super()`?
30. What is the MRO?
31. What are dunder (magic) methods?
32. Difference between `__str__` and `__repr__`?
33. What is duck typing?
34. What is a dataclass?
35. If you define `__eq__`, what else must you define?

**Advanced (36–50)**
36. Difference between an iterable and an iterator?
37. What is a generator and why use one?
38. Difference between a list comprehension and a generator expression?
39. What is the GIL?
40. When do you use threading vs multiprocessing vs asyncio?
41. What breaks asyncio?
42. How does Python manage memory?
43. What is `__slots__`?
44. What is a context manager?
45. What are type hints and are they enforced?
46. What does `if __name__ == "__main__"` do?
47. What is a virtual environment and why use one?
48. Difference between `.py` and `.pyc`?
49. What is monkey patching?
50. What is PEP 8?

**Error Handling (51–54)**
51. How do you handle exceptions in Python?
52. Why should you avoid a bare `except:`?
53. What is the `else` clause in a try block for?
54. How do you create a custom exception?

**Practical (55–60)**
55. How do you read a very large file without running out of memory?
56. What are `enumerate` and `zip`?
57. Difference between `sort()` and `sorted()`?
58. What are `Counter`, `defaultdict` and `deque`?
59. Difference between Flask, Django and FastAPI?
60. How do you write tests in Python?

---

## The questions asked most often

| Question | Why it is asked |
|---|---|
| **Mutable default argument** | Catches people who have not hit the bug yet |
| **`is` vs `==`** | Tests understanding of identity vs value |
| **List vs tuple** | Mutability and hashability |
| **Decorators** | Tests closures and first-class functions together |
| **Generators vs lists** | Memory awareness |
| **The GIL** | Separates people who have done concurrency from those who have not |
| **Shallow vs deep copy** | Reference semantics |
| **`self`, `@classmethod`, `@staticmethod`** | Basic OOP fluency |

---

**All questions across all topics:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
