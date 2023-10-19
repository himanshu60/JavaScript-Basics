// Simulate an asynchronous operation that resolves after a delay
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let data = { name: "himanshu", age: 22 };
      resolve(data);
    }, 2000);
  });
}

fetchData()
  .then((res) => {
    console.log(`Data sent sucessfully`, res);
  })
  .catch((err) => {
    console.log(err);
  });
console.log(`req sent`);

// function fetchData() {
//     return new Promise((resolve, reject) => {
//       setTimeout(() => {
//         const data = { name: 'John', age: 30 };
//         // Simulate a successful response
//         resolve(data);
//         // Simulate an error response
//         // reject('Failed to fetch data');
//       }, 2000); // Simulate a 2-second delay
//     });
//   }

//   // Using the Promise
//   fetchData()
//     .then((result) => {
//       console.log('Data fetched successfully:', result);
//     })
//     .catch((error) => {
//       console.error('Error:', error);
//     });

//   console.log('Request sent.'); // Executed immediately
