In Python, the following data types are immutable:

1. **int**: Integer values are immutable. When you perform operations that change the value of an integer, a new integer object is created.

2. **float**: Floating-point values are also immutable. Operations on floating-point values create new float objects.

3. **bool**: Boolean values (`True` and `False`) are immutable. Reassigning a variable with a new boolean value creates a new object.

4. **str**: Strings are immutable. When you modify a string, a new string is created with the changes, and the original string remains unchanged.

5. **tuple**: Tuples are immutable sequences of values. Once a tuple is created, its elements cannot be modified, added, or removed. You can create a new tuple with modifications, but the original tuple remains unchanged.

6. **frozenset**: A frozenset is an immutable version of the set data type. Once a frozenset is created, you cannot add or remove elements from it.

7. **bytes**: Bytes are sequences of bytes, and they are immutable. You cannot change the values of individual bytes within a bytes object.

8. **frozenset**: Similar to sets, frozensets are immutable. Once created, you cannot add or remove elements from a frozenset.

9. **namedtuple**: Namedtuples are a type of tuple with named fields. They are also immutable, meaning you cannot change the values of their fields after creation.

Immutability has several advantages, such as making objects hashable (which allows them to be used as keys in dictionaries), ensuring that data remains consistent, and aiding in safe concurrency in multithreaded programs.

On the other hand, data types like lists, dictionaries, and sets are mutable, meaning you can change their contents after they are created. Mutable data types are often used when you need to modify, add, or remove elements dynamically during program execution.