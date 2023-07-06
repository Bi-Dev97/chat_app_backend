import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User";
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
const generateRefreshToken = (): string => {
  const refreshToken = jwt.sign({}, process.env.REFRESH_TOKEN_SECRET_KEY!, {
    expiresIn: "7d",
  });
  return refreshToken;
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    
    // Set refresh token as an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Update user model with tokens
    user.token = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    // Return the access token and user details
    res.json({  user });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
