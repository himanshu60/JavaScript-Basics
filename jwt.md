// In Node.js, JWT stands for "JSON Web Token." It's a compact and self-contained way to represent information
// securely between two parties. JWTs are commonly used in web applications for authentication and data exchange.

// Here's a simplified explanation of what JWT does in Node.js:

// 1. Authentication: JWTs are often used to verify that a user is who they claim to be when they log in.
// After a user successfully logs in, the server generates a JWT and sends it to the client.
// The client then includes this token in future requests to prove their identity without needing to send their
// username and password with each request.

// 2. Information Exchange: JWTs can carry information or claims in a compact way between different parts of an
//  application. These claims can include user details, permissions, or any other data needed to make decisions
// in the application.

// 3. Security: JWTs are digitally signed, which means they can be verified to ensure their authenticity.
// This helps prevent unauthorized users from tampering with the data stored in the token.

const jwt = require("jsonwebtoken");

// Creating a JWT
const secretKey = "yourSecretKey";
const payload = { userId: 123, username: "john.doe" };
const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });

console.log("Generated JWT:", token);

// Verifying a JWT
jwt.verify(token, secretKey, (err, decoded) => {
  if (err) {
    console.error("Token verification failed:", err);
  } else {
    console.log("Decoded Token:", decoded);
  }
});
