# with Function

def is_prime(number):
    count = 0
    i = 1

    while i <= number:
        if number % i == 0:
            count += 1
        i += 1

    if count == 2:
        return True
    else:
        return False

n = int(input("Enter a Number: "))

if is_prime(n):
    print(n, "is a Prime number")
else:
    print(n, "is Not a prime number")


# without Function while loop

n = int(input("Enter a Number: "))
count = 0
i = 1

while i <= n:
    if n % i == 0:
        count += 1
    i += 1

if count == 2:
    print(n, "is a Prime number")
else:
    print(n, "is Not a prime number")


# without function with for loop

n=int(input("Enter the Number : "))
for i in range(2,n):
    if n%i==0:
        print(n, "is not a prime Number")
        break;
else:
    print(n, "Its a prime Number")