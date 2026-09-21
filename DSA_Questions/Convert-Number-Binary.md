# Convert number into binary digit


# First Approach

```code
let num = 10
let ans = num.toString(2);
console.log(ans)
```

# Second Approach

```code
function decimalToBinary(decimalNumber) {
  let binaryString = '';
  while (decimalNumber > 0) {
    binaryString = (decimalNumber % 2) + binaryString;
    decimalNumber = Math.floor(decimalNumber / 2);
  }
  return binaryString || '0'; // Return '0' for input of 0
}

const decimalNumber = 1101;
const binaryString = decimalToBinary(decimalNumber);
console.log(binaryString); // Output: "10001001101"
```
