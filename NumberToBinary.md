// let number=5;
// let binaryNumber=number.toString(2);
// console.log(binaryNumber)


let number=10;
let binaryNumber=Number(number.toString(2));
console.log(binaryNumber)


In JavaScript, you can convert a decimal (base-10) number into its binary (base-2) representation using the `toString()` method or the `Number.toString()` method with a radix of `2`. Here's how you can do it:

Method 1: Using the `toString()` method:

```javascript
const decimalNumber = 42; // Replace this with your decimal number
const binaryString = decimalNumber.toString(2);
console.log(binaryString); // This will print the binary representation of the number
```

In this code, we first define a decimal number (`decimalNumber`), and then we use the `toString(2)` method to convert it to a binary string. The `2` passed as an argument to `toString()` specifies the radix, which indicates that we want to convert the number to a binary representation.

Method 2: Using the `Number.toString()` method:

```javascript
const decimalNumber = 42; // Replace this with your decimal number
const binaryString = Number(decimalNumber).toString(2);
console.log(binaryString); // This will print the binary representation of the number
```

This method is similar to the first one, but it explicitly converts the decimal number to a Number object before using `toString(2)`.

Both methods will give you the binary representation of the decimal number as a string. For example, if you use either of these methods with `decimalNumber` set to `42`, the output will be `'101010'`, which is the binary representation of 42.