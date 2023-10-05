# Difference between let var and const?
Ans- `let`, `var`, and `const` are three different ways to declare variables in JavaScript, and they have some key differences in terms of scope, hoisting, and mutability. Here's a breakdown of their differences:

1. **var:**
   - Variables declared with `var` are function-scoped or globally scoped. They are not block-scoped like `let` and `const`.
   - `var` declarations are hoisted to the top of their scope, which means you can access them before their actual declaration in the code.
   - `var` variables can be redeclared within the same scope, which can lead to potential issues.
   - `var` variables can be updated and reassigned.
   
2. **let:**
   - Variables declared with `let` are block-scoped. They are confined to the block, statement, or expression where they are defined.
   - `let` declarations are hoisted to the top of their scope, but they are in the "temporal dead zone" until they are actually declared in the code.
   - `let` variables cannot be redeclared within the same scope, which helps prevent accidental errors.
   - `let` variables can be updated and reassigned.

   **temporal dead Zone**
function exampleFunction() {
  console.log(x); // ReferenceError: Cannot access 'x' before initialization
  let x = 10; // Variable declaration
  console.log(x); // Outputs 10
}

exampleFunction();



3. **const:**
   - Variables declared with `const` are block-scoped, just like `let`.
   - `const` declarations are also hoisted to the top of their scope, and they are in the "temporal dead zone" until they are declared.
   - `const` variables cannot be redeclared or reassigned once they are defined. However, the value they hold can be mutable if it's an object or an array. This means you can modify the properties of an object or the elements of an array declared with `const`.

   const myArray = [1, 2, 3];

console.log(myArray); // Outputs [1, 2, 3]

// You can modify the elements of the array
myArray[0] = 4;
console.log(myArray); // Outputs [4, 2, 3]

// But you cannot reassign 'myArray' to a different array
// This would result in an error:
// myArray = [5, 6, 7]; // Error: Assignment to constant variable

const myObject = { key: 'value' };

console.log(myObject); // Outputs { key: 'value' }

// You can modify the properties of the object
myObject.key = 'new value';
console.log(myObject); // Outputs { key: 'new value' }

// But you cannot reassign 'myObject' to a different object
// This would result in an error:
// myObject = { newKey: 'another value' }; // Error: Assignment to constant variable


Here's a simple comparison:

```javascript
// Using var
var x = 10;
if (true) {
    var x = 20; // This will overwrite the outer x
}
console.log(x); // Output: 20

// Using let
let y = 10;
if (true) {
    let y = 20; // This creates a separate block-scoped y
}
console.log(y); // Output: 10

// Using const
const z = 10;
// z = 20; // Error: Assignment to constant variable.
```

In modern JavaScript development, it's generally recommended to use `const` by default and only use `let` when you need to reassign the variable. This helps ensure that your variables remain as immutable as possible, making your code more predictable and easier to reason about.
 Ex- // Using var
for (var i = 0; i < 5; i++) {
    setTimeout(function() {
        console.log("Var loop index:", i);
    }, 100);
}

// Using let
for (let j = 0; j < 5; j++) {
    setTimeout(function() {
        console.log("Let loop index:", j);
    }, 100);
}
Result-
Let loop index: 0
Let loop index: 1
Let loop index: 2
Let loop index: 3
Let loop index: 4
Var loop index: 5
Var loop index: 5
Var loop index: 5
Var loop index: 5
Var loop index: 5
