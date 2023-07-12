/**This file defines routes related to chat rooms. 
It can include routes for creating rooms, joining rooms, 
fetching room information, etc. */
import express from "express";
import authMiddleware from "../middlewares/authMiddleware";
import isAdminMiddleware from "../middlewares/isAdminMiddleware";
import asyncHandler from "express-async-handler";
import {
  createRoom,
  updateRoom,
  deleteRoom,
  getAllRooms,
  getRoomById,
  addMembersToRoom,
  removeMemberFromRoom,
  sendMessageToRoom,
  findRoomsByMember,
  findRoomsByOwner
} from "../controllers/roomController";

const roomRouter = express.Router();

// Create a new room
roomRouter.post('/', authMiddleware, asyncHandler(createRoom));

// Get all rooms by owner
roomRouter.get('/rooms-by-owner', authMiddleware, asyncHandler(findRoomsByOwner));

// Remove a member from a room
roomRouter.delete('/:roomId/members/:memberId', authMiddleware, asyncHandler(removeMemberFromRoom));

// Get rooms by member
roomRouter.get('/rooms-by-member', authMiddleware, asyncHandler(findRoomsByMember));

// Update a room
roomRouter.put('/:roomId', authMiddleware, asyncHandler(updateRoom));

// Delete a room
roomRouter.delete('/:roomId', authMiddleware, isAdminMiddleware, asyncHandler(deleteRoom));

// Get all rooms (admin access only)
roomRouter.get('/', authMiddleware, isAdminMiddleware, asyncHandler(getAllRooms));

// Get a room by ID
roomRouter.get('/:roomId', authMiddleware, asyncHandler(getRoomById));

// Add members to a room
roomRouter.post('/add-members/:roomId', authMiddleware, asyncHandler(addMembersToRoom));

// Send a message in a room
roomRouter.post('/send-message/:roomId', authMiddleware, asyncHandler(sendMessageToRoom));

export default roomRouter;