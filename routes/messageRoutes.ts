/**This file defines routes related to messages.
 It can include routes for sending messages, 
fetching conversations, marking messages as read, etc. */
import express from "express";
import asyncHandler from "express-async-handler";
import authMiddleware from "../middlewares/authMiddleware";
import isAdminMiddleware from "../middlewares/isAdminMiddleware";
import {
  sendMessage,
  getMessageById,
  getAllMessagesBySender,
  deleteMessage,
  updateMessage,
  likeMessage,
  createReply,
  uploadImage,
  deleteImage,
  downloadImage,
} from "../controllers/messageController";
const messageRouter = express.Router();

// Send a message (requires authentication)
messageRouter.post("/:receiver", authMiddleware, asyncHandler(sendMessage));

// Send an image (requires authentication)
messageRouter.delete(
  "/delete-image/:filename",
  authMiddleware,
  asyncHandler(deleteImage)
);

// Delete an image (requires authentication)
messageRouter.post(
  "/upload-image/:receiver",
  authMiddleware,
  asyncHandler(uploadImage)
);

// Delete an image (requires authentication)
messageRouter.get(
  "/download-image/:filename",
  authMiddleware,
  asyncHandler(downloadImage)
);

// Delete a message (requires authentication)
messageRouter.delete(
  "/delete/:id",
  authMiddleware,
  asyncHandler(deleteMessage)
);

// Update a message (requires authentication)
messageRouter.put("/update/:id", authMiddleware, asyncHandler(updateMessage));

// Get a message by ID (requires authentication)
messageRouter.get("/get-one/:id", authMiddleware, asyncHandler(getMessageById));

// Get all messages (requires admin authentication)
messageRouter.get(
  "/all",
  authMiddleware,
  isAdminMiddleware,
  asyncHandler(getAllMessagesBySender)
);

// Like a message (requires authentication)
messageRouter.put(
  "/like/:messageId",
  authMiddleware,
  asyncHandler(likeMessage)
);

// Reply to a specific message (requires authentication)
messageRouter.post(
  "/reply/:messageId",
  authMiddleware,
  asyncHandler(createReply)
);

export default messageRouter;
