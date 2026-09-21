# Below is a summary of the time complexity for common array and object methods in JavaScript:

## **Array Methods:**

1. **push() and pop():** O(1) - Constant time complexity. They add or remove elements at the end of an array.

2. **shift() and unshift():** O(n) - Linear time complexity. They add or remove elements at the beginning of an array, requiring shifting of existing elements.

3. **splice():** O(n) - Linear time complexity. It can add or remove elements at any position in the array, requiring shifting of existing elements.

4. **concat():** O(n) - Linear time complexity. It merges two arrays, creating a new array.

5. **slice():** O(n) - Linear time complexity. It creates a new array by copying elements from the original array.

6. **forEach(), map(), filter(), reduce():** O(n) - Linear time complexity. They iterate over the array elements, performing some operation for each element.

7. **sort():** O(n log n) - Quasilinear time complexity. It sorts the array in place using a comparison-based algorithm like QuickSort or MergeSort.

8. **indexOf() and lastIndexOf():** O(n) - Linear time complexity. They search for an element in the array by iterating through each element.

**Object Methods:**

1. **Accessing Properties (e.g., obj[key]):** O(1) - Constant time complexity. Accessing a property directly by its key is efficient.

2. **Adding and Removing Properties:** O(1) - Constant time complexity. Adding or removing properties to/from an object takes constant time.

3. **Object.keys(), Object.values(), Object.entries():** O(n) - Linear time complexity. They require iterating through all properties of an object.

4. **Object.assign():** O(n) - Linear time complexity. It copies properties from multiple source objects into a target object.

5. **Object.hasOwnProperty():** O(1) - Constant time complexity. It checks whether an object has a specific property.

6. **Object.freeze() and Object.seal():** O(n) - Linear time complexity. They make the object immutable or prevent addition/deletion of properties, requiring iterating through the object's properties.

Note: The actual time complexity of built-in methods can vary depending on JavaScript engine optimizations and the size of the data. These complexities represent the typical case and may not account for all scenarios. It's always a good practice to analyze and understand the time complexity of the methods you are using to ensure optimal performance for your specific use cases.

Sure! Here are a few additional array and object methods in JavaScript:

## **Additional Array Methods:**

1. **find() and findIndex():** O(n) - Linear time complexity. They search for the first matching element and its index in the array.

2. **every() and some():** O(n) - Linear time complexity. They check if all or some elements in the array meet a given condition.

3. **reverse():** O(n) - Linear time complexity. It reverses the elements in place.

4. **fill():** O(n) - Linear time complexity. It fills the array with a static value.

5. **includes():** O(n) - Linear time complexity. It checks if the array contains a specific element.

**Additional Object Methods:**

1. **Object.keys():** O(n) - Linear time complexity. It returns an array of keys present in the object.

2. **Object.values():** O(n) - Linear time complexity. It returns an array of values present in the object.

3. **Object.entries():** O(n) - Linear time complexity. It returns an array of key-value pairs present in the object.

4. **Object.getOwnPropertyNames():** O(n) - Linear time complexity. It returns an array of all property names, including non-enumerable properties.

5. **Object.fromEntries():** O(n) - Linear time complexity. It creates an object from an array of key-value pairs.

6. **Object.setPrototypeOf():** O(1) - Constant time complexity. It sets the prototype (i.e., the "__proto__" property) of an object.

7. **Object.getPrototypeOf():** O(1) - Constant time complexity. It retrieves the prototype (i.e., the "__proto__" property) of an object.

Please note that this list is not exhaustive, as the JavaScript language continues to evolve, and new methods might be introduced in newer ECMAScript versions or browser environments. Always refer to the official JavaScript documentation or specific library documentation for a comprehensive list of available methods and their time complexities.
