import dbConnect from "./config/dbConnect";
import express, { Express } from "express";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes";
import authRouter from "./routes/authRoutes";
import messageRouter from "./routes/messageRoutes";
import bodyParser from "body-parser";
import { errorHandlerMiddleware, notFoundMiddleware } from "./middlewares/errorHandlerMiddleware";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import roomRouter from "./routes/roomRoutes";




/**This index file serves as the entry point for your routes. 
It exports an Express Router instance and defines 
the base URL or prefix for your routes. It 
can also import and use other route files to 
organize your routes into separate modules. */



/**In TypeScript, you can use type annotations 
(: Express) to explicitly specify the type of
 a variable. This helps ensure that the variable
  is used correctly and provides more accurate 
  type information throughout your codebase.
By using const app: Express = express();, 
you are ensuring that the app variable is of 
type Express and can be used as an instance of 
the Express application with the associated 
methods and properties provided by  */
const app: Express = express();/**express() creates an instance 
of the Express application, which is assigned to the app variable. 
You can then use the app variable to configure your application 
and define your routes. */


// Your application configuration and routes go here
dotenv.config();
const PORT = process.env.PORT || 5433;
const server = createServer(app);


/**With this setup, when the sendMessage endpoint is called, 
the message details (receiver and content) are emitted to the
 WebSocket server using Socket.IO. The server then broadcasts
  the message to the specific receiver's socket using the 
  receiver identifier. The receiver's socket will receive 
  the 'messageReceived' event and can handle it accordingly. */
// Create the WebSocket server
export const io = new Server(server);

// Listen for incoming connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for the 'newMessage' event
  socket.on('newMessage', ({ receiver, content }) => {
    // Handle the new message event
    // You can retrieve the receiver's socket ID or any other identifier from the message
  
    // Broadcast the message to the receiver
    socket.to(receiver).emit('messageReceived', { content });
  });

  // Handle other socket events
   // Socket.IO event to handle adding members to a room
   socket.on('addMembers', ({ roomId, members }) => {
    // Implement your logic to add members to the room

    // Emit a custom event to inform the clients in the room about the new members
    socket.to(roomId).emit('membersAdded', { roomId, members });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

});






server.listen(5101, () => {
  console.log('WebSocket server listening on port 5101');
});

// If you are using typescript include this declare block
// Used to extend express Request (req) type definition


// Initialize the db connection
dbConnect();

// Middleware to parse incoming request bodies
/**In the code above, we import the body-parser 
package and add it as middleware to the Express app using app.use().
 We configure body-parser to handle JSON bodies with bodyParser.json(),
  and extended URL-encoded bodies with bodyParser.urlencoded({ extended: true }).
The body-parser middleware allows you to access the 
request body data in your route handlers. It parses 
the request body and makes it available on the req.body object. */
app.use(morgan("dev")); /** Morgan is an HTTP request level Middleware. 
It is a great tool that logs the requests along with some other 
information
depending upon its configuration and the preset used.*/




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser()); /**Use to parse cookies send in 
the request and transform them in JSON object */

app.get("/", (req, res) => {
  res.send("Hello From Chat App Server");
});

// Mount the route files
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/rooms", roomRouter)


// Other app configurations and middleware

// Apply the "Not Found" middleware
/**By placing the "Not Found" middleware before the error handling 
middleware, any unmatched routes will trigger this middleware 
and subsequently pass the error to the error handling middleware
 for proper error response handling.
Using this middleware, you can provide a consistent and meaningful
 response when the requested route is not found in your application. */
app.use(notFoundMiddleware);

// Apply the error handling middleware
/**To use this error handling middleware in your Express application, 
you can apply it as the last middleware in your middleware chain 
or as a catch-all error handler. 
By using this error handling middleware, any unhandled errors that 
occur in your application's routes or other middleware will be caught
 and processed by this middleware. It ensures that a consistent error
  response is sent back to the client, making it easier to handle and
   troubleshoot errors in your application.*/
app.use(errorHandlerMiddleware)

/**Note that app.listen() is used to start the server and listen for 
incoming requests on the specified port */
app.listen(PORT, () => {
  console.log(`Server is Running at http://localhost:${PORT}`);
});


