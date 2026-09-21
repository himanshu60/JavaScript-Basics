// In Js , async/await is a modern way to with asynchronous code that makes it easier to read, write,
//  and reason about asynchronous operations. Its build on top of promises and provides a more synchronous-like 
// syntax for handing asynchronous tasks.

// explaination of Ex
// Imagine you're at a coffee shop, and you've placed an order. Instead of waiting at the counter for your coffee
//  (blocking), you take a seat and continue doing other things. You have a token (like a Promise)
//  that indicates your coffee will be ready when it's done. When it's ready, you can collect it (like using await)
//  without interrupting your other activities.

// Example

```
// Simulate ordering coffee (an asynchronous operation).
function orderCoffee(isSuccessful) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isSuccessful) {
        console.log("Coffee is ready!");
        resolve("☕"); // Resolves the Promise with a coffee emoji when ready.
      } else {
        console.log("Coffee machine broke!");
        reject("😭"); // Rejects the Promise with a sad emoji if there's an issue.
      }
    }, 2000); // Simulating a 2-second coffee-making process.
  });
}

// Function using async/await to order and collect coffee.
async function getAndEnjoyCoffee() {
  try {
    console.log("Ordering coffee...");
    const coffee = await orderCoffee(true); // Await the coffee to be ready.
    console.log(`Enjoying ${coffee}`);
  } catch (error) {
    console.error(`Oops! ${error}`);
  }
}

// Call the async function to order and enjoy coffee.
getAndEnjoyCoffee();
console.log("Carrying on with other tasks...");
```
