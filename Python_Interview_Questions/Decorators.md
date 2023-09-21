Decorators in Python are a powerful and flexible way to modify or enhance the behavior of functions or methods without changing their code. Decorators are often used for tasks such as logging, access control, authentication, and more. They allow you to wrap a function with another function, often referred to as a "decorator function," which adds functionality to the original function.

Here's how decorators work in Python:

1. **Defining a Decorator Function:** You start by defining a decorator function. This function typically takes another function as its argument.

   ```python
   def my_decorator(func):
       def wrapper():
           # Code to execute before the original function
           print("Something is happening before the function is called.")
           func()  # Call the original function
           # Code to execute after the original function
           print("Something is happening after the function is called.")
       return wrapper  # Return the wrapper function
   ```

2. **Applying the Decorator:** You apply the decorator to a function using the `@` symbol followed by the decorator function's name.

   ```python
   @my_decorator
   def say_hello():
       print("Hello!")
   ```

3. **Calling the Decorated Function:** When you call the decorated function (`say_hello()` in this case), it is actually executing the `wrapper()` function inside the decorator.

   ```python
   say_hello()
   ```

   Output:
   ```
   Something is happening before the function is called.
   Hello!
   Something is happening after the function is called.
   ```

The decorator `my_decorator` added functionality before and after the `say_hello()` function call without modifying the original `say_hello()` function.

You can use decorators for various purposes, and they can also accept arguments. Python provides built-in decorators like `@staticmethod`, `@classmethod`, and others. Additionally, you can create custom decorators to suit your specific needs.

Decorators are a powerful tool in Python that helps keep your code clean, modular, and easy to maintain by separating concerns and applying cross-cutting functionality to functions or methods.