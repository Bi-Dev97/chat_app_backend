import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  updatePassword,
  blockUser,
  unblockUser,
  getProfile
} from "../controllers/userController";
import authMiddleware from "../middlewares/authMiddleware";
/**This file defines routes related to user management. 
It can include routes for user registration, login, 
profile updates, etc. Each route is associated with 
a specific HTTP method (GET, POST, PUT, DELETE) and URL path. */

const userRouter = express.Router();

// Route: POST /api/users
// Create a new user
userRouter.post("/", createUser);

// Route: GET /api/users/profile
// Get user profile
userRouter.get('/profile', authMiddleware, getProfile);

// Route: GET /api/users
// Get all users
userRouter.get("/", getUsers);

// Route: GET /api/users/:id
// Get a specific user
userRouter.get("/:id", authMiddleware, getUserById);

// Route: PUT /api/users/:id
// Update a specific user
userRouter.put("/update", authMiddleware, updateUser);

// Route: PUT /api/users/:id/password
// Update a specific user' password
userRouter.put("/password",authMiddleware, updatePassword);

// Route: DELETE /api/users/:id
// Delete a specific user
userRouter.delete("/:id", deleteUser);

// Route: PUT /api/user/:id/block
// Block a specific user
userRouter.put("/:id/block", blockUser)

// Route: PUT /api/users/:id/unblock
// Unblock a specific user
userRouter.put("/:id/unblock", unblockUser)



export default userRouter;
