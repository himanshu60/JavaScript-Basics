# Socket.io

Socket.io is a JavaScript library that enables real-time, bidirectional communication between a web server and its clients, typically in web applications. It uses WebSockets, a communication protocol that allows for interactive, two-way communication over a single, long-lived connection. Socket.io abstracts away the complexities of working with raw WebSockets and provides a simple API for developers to implement features like chat applications, online gaming, live updates, and more in web applications. It is widely used for building responsive and interactive web applications that require real-time data exchange between the server and connected clients, ensuring a smooth and engaging user experience.

features and concepts related to Socket.IO:
1)Real-time Communication
2)Event-based Communication
3)Rooms and Namespace:
4)Automatic reconnection

Backend code:
```
const http = require("http");
const express = require("express")
const socketio = require("socket.io");
const app = express();
const server  = http.createServer(app)


const io = socketio(server);
app.use(express.static(__dirname + '/public'));


io.on("connection",(socket)=>{
    console.log("joining");
    socket.emit("message","hello");
    socket.broadcast.emit("message","hello broadcase");
    socket.on("disconnect",()=>{
        io.emit("message","user is left")
    })
})


server.listen(3000,()=>{
    console.log("server is running")
})
```



Fronted code:

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>hello</h1>
</body>
</html>
<script src="socket.io/socket.io.js"></script>
<script src="main.js"></script>

const socket = io();
console.log("data");
socket.on("message", (message) => {
    console.log(message)
})
```

## To handle errors in Socket.IO, you can utilize the error event provided by the library. The error event is emitted when an error occurs in the communication between the client and the server. Here's how you can handle errors in Socket.IO:

On the server-side:

```
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('error', (error) => {
    // Handle the error
    console.error('Socket.IO Error:', error);
  });
});

On the client-side:
const socket = io();

socket.on('connect_error', (error) => {
  // Handle the connection error
  console.error('Socket.IO Connection Error:', error);
});

socket.on('error', (error) => {
  // Handle the general error
  console.error('Socket.IO Error:', error);
});

```
