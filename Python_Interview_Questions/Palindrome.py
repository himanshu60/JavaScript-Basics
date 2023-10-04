# for string

def is_palindrome(input_string):
    # Remove spaces and convert to lowercase for case-insensitive comparison
    input_string = input_string.replace(" ", "").lower()
    
    # Compare the string with its reverse
    return input_string == input_string[::-1]

# Input from the user
user_input = input("Enter a string: ")

if is_palindrome(user_input):
    print("It's a palindrome!")
else:
    print("It's not a palindrome.")


# For Number

def is_palindrome(number):
    # Convert the number to a string for easy comparison
    number_str = str(number)
    
    # Compare the string with its reverse
    return number_str == number_str[::-1]

# Input from the user
user_input = int(input("Enter a number: "))

if is_palindrome(user_input):
    print("It's a palindrome!")
else:
    print("It's not a palindrome.")
