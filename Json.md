Here are some simple key points about JSON:

1. **JSON Definition:** JSON stands for "JavaScript Object Notation" and is a lightweight data-interchange format.

2. **Data Structure:** JSON is based on two primary data structures: objects (unordered collections of key-value pairs) and arrays (ordered lists of values).

3. **Key-Value Pairs:** In JSON objects, data is stored as key-value pairs. Keys are strings, and values can be strings, numbers, booleans, null, objects, or arrays.

4. **Syntax:** JSON uses a simple syntax with curly braces `{}` for objects and square brackets `[]` for arrays. It uses colons `:` to separate keys and values and commas `,` to separate elements within arrays and objects.

5. **Human-Readable:** JSON is easy for humans to read and write because of its text-based format.

6. **Language-Agnostic:** JSON is not tied to any specific programming language and can be used with many different languages.

7. **Interoperability:** JSON is widely used for data interchange between web services, making it a popular choice for APIs.

8. **Parsing:** JSON data can be easily parsed by programming languages using built-in functions like `JSON.parse()` (for parsing) and `JSON.stringify()` (for serialization).

9. **Common Use Cases:** JSON is commonly used for configuration files, data storage, and exchanging data between a client and server in web applications.

10. **Subset of JavaScript:** JSON is a subset of JavaScript, making it compatible with JavaScript code. JSON objects can be used directly in JavaScript.

11. **Example:** Here's a simple JSON object:

   ```json
   {
     "name": "John",
     "age": 30,
     "isStudent": false
   }
   ```

12. **Error Handling:** JSON data should adhere to strict formatting rules, and parsing JSON may result in errors if the data is not valid JSON.

Remember that JSON's simplicity, readability, and versatility have contributed to its widespread adoption for various data exchange and storage purposes in software development and beyond.

Example1:

```
let obj = {
  name: "himanshu",
  age: 22,
  isMarried: false,
};

function convert(obj) {
  let json = [];
  for (let key in obj) {
    json.push(`"${key}": "${obj[key]}"`);
  }
  let jsonData = json.join(", ");
  console.log(`{${jsonData}}`);
}

convert(obj);
```

Example2:

```
let arrayOfObjects = [
  {
    name: "himanshu",
    age: 22,
    isMarried: false,
  },
  {
    name: "John",
    age: 30,
    isMarried: true,
  },
];

function convertArray(array) {
  let jsonArray = [];

  for (let i = 0; i < array.length; i++) {
    let obj = array[i];
    let json = [];

    for (let key in obj) {
      json.push(`"${key}": "${obj[key]}"`);
    }

    jsonArray.push(`{${json.join(", ")}}`);
  }

  console.log(`[${jsonArray.join(", ")}]`);
}

convertArray(arrayOfObjects);
```