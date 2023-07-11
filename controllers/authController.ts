import { RequestHandler, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User";
// Import necessary libraries for Google authentication
import { OAuth2Client } from "google-auth-library";
import asyncHandler from "express-async-handler";
import crypto from "crypto";
const sendMail = require("./emailController");

// Function to generate an access token
/**    const generateAccessToken: This line declares a constant 
variable named generateAccessToken which represents a function 
that generates an access token.
    (userId: string): This part specifies the function's parameter. 
    The userId parameter is of type string and represents the user 
    identifier.
    : string: This part specifies the return type of the function. 
    In this case, the function returns a value of type string, which
     is the generated access token.
    jwt.sign: This line calls the sign method from the jwt library. 
    The sign method is used to generate a JSON Web Token (JWT).
    { userId }: This is the payload object passed to the sign method. 
    It typically contains data that you want to include in the token, 
    such as the user identifier. In this case, it includes the userId 
    property with the value of the userId parameter passed to the 
    generateAccessToken function.
    process.env.JWT_SECRET_KEY!: This is the secret key used to sign 
    the token. It is accessed from the environment variables using 
    process.env. The ! is a non-null assertion operator, indicating 
    that the value is expected to be present in the environment variables.
    { expiresIn: "1d" }: This is an options object passed to the 
    sign method. It specifies that the generated token should 
    expire after one day ("1d").
    return token;: This line returns the generated access token.
The purpose of this function is to generate an access token for a 
given user identifier (userId). It uses the jwt.sign method to sign 
the payload and generate a JWT with an expiration time of one day. 
The generated token is then returned by the function.
You can use this generateAccessToken function to generate an access 
token for authenticated users in your application.
 */
const generateAccessToken = (userId: string): string => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY!, {
    expiresIn: "1d",
  });
  return token;
};

// Function to generate a refresh token
/**When a user logs in or authenticates for the first time, 
both an access token and a refresh token are generated and 
returned to the client.
The refresh token serves as a long-lived token that can 
be stored securely on the client-side, typically in a 
secure HTTP-only cookie or local storage. Unlike the 
access token, the refresh token is not sent with every 
request to the server. Instead, it is used to obtain a 
new access token when the current access token expires. */
const generateRefreshToken = (userId: string): string => {
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET_KEY!,
    {
      expiresIn: "7d",
    }
  );
  return refreshToken;
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });

  // Check if user exists
  if (!user) {
    return res
      .status(401)
      .json({ message: "Invalid credentials, user not found." });
  }

  // Compare password with stored hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (user && isPasswordValid) {
    // Generate tokens
    const refreshToken = generateRefreshToken(user?.id);
    const updateUser = await User.findByIdAndUpdate(
      user?.id,
      {
        refreshToken: refreshToken,
      },
      {
        /**
              By default, findOneAndUpdate() returns 
              the document as it was before update was applied. 
              If you set new: true, findOneAndUpdate() 
              will instead give you the object after update was applied.
               */
        new: true,
      }
    );
    // Set refresh token as an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Update user model with tokens

    // Return the access token and user details
    res.status(200).json({
      _id: user?._id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      mobile: user?.mobile,
      token: generateAccessToken(user?._id),
    });
  } else {
    throw new Error("Invalid credentials");
  }
};

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
interface GooglePayload {
  email: string;
  given_name: string;
  family_name: string;
}
export const googleLogin: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { token } = req.body; /**The  Google ID token is obtain during 
  the client-side authentication process. */

  try {
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload() as GooglePayload;
    const { email, given_name, family_name } = payload;
    /** or we can do like const { email, given_name, family_name } =
      ticket?.getPayload() ?? {}; /**we perform a null check for 'ticket' 
    using the optional chaining operator "?.". Then, 
    we retrieve the values of the 'email' and 'name' 
    properties using the "?."
     operator on the resulting 'payload' object.
    This approach helps to avoid errors when 'ticket' 
    is null or when the expected properties are not 
    present in 'payload'. The "?? {}" operator is the nullish coalescing operator, 
    which returns an empty object ({}) if the result of 
    'ticket?.getPayload()' is undefined.
    Nullish coalescing is an operator used in many programming languages, including JavaScript and TypeScript, to provide
     a fallback value when the value of an expression is null or undefined.
By using the nullish coalescing operator (??), you can specify a
 fallback value that will be returned if the expression on the left side of the operator is null or undefined.
  The nullish coalescing operator is useful when you want to assign a default value to a variable or expression 
  when the initial value is null or undefined.*/

    // Check if the user already exists in the database
    let user = await User.findOne({ email });

    if (!user) {
      // If the user doesn't exist, create a new user
      user = new User({
        email,
        firstName: given_name,
        lastName: family_name,
        role: "user",
      });
      await user.save();
    } else {
      // If the user already exists, update the firstName and lastName
      user.firstName = given_name;
      user.lastName = family_name;
      await user.save();
    }

    // Generate an access token and refresh token
    const accessToken = generateAccessToken(user?.id);
    const refreshToken = generateRefreshToken(user?.id);

    // Update user model with tokens
    user.token = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    // Send the access token and refresh token as the response
    res.json({ user });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if user exists and is an admin
  const user = await User.findOne({ email, role: "admin" });

  if (!user) {
    res.status(401).json({
      message: "Invalid credentials, not authorized you are not an admin.",
    });
    return;
  }

  // Check if password is correct
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  // Generate access token
  const accessToken = generateAccessToken(user._id);

  res.json({ accessToken });
});

