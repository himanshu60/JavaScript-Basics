async function fetchData() {
    return new Promise((resolve, reject) => {
      // Simulate an asynchronous operation that might throw an error
      setTimeout(() => {
        const success = Math.random() < 5; // Simulate a success or failure
        if (success) {
          const data = { name: 'John', age: 30 };
          resolve(data);
        } else {
          reject(new Error('Failed to fetch data'));
        }
      }, 2000); // Simulate a 2-second delay
    });
  }
  
  async function fetchDataAndHandleErrors() {
    try {
      const result = await fetchData();
      console.log('Data fetched successfully:', result);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  fetchDataAndHandleErrors()
    .then(() => {
      console.log('Request completed.');
    })
    .catch((error) => {
      console.error('Error in fetchDataAndHandleErrors:', error);
    });
  
  console.log('Request sent.'); // Executed immediately
  