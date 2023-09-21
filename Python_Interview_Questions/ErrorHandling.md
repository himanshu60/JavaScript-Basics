Errors in Python are handled using try and except blocks, which allow you to gracefully handle exceptions (errors) that may occur during program execution. This helps prevent your program from crashing and allows you to respond to errors in a controlled manner. Here's an example using try and except blocks:

```python
try:
    # Code that may raise an exception
    num1 = int(input("Enter a number: "))
    num2 = int(input("Enter another number: "))
    result = num1 / num2

except ZeroDivisionError:
    # Handle division by zero error
    print("Error: Division by zero is not allowed.")
except ValueError:
    # Handle invalid input (non-integer) error
    print("Error: Please enter valid integers.")
except Exception as e:
    # Handle other exceptions (generic exception handling)
    print(f"An error occurred: {e}")

else:
    # Code to execute if no exception is raised
    print(f"Result of division: {result}")

finally:
    # Code to execute regardless of whether an exception occurred
    print("Execution completed.")

# Rest of the program continues...
```

In this example:

1. The `try` block contains the code that may raise exceptions, such as division by zero or invalid input.

2. The `except` block(s) are used to catch and handle specific types of exceptions. In this case, we catch `ZeroDivisionError` for division by zero and `ValueError` for invalid input. You can also have a generic `except` block to catch all other exceptions.

3. If an exception matching one of the `except` blocks occurs, the corresponding block is executed. If no exception occurs, the `else` block is executed.

4. The `finally` block contains code that is always executed, whether or not an exception occurred. It's typically used for cleanup tasks.

Here's how the program behaves with different inputs:

- Entering valid numbers: It calculates and prints the result, and the "Execution completed" message is shown.
- Entering a denominator of 0: It catches the `ZeroDivisionError` and prints the corresponding error message, followed by "Execution completed."
- Entering non-integer input: It catches the `ValueError` and prints the corresponding error message, followed by "Execution completed."
- Any other exception: If an unexpected exception occurs, it's caught by the generic `except` block, and an error message is displayed, followed by "Execution completed."

Using try and except blocks allows you to handle errors gracefully and ensure that your program can continue executing even in the presence of unexpected issues.