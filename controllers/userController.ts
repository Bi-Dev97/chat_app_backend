import { Request, Response, RequestHandler } from "express";
import User from "../models/User";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import isValidMongoId from "../utils/mongodbIdValidator";
import { isValidObjectId } from "mongoose"; // This library do the same job as isValidMongoId
import { ParamsDictionary } from "express-serve-static-core";
const sendMail = require("./emailController");

/**    interface CustomRequest: This line defines a new TypeScript 
interface called CustomRequest. Interfaces in TypeScript are 
used to define the shape of an object and specify its properties
 and their types.
    extends Request: The CustomRequest interface extends the 
    Request interface from the Express library. By extending the 
    Request interface, CustomRequest inherits all the properties 
    and methods defined in the Request interface.
    user: { _id: string }: This line adds a new property user to the
     CustomRequest interface. The user property is defined with the
      type { _id: string }, which represents an object with a single
       _id property of type string. This is an example type, and you
        should replace it with the appropriate type for the user 
        object in your application.
The purpose of extending the Request interface and adding 
the user property to the CustomRequest interface is to augment
 the existing Request object provided by Express with an additional
  property that represents the authenticated user. In this case, 
  the user property is expected to contain an object with an 
  id field representing the user's identifier. 
  By using the CustomRequest interface, you can access and manipulate 
  the user property throughout your application's middleware and route
   handlers without causing TypeScript type errors. This allows you 
   to provide type safety and enforce consistent usage of the user 
   property in your code.*/
interface CustomRequest extends Request {
  user: { _id: string }; // Replace with the appropriate type for the user object
}

/**By wrapping your async controller actions with asyncHandler, 
you don't need to explicitly catch errors within each action.
 Any errors thrown within the action will
 automatically be caught and passed to the Express error
  handling middleware.
This simplifies your code and allows you to 
focus on the main logic of your controller actions,
 while the error handling is taken care of by express-async-handler. 
 Using express-async-handler is optional but can be helpful for keeping
  your code concise and improving error handling in your Express APIs.*/

// Create a new user
export const createUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // Check if user already exists with the provided email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }
    // Send confirmation email with registration link

    const emailOptions = {
      to: email,
      subject: "Confirm your registration",
      text: "Please click on the following link to confirm your registration: http://localhost:3000/",
    };

    // Send the confirmation email
    sendMail(emailOptions);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user and save the hashed password
    const newUser = await User.create({
      ...req.body,
      password: hashedPassword,
    });
    res.status(201).json({
      status: true,
      message: "User created successfully!",
      newUser,
    });
  }
);

export const getUsers: RequestHandler = asyncHandler(async (req, res) => {
  const users = await User.find({}, { refreshToken: 0, token: 0 }).populate("messages");
  res.json(users);
});

export const getUserById: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongoId(id);
  const user = await User.findById(id).select('-refreshToken -token');
  // Excluding the refreshToken and accessToken fields from the query result
  
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user);
});

export const updateUser: RequestHandler = asyncHandler(async (req, res) => {
  const customReq = req as CustomRequest;
  const userId = customReq?.user?._id;
  isValidMongoId(userId);
  const { firstName, lastName, email, image, mobile } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.image = image; // Update the image field
  user.mobile = mobile;
  user.email = email;

  const updatedUser = await user.save();
  res.json(updatedUser);
});

export const updatePassword: RequestHandler = asyncHandler(async (req, res) => {
  const customReq = req as CustomRequest;
  const userId = customReq?.user?._id;
  isValidMongoId(userId);
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // Check if the current password matches
  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatch) {
    res.status(401).json({ message: "Incorrect current password" });
    return;
  }
  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update the password in the user object
  user.password = hashedPassword;
  const updatedUser = await user.save();
  res.json(updatedUser);
});

export const deleteUser: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  isValidMongoId(id);
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ message: "User deleted successfully" });
});

// ...

export const blockUser: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // Update the isBlocked field to true
  user.isBlocked = true;

  const updatedUser = await user.save();
  res.json(updatedUser);
});

export const unblockUser: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // Update the isBlocked field to false
  user.isBlocked = false;

  const updatedUser = await user.save();
  res.json(updatedUser);
});

export const getProfile: RequestHandler = asyncHandler(async (req, res) => {
  const customReq = req as CustomRequest;
  const userId = customReq?.user?._id;
  isValidObjectId(userId);

  // Fetch the user profile from the database
  const user = await User.findById(userId);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

/**The type declaration RequestHandler<ParamsDictionary, 
any, any, Request["query"]> defines the type of the 
updateUserRole function as a request handler that accepts 
specific parameter types and returns a specific response type.
Here's a breakdown of the type declaration:
    RequestHandler: This is a type provided by Express 
    that represents a request handler function.
    <ParamsDictionary, any, any, Request["query"]>: These 
    are type parameters passed to the RequestHandler type,
     specifying the expected types for the request parameters
      and response.
        ParamsDictionary: This specifies the type for the request 
        parameters. It is used to define the type of req.params object.
        any: This specifies the type for the response body. In this case,
         it is set to any, indicating that the response body can be of 
         any type.
        any: This specifies the type for the response headers. In this case,
         it is set to any, indicating that the response headers can be of 
         any type.
        Request["query"]: This specifies the type for the request query 
        parameters. It uses 
                the Request["query"] syntax to refer to the type of the 
                query property in the Request object. The query property 
                represents the parsed query string parameters.
Putting it all together, updateUserRole: RequestHandler<ParamsDictionary,
 any, any, Request["query"]> defines updateUserRole as a request handler
  function that expects ParamsDictionary for request parameters, any for
   the response body, any for the response headers, and the type of 
   req.query matching the type of the query parameters.
By specifying these types, you provide type safety and enable 
the TypeScript compiler to perform type checks and ensure the 
correctness of the function's usage.
 */
export const updateUserRole: RequestHandler<
  ParamsDictionary,
  any,
  any,
  Request["query"]
> = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    // Find the user by userId
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's role
    user.role = role;
    await user.save();

    res.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
