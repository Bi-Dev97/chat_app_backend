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
  getProfile,
  updateUserRole,
  addUserToContacts
} from "../controllers/userController";
import authMiddleware from "../middlewares/authMiddleware";
import isAdminMiddleware from "../middlewares/isAdminMiddleware";
import asyncHandler  from 'express-async-handler';

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
userRouter.get("/profile", authMiddleware, getProfile);

// Route: GET /api/users
// Get all users
userRouter.get("/", authMiddleware, isAdminMiddleware, getUsers);

// Route: GET /api/users/:id
// Get a specific user
userRouter.get("/:id", authMiddleware, isAdminMiddleware, getUserById);

// Route: PUT /api/users/update
// Update a specific user
userRouter.put("/update", authMiddleware, updateUser);

// Route: PUT /api/users/password
// Update a specific user' password
userRouter.put("/password", authMiddleware, updatePassword);

// Route: DELETE /api/users/:id
// Delete a specific user
userRouter.delete("/:id", authMiddleware, isAdminMiddleware, deleteUser);

// Route: PUT /api/users/block/:id
// Block a specific user
userRouter.put("/block/:id", authMiddleware, isAdminMiddleware, blockUser);

// Route: PUT /api/users/unblock/:id
// Unblock a specific user
userRouter.put("/unblock/:id", authMiddleware, isAdminMiddleware, unblockUser);

// Route: PUT /api/users/role/:id
// Update a specific user role
userRouter.put("/role/:id", authMiddleware, isAdminMiddleware, updateUserRole);

// Route: PUT /api/users/add-contact/:contactId
// Update specific user contacts's list
userRouter.put("/add-contact/:contactId", authMiddleware,  asyncHandler(addUserToContacts));

export default userRouter;

