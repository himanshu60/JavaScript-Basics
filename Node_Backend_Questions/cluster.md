In Node.js, a cluster is a built-in module that allows you to create multiple child processes, which are essentially separate instances of your Node.js application. These child processes can run in parallel and distribute the workload of your application across multiple CPU cores, taking advantage of multi-core processors. The cluster module simplifies the process of creating and managing these child processes.

The main role of using clusters in Node.js is to improve the performance and scalability of your application by leveraging the full processing power of a multi-core machine. By splitting your application into multiple processes, each process can handle incoming requests or perform tasks independently, which can lead to better utilization of system resources and improved responsiveness.

Here's a simple example to illustrate how you can use the cluster module in Node.js:

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // This is the master process, which forks child processes.

  // Fork a child process for each CPU core.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for worker exit events and replace them if they crash.
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Create a new worker to replace the one that died.
  });
} else {
  // This is a worker process, each one handles incoming HTTP requests.

  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello, World!\n');
  });

  server.listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

In this example:

1. The master process creates child processes (workers) equal to the number of CPU cores available on the machine.
2. Each worker is responsible for handling incoming HTTP requests. They work in parallel, allowing your application to handle multiple requests simultaneously.
3. If a worker process crashes for any reason, the master process automatically replaces it with a new one.

Using clusters in this way can help your Node.js application take full advantage of your server's resources and improve its performance by parallelizing the workload.