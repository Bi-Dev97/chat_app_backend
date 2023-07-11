import { RequestHandler, Response, Request, NextFunction } from "express";
import asyncHandler from "express-async-handler";

interface CustomRequest extends Request {
  user: { _id: string; role: string }; // Replace with the appropriate type for the user object
}

/**The purpose of this middleware is to check if the user has
 the admin role before allowing access to certain routes 
 or resources. If the user does not have the admin role, 
 it returns a 403 (Forbidden) response, indicating that 
 access is denied. Otherwise, it allows the request to
  proceed to the next middleware. */
const isAdminMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customReq = req as CustomRequest;
  const { role } = customReq.user;

  if (role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, admin role required" });
  }

  next();
};

export default asyncHandler(isAdminMiddleware);
