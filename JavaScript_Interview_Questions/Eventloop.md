// In JS , the event loop is a fundamental concept that allows JS to manage asynchronous operation.
// It is the mechanism that controls the execution of code in a non-blocking way, 
// ensure that your program can continue run smoothly.

// Example
```
console.log(`Start the Program`);
// This function simulates an asynchronous task (like reading a file or making an HTTP request).
function asyncTask(){
    setTimeout(()=>{
        console.log(`async task is done...`);
    },2000);
}

asyncTask();
console.log(`End the Program`);
```
