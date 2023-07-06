import { Request, Response, NextFunction } from "express";

/** Not Found Error Handler */
/** the notFoundMiddleware function is a middleware that is executed when 
no other routes or middleware match the incoming request. It creates
 a new Error object with a message that includes the original URL from the request.
It sets the response status code to 404 (Not Found) using res.status(404).
Finally, it passes the error to the next function, which will trigger 
the error handling middleware or any subsequent error handling middleware in your middleware chain. */
export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**Error Handler */
/**the errorHandlerMiddleware function takes four 
parameters: err, req, res, and next. The err parameter
 represents the error that occurred, and req, res, 
 and next are the standard Express request, response,
  and next function. 
  You can then set the response status code, 
  such as 500 for Internal Server Error, using res.status().
  Finally, you can send the error response to the client in 
  JSON format using res.json(). You can customize the error
   message or include additional error details as needed.*/
export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set the response status code
  const statuscode = res.statusCode ? res.statusCode : 500;
  res.status(statuscode);

  // Send the error response to the client
  res.json({
    status: false,
    message: err?.message,
    stack: err?.stack,
  });
};
