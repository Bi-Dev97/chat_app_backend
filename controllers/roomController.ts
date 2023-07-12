import { Request, RequestHandler, Response } from "express";
import Room from "../models/Room";
import { io } from "socket.io-client";
import isValidMongoId from "../utils/mongodbIdValidator";
import Message from "../models/Message";

interface CustomRequest extends Request {
  user: {
    save(): unknown;
    _id: string;
    contacts: any;
    role: string;
    rooms: any;
  }; // Replace with the appropriate type for the user object
}

/**By using RequestHandler, you don't need to explicitly specify 
the return type, as it is already inferred correctly. The RequestHandler
 type already specifies the correct return type for a route
  handler function.*/

// Create a Room
export const createRoom: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const user = customReq.user;
  const { name } = req.body;
  try {
    const newRoom = new Room({ name, owner: user });
    newRoom.members = [...newRoom.members, user._id];
    const savedRoom = await newRoom.save();

    user.rooms.push(newRoom);
    await user.save();

    res.json(savedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create room" });
  }
};

// Get All Rooms
export const getAllRooms: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const user = customReq.user;
  try {
    // Check if the authenticated user is an admin of the app
    if (user.role !== "admin") {
      return res.status(401).json({
        message: "You are not authorized to get all rooms",
      });
    }
    const rooms = await Room.find()
      .populate("owner", "firstName lastName image email mobile")
      .populate("members", "firstName lastName image email mobile")
      .populate("messages", "content sender");

    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get rooms" });
  }
};

// Get Room by ID
export const getRoomById: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { roomId } = req.params;
  isValidMongoId(roomId);
  try {
    const room = await Room.findById(roomId)
      .populate("owner", "firstName lastName image email mobile")
      .populate("members", "firstName lastName image email mobile")
      .populate("messages", "content sender");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get room" });
  }
};

// Update Room
export const updateRoom: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const user = customReq.user;
  const { roomId } = req.params;
  const { name } = req.body;
  isValidMongoId(roomId);

  try {
    // Find the room by ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the authenticated user is the owner of the room
    console.log(room.owner._id.toString(), user._id.toString());
    /** Here you must convert both ids because _id are objectId */
    if (room.owner._id.toString() !== user._id.toString()) {
      return res.status(401).json({
        message: "You are not authorized to modify this room",
      });
    }
    room.name = name;
    const updatedRoom = await room.save();

    res.json(updatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update room" });
  }
};

// Delete Room
export const deleteRoom: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const user = customReq.user;
  const { roomId } = req.params;
  isValidMongoId(roomId);
  try {
    // Find the room by ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the authenticated user is the owner of the room
    if (room.owner._id.toString() !== user._id.toString() || user.role !== "admin") {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this room" });
    }

    // Delete the room
    await Room.deleteOne({ _id: roomId });

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete room" });
  }
};

// Add Members to Room
export const addMembersToRoom: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const user = customReq.user;
  const { memberIds } = req.body;
  const { roomId } = req.params;
  isValidMongoId(roomId);

  try {
    // Find the room by ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the authenticated user is the owner of the room
    if (room.owner.toString() !== user._id.toString()) {
      return res.status(401).json({
        message: "You are not authorized to add members to this room",
      });
    }

    // Check if each member ID is in the user's contacts
    const validMembers = [];
    for (const memberId of memberIds) {
      const contact = user.contacts.find(
        (contact: any) => contact._id.toString() === memberId
      );
      if (contact) {
        validMembers.push(contact._id);
      } else {
        return res.json("This user is not found in your contact's list");
      }
    }

    // Add the valid members to the room
    room.members.push(...validMembers);

    // Save the updated room
    await room.save();

    res.json({ message: "Members added to the room", room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add members to the room" });
  }
};

// Send Instant Message using Socket.IO
export const sendMessageToRoom: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const { roomId } = req.params;
  const { content } = req.body;
  const sender = customReq.user;
  isValidMongoId(roomId);
  try {
    // Find the room by ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    // Verify if the sender  is a member
    const member = await room.members.find(
      (member) => member.toString() === sender._id.toString()
    );
    if (!member) {
      return res.status(401).json({
        message: "You are not authorized to post messages in this room",
      });
    }

    // Create a new message
    const newMessage = new Message({
      sender, // Assign the ObjectId of the sender
      content,
      receiver: roomId,
      timestamp: new Date(),
    });
    await newMessage.save();

    // Add the new message to the room's messages array
    room.messages.push(newMessage._id);

    // Save the updated room
    await room.save();

    // Emit the message to all clients in the room using Socket.IO
    const socket = io("http://localhost:6400"); // Replace with your WebSocket server URL
    socket.emit("newMessage", { content });

    res.json({ message: "Message sent to the room", newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message to the room" });
  }
};

export const findRoomsByOwner: RequestHandler = async (req, res) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const ownerId = customReq.user._id;
  isValidMongoId(ownerId);
  try {
    // Find all rooms where the specified user is the owner
    const rooms = await Room.find({ owner: ownerId })
      .populate("owner", "firstName lastName image email mobile")
      .populate("members", "firstName lastName image email mobile")
      .populate("messages", "content sender");

    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get rooms" });
  }
};

export const findRoomsByMember: RequestHandler = async (req, res) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const memberId = customReq.user._id;
  isValidMongoId(memberId);
  try {
    // Find all rooms where the specified user is a member
    const rooms = await Room.find({ members: memberId })
      .populate("members", "firstName lastName image email mobile")
      .populate("owner", "firstName lastName image email mobile")
      .populate("messages", "content sender");
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get rooms" });
  }
};

export const removeMemberFromRoom: RequestHandler = async (req, res) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const { roomId, memberId } = req.params;
  const userId = customReq.user._id;
  isValidMongoId(userId);
  isValidMongoId(roomId);

  try {
    // Find the room by ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the authenticated user is the owner of the room
    if (room.owner.toString() !== userId.toString()) {
      return res.status(401).json({
        message: "You are not authorized to remove a member from this room",
      });
    }

    // Remove the member from the room
    room.members = room.members.filter(
      (member) => member.toString() !== memberId
    );
    await room.save();
    await room.save();

    res.json({ message: "Member removed from room successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove member from room" });
  }
};