interface TokenPayload {
  userId: string;
}
export const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies; /**By adding the cookie-parser middleware, 
  the cookies sent in the request will be parsed and made accessible
   in the req.cookies object else you won' t get cookies in the req object. Ensure that the middleware is added 
   before your routes so that it can be applied to incoming requests. */
  //console.log(req);
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  //console.log(refreshToken);
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error("No Refresh token presents in db or not matched");
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET_KEY!,
    (err: any, decoded: any) => {
      //console.log(user?.id, decoded?.userId);
      if (err || user?.id !== decoded?.userId) {
        throw new Error("There is something wrong with refresh token");
      }
      // Generate a new access token for user
      const accessToken = generateAccessToken(user?._id);
      res.json({ accessToken });
    }
  );
  //res.json(user);
});

export const passwordResetToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    try {
      const resetToken = crypto.randomBytes(32).toString("hex");
      console.log(resetToken);
      user.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.passwordResetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save(); // Save the updated user instance
      console.log(user.passwordResetToken);
      const resetURL = `Hi, Please follow this link to reset your password. 
        This link is valid 10 minutes from now. 
        <a href='http://localhost:3000/reset-password/${resetToken}'>Click Here</a>`;

      const data = {
        to: email,
        text: "Hey User",
        subject: "Forgot Password Link",
        html: resetURL,
      };
      sendMail(data);
      res.json(resetToken);
    } catch (error: any) {
      throw new Error(error as string);
    }
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { newPassword } = req.body;
    const { resetToken } = req.params;

    //  Hashed the token get in req.params and update the resetToken using crypto module
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find the user with the hashed token;

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: {
        $gt: Date.now(),
      } /**  The token expires time must be greater than Date.now(), 
      because the token is valid for now to ten minutes. */,
    });
    console.log(hashedToken);

    if (!user) throw new Error(" Token expired, Please try again later");

    //
    // Hash the new password and Update the old one
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedNewPassword;
    user.passwordResetToken = undefined; // We passed undefined because the password was changed we don't need a token
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt =  Date.now(); // We passed undefined because the password was changed we don't need an expires for token
    await user.save();

    res.json({ message: "Password reset successfully", user });
  }
);

//Logout endpoint
export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
      });
      res.sendStatus(204); // No Content
      return;
    }
    await User.findOneAndUpdate({ refreshToken }, { refreshToken: "" });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    res.sendStatus(204); // No Content
  }
);
