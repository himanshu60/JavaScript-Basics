In JS , a callback is a function that passed as an argument to another function and is executed after them completion of the function.

Callbacks are often used for asynchronous operation,such as reading file, making networking request, or handle user interations, where we dont know exactly the operation will finish, but we want to perform some action when it does.


// Example
```
function doTask(taskname,cb){
    console.log(`starting ${taskname}....`);
    setTimeout(()=>{
        console.log(`${taskname} finished`);
        cb();// Execute the callback function when the task is done.
    },2000);// Simulating a 2-second task delay.
}

function afterTask(){
    console.log(`Task is finished, now I am in cb!`);
}

doTask('interview',afterTask);
console.log("I'm doing something else while waiting for the task to complete.");
```
// Example 2
```
function fetchData(cb){
setTimeout(()=>{
    const data={msg:"data hasbeen fetched"};
    cb(data);
},2000);
}

cb function to handle fetch data
function handleData(data){
    console.log(`Data received,${data.msg}`);
}

Call the fetchData function and pass the handleData callback.
fetchData(handleData);

console.log(`fetching Data....`)
```
