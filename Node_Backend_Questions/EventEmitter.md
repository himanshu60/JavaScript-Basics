In Node.js, the `EventEmitter` is a core module that provides an implementation of the observer pattern, allowing objects to listen for and respond to events. It's a fundamental part of many Node.js applications, including web servers, where it's used to handle asynchronous operations like handling incoming requests and responses.

Here's how you can use the `EventEmitter` in Node.js:

1. **Import the `EventEmitter` module:**

   ```javascript
   const EventEmitter = require('events');
   ```

2. **Create an instance of the `EventEmitter` class:**

   ```javascript
   const myEmitter = new EventEmitter();
   ```

3. **Register event listeners:**

   You can register event listeners using the `on()` or `addListener()` methods. These listeners are functions that will be executed when a specific event occurs.

   ```javascript
   myEmitter.on('myEvent', () => {
     console.log('Event occurred!');
   });

   myEmitter.on('customEvent', (data) => {
     console.log(`Custom event received with data: ${data}`);
   });
   ```

4. **Emit events:**

   You can emit events using the `emit()` method. This triggers the registered listeners for that event.

   ```javascript
   myEmitter.emit('myEvent');
   // Output: Event occurred!

   myEmitter.emit('customEvent', 'Hello, World!');
   // Output: Custom event received with data: Hello, World!
   ```

5. **Remove event listeners:**

   You can remove specific event listeners using the `removeListener()` method.

   ```javascript
   function myListener() {
     console.log('Listener is called.');
   }

   myEmitter.on('removeMe', myListener);

   myEmitter.emit('removeMe'); // Listener is called.
   
   myEmitter.removeListener('removeMe', myListener);

   myEmitter.emit('removeMe'); // No output; listener removed.
   ```

6. **Once listeners:**

   You can use the `once()` method to register a listener that is called only once and automatically removed after execution.

   ```javascript
   myEmitter.once('onceEvent', () => {
     console.log('This listener is called once.');
   });

   myEmitter.emit('onceEvent'); // This listener is called once.
   myEmitter.emit('onceEvent'); // No output; listener removed.
   ```

7. **Error handling:**

   The `EventEmitter` also has built-in error handling. If an error event is emitted and no listener is registered for it, Node.js will print the error stack trace to the console.

   ```javascript
   myEmitter.emit('error', new Error('Something went wrong.'));
   // Output: Unhandled 'error' event.
   // Error: Something went wrong.
   // ...
   ```

The `EventEmitter` is a powerful tool for managing events and asynchronous communication in Node.js applications. It's commonly used in various Node.js modules and libraries, such as web servers, to handle events like incoming HTTP requests or database queries.