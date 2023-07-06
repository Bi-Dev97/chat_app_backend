import dbConnect from "./config/dbConnect";
import express, { Express } from "express";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes";
import authRouter from "./routes/authRoutes";
import bodyParser from "body-parser";
import { errorHandlerMiddleware, notFoundMiddleware } from "./middlewares/errorHandlerMiddleware";

/**This index file serves as the entry point for your routes. 
It exports an Express Router instance and defines 
the base URL or prefix for your routes. It 
can also import and use other route files to 
organize your routes into separate modules. */

dotenv.config();

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
const app: Express = express();
const PORT = process.env.PORT || 5433;

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Hello From Chat App Server");
});

// Mount the route files
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);


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
app.listen(PORT, () => {
  console.log(`Server is Running at http://localhost:${PORT}`);
});
