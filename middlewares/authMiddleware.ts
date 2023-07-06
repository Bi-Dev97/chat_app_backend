import { RequestHandler, Response, Request, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import jwt, {JwtPayload} from "jsonwebtoken";
import User from "../models/User";


/**    interface CustomRequest: This line defines a new TypeScript
 interface called CustomRequest. Interfaces in TypeScript are used
  to define the shape of an object and specify its properties and 
  their types.
    extends Request: The CustomRequest interface extends the Request
     interface from the Express library. By extending the Request 
     interface, CustomRequest inherits all the properties and methods
      defined in the Request interface.
    user: any: This line adds a new property user to the CustomRequest
     interface. The user property is defined with the type any, 
     which means it can hold any value. However, it is recommended
      to replace 'any' with a more specific and appropriate type for
       the user object in your application. By doing so, you can 
       enforce type checking and benefit from TypeScript's static 
       type analysis.
The purpose of extending the Request interface and adding the 
user property to the CustomRequest interface is to augment the 
existing Request object provided by Express with an additional 
property that represents the authenticated user. This allows 
you to access and manipulate the user property throughout 
your application's middleware and route handlers without 
causing TypeScript type errors.
 */
interface CustomRequest extends Request {
  user: any; // Replace 'object' with the appropriate type for the user object
}

/**The authMiddleware is used to protect routes or endpoints in your application by ensuring that the incoming requests are from authenticated users. It acts as a 
middleware function that is executed before the route handler.
The purpose of the authMiddleware is to check for the presence of
 a valid authentication token in the request, verify its authenticity, 
 and extract any necessary user information from it. It then sets the 
 user information on the req object for further processing by the route
  handler or other middleware functions. */
const authMiddleware: RequestHandler =async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'

  // Get the token from the request header
  const token = customReq?.headers?.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);

    // Find the user in database with the id in decoded object
    /**I used a type assertion (decoded as JwtPayload) to explicitly
     tell TypeScript that the decoded value should be treated as
      type JwtPayload. This allows TypeScript to recognize the 
      'userId' property on the JwtPayload type. */
    const findUser = await User.findById((decoded as JwtPayload)?.userId);

    // Set the decoded payload on the request object
    customReq.user = findUser;

    console.log(customReq.user);

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default asyncHandler(authMiddleware);
