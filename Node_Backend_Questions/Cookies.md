Cookies are small pieces of data that a web server sends to a user's web browser while the user is browsing a website. These cookies are stored locally on the user's computer and are used to store information about the user or their interactions with the website. Cookies are primarily used to maintain stateful information between different web pages or sessions.

In simple terms, think of cookies as small notes that a website gives to your browser to remember certain things about you. These notes might contain information like your preferences, login status, shopping cart contents, or tracking data. The next time you visit the same website, your browser can send back those notes (cookies) to the website's server, so the website can recognize you or remember what you did on your previous visits.

Set a cookie in a route handler or middleware:

   ```javascript
   app.get('/set-cookie', (req, res) => {
     res.cookie('cookieName', 'cookieValue');
     res.send('Cookie set successfully');
   });
   ```
 In this example, when the client requests the '/set-cookie' route, a cookie named 'cookieName' with the value 'cookieValue' is set in the response.

Access the cookie in subsequent requests:

   ```javascript
   app.get('/get-cookie', (req, res) => {
     const cookieValue = req.cookies.cookieName;
     res.send('Cookie value: ' + cookieValue);
   });
   ```
