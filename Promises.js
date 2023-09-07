// In Js , Promises is a way to handle asynchronous operation in a more organized and readable manner.They represent a value that might be available now, in the future, or never.

// Promises have Three states: pending ,resolved(fulfilled),rejected. when the asynchronous operation is completed sucessfully, the promise is resolved with a value. If an error occur during the operation, the promise is rejected with the error.

// Promise Simple Example
// Imagine you're ordering food at a restaurant. You make an order (start an asynchronous operation), and the waiter gives you a "promise" in the form of a receipt. The receipt contains a note saying that your food will be delivered once it's ready. You can continue with other tasks (like chatting with friends) without waiting for your food. When the food is ready, the promise (receipt) is fulfilled, and you receive your meal. If there's a problem (e.g., the kitchen is out of ingredients), the promise is rejected, and you are informed.

// Example 1
function fetchData(){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            const data=true;
            if(data){
                resolve(`Data has been fetched Sucessfully`);
            }else{
                reject(`Failed to fetch Data`);
            }
        },2000);
    })
}

fetchData()
.then((datas)=>{
    return console.log(datas);
})
.catch((err)=>{
    return console.log(err)
})

console.log(`Fetching Data....`)

// Example 2

const fetch = require('node-fetch');

function fetchTodo() {
  return new Promise((resolve, reject) => {
    fetch(`https://jsonplaceholder.typicode.com/todos`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status :${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

fetchTodo()
  .then((todos) => {
    console.log(`Fetch Todos:`, todos);
  })
  .catch((error) => {
    console.log(`error while fetching data:`, error);
  });

console.log(`Fetching Todos....`);
