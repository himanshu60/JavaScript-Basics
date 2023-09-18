# what are different types of middleware available in time logger and how they differ

middleware serve different purposes and are executed in a specific order during the request-response cycle.

Application-level middleware:
Application-level middleware is registered at the application level and is applicable to all routes or a specific subset of routes. It is executed for every incoming request. This type of middleware is used for tasks such as logging, error handling, authentication, and setting up global variables. It can be added using app.use() or app.<HTTP_METHOD>() methods provided by Express or other Node.js frameworks.

Router-level middleware:
Router-level middleware is specific to a particular router instance and is applied to routes defined within that router. It allows you to group related routes together and apply common functionality to them. Router-level middleware is useful for tasks such as route-specific authentication, request validation, or data preprocessing. It is added using router.use() or router.<HTTP_METHOD>() methods.

Error-handling middleware:
Error-handling middleware is used to handle errors that occur during the request-response cycle. It is typically defined at the end of the middleware chain. Error-handling middleware takes four arguments (err, req, res, next) and is responsible for handling and responding to errors. It allows you to centralize error handling and provide consistent error responses to clients.

Third-party middleware:
Third-party middleware are modules or packages created by external developers that provide additional functionality. Examples include body-parser for parsing request bodies, multer for handling file uploads, and helmet for enhancing application security. These middleware can be easily integrated into your application using npm or yarn package managers.

Time Logger: A time logger middleware is a type of middleware used to log the time taken to process a request. It captures the start time before the request is handled and calculates the duration once the response is sent. Here's an example of a time logger middleware in Express.js:


const express = require('express');
const app = express();

// Time logger middleware
const timeLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${req.method}] ${req.originalUrl} - ${duration}ms`);
  });

  next();
};

// Register the time logger middleware
app.use(timeLogger);

// Route handlers
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/users', (req, res) => {
  // Simulating a delay of 1 second
  setTimeout(() => {
    res.send('List of users');
  }, 1000);
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});

