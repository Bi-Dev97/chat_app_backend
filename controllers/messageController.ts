import { NextFunction, Request, RequestHandler, Response } from "express";
import Message from "../models/Message";
import { validationResult } from "express-validator";
import User from "../models/User";
import { io } from "socket.io-client";
import { upload } from "../middlewares/multerMiddleware";
import fs from "fs";
import path from "path";
import isValidMongoId from "../utils/mongodbIdValidator";

/**
    path: The path module provides utilities for working with file
     and directory paths. It helps in constructing file paths, 
     resolving relative paths, and extracting file extensions, 
     among other operations. It is commonly used to manipulate 
     file paths in a cross-platform manner.

    fs: The fs module, short for File System, provides methods 
    for interacting with the file system on your computer. 
    It allows you to read, write, delete, and modify files 
    and directories. In this code snippet, the fs module 
    is used to check if the image file exists and create 
    a readable stream to read the file contents.

Both path and fs are part of the Node.js standard library, 
so you don't need to install any additional dependencies 
to use them. They are commonly used when working with files
 and directories in Node.js applications. */

// API to create a new message
interface CustomRequest extends Request {
  user: any; // Replace 'object' with the appropriate type for the user object
}
export const sendMessage: RequestHandler = async (
  req: Request,
  res: Response
) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const { content } = req.body;
  const sender = customReq?.user;
  const receiver = req.params.receiver; // Get the receiver from the route parameter
  try {
    // Create a new message
    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();
    console.log(newMessage);

    // Get the receiver user from the User collection
    const receiverUser = await User.findById(receiver);
    console.log(receiverUser);
    if (!receiverUser) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Add the message to the receiver's messages array
    receiverUser.messages.push(newMessage._id);
    await receiverUser.save();

    // Emit the message to the receiver using Socket.IO
    const socket = io("http://localhost:6400"); // Replace with your WebSocket server URL
    socket.emit("newMessage", { receiver, content });

    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// API to get all messages grouped by sender ID
export const getAllMessagesBySender = async (req: Request, res: Response) => {
  try {
    /**we added the page and limit query parameters to specify the
     page number and the number of items per page. We convert these
      parameters to numbers using parseInt. Then, we calculate 
      the skip value based on the page number and limit.

In the aggregation pipeline, we added a $sort stage
 to sort the messages by timestamp in descending order.
  Next, we include $skip and $limit stages to skip the
   specified number of documents and limit the number 
   of documents to fetch based on the calculated skip 
   and limitNumber values.

With these changes, the endpoint will return a paginated 
list of messages grouped by sender ID, based on 
the provided page and limit query parameters. */
    const { page = 1, limit = 10 } = req.query;

    // Convert the query parameters to numbers
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Calculate the skip value based on the page and limit
    const skip = (pageNumber - 1) * limitNumber;

    /** the sortField and sortValue query parameters are used 
    to determine the field to sort by and the value to compare with. 
    The $match stage is added to match the specified condition based
     on the field and value provided.

You can include the following query parameters in the request URL
 to control the sorting and filtering:

    sortField: Specifies the field to sort by 
    (e.g., timestamp, createdAt, etc.)
    sortValue: Specifies the value to compare with 
    (e.g., -1 for less than, 0 for equal to, 1 for greater than) */
    //  const sortField = (req.query.sortField as string) || "createdAt"; // The field to sort by
    const sortValue = Number(req.query.sortValue) || 0; // The value to compare with
    //  const sortOperator = sortValue > 0 ? "$gt" : sortValue < 0 ? "$lt" : "$eq";

    // Aggregate query with pagination and limit

    const messages = await Message.aggregate([
      { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      // { $match: { [sortField]: { [sortOperator]: Math.abs(sortValue) } } }, // Match the specified condition
      { $skip: skip }, // Skip the specified number of documents
      { $limit: limitNumber }, // Limit the number of documents to fetch
      {
        $group: {
          _id: "$sender",
          messages: { $push: "$$ROOT" },
        },
      },
    ]);
    // const populatedMessages = await Message.populate(messages, {
    //  path: "messages.replies",
    //  });
    const recursivelyPopulateReplies = async (messages: any[]) => {
      for (const message of messages) {
        if (message.messages && message.messages.length > 0) {
          await Message.populate(message.messages, {
            path: "sender",
            select: "firstName lastName email mobile image",
          });
          await Message.populate(message.messages, {
            path: "receiver",
            select: "firstName lastName email mobile image",
          });
          await Message.populate(message.messages, {
            path: "replies",
            select: "content",
          });
          await recursivelyPopulateReplies(message.messages);

          // Populate nested replies within each reply
          for (const replies of message.messages) {
            if (replies.replies && replies.replies.length > 0) {
              await Message.populate(replies.replies, {
                path: "sender",
                select: "firstName lastName email mobile image",
              });
              await Message.populate(replies.replies, {
                path: "receiver",
                select: "firstName lastName email mobile image",
              });
              await Message.populate(replies.replies, {
                path: "replies",
                select: "content",
              });
              await recursivelyPopulateReplies(replies.replies);
            }
          }
        }
      }
    };

    await recursivelyPopulateReplies(messages);

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get messages" });
  }
};

// API to delete a message
export const deleteMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  isValidMongoId(id);
  try {
    // Find and delete the message
    await Message.findByIdAndDelete(id);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete message" });
  }
};

// API to get a message by ID
export const getMessageById = async (req: Request, res: Response) => {
  const { id } = req.params;
  isValidMongoId(id);
  try {
    // Find the message by ID
    /**we pass an object to the populate method for 
    each field we want to populate. The object contains 
    two properties: the first one specifies the field 
    to populate, and the second one is a space-separated
     string that lists the fields from the referenced model
      that you want to populate ("firstName", "lastName", "email", 
      and "image" in this case). */
    const message = await Message.findById(id)
      .populate("sender", "firstName lastName email image mobile")
      .populate("receiver", "firstName lastName email image mobile");
    console.log(message);

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get message" });
  }
};

// API to update a message
export const updateMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  isValidMongoId(id);
  try {
    // Find and update the message
    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    );

    if (!updatedMessage) {
      res.status(404).json({ message: "Message not found" });
      return;
    }
    // Emit the message to the receiver using Socket.IO
    const socket = io("http://localhost:6400"); // Replace with your WebSocket server URL
    socket.emit("newMessage", { receiver: updatedMessage.receiver, content });

    res.json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update message" });
  }
};

interface CustomRequest extends Request {
  user: any; // Replace 'object' with the appropriate type for the user object
}
export const likeMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
    const { messageId } = req.params;
    const userId = customReq.user._id;

    // Find the message by ID
    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    // Check if the user has already liked the message
    const alreadyLikedIndex = message.likes.indexOf(userId);

    if (alreadyLikedIndex !== -1) {
      // User already liked the message, so remove the like
      message.likes.splice(alreadyLikedIndex, 1);
    } else {
      // User hasn't liked the message, so add the like
      message.likes.push(userId);
    }
    // Save the updated message
    await message.save();

    res.json({ message: "Like updated successfully", likes: message.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update like" });
  }
};

interface CustomRequest extends Request {
  user: any; // Replace 'object' with the appropriate type for the user object
}
export const createReply = async (req: Request, res: Response) => {
  const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
  const { messageId } = req.params;
  const { content } = req.body;
  const sender = customReq.user;
  try {
 
    // Find the message by ID
    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    // Create the reply object
    const reply = new Message({
      sender,
      receiver: message.receiver,
      content,
      timestamp: new Date(),
      replies: [],
    });

    // Save the reply
    await reply.save();

    // Add the reply to the message's replies array
    message.replies.push(reply);

    // Save the updated message
    await message.save();

    // Emit the message to the receiver using Socket.IO
    const socket = io("http://localhost:6400"); // Replace with your WebSocket server URL
    socket.emit("newMessage", { receiver: message.receiver, content });

    res.json({ message: "Reply created successfully", reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create reply" });
  }
};

interface CustomRequest extends Request {
  user: any; // Replace 'object' with the appropriate type for the user object
}

/**the Multer middleware is added to the uploadImage endpoint or /upload route as 
upload.single('file'), indicating that it should handle a 
single file upload with the field name file. The uploaded 
file can then be accessed in the route handler via req.file.
Make sure to create the specified destination folder 
(uploads/ in the example) to store the uploaded files. */
export const uploadImage: RequestHandler = async (
  req: Request,
  res: Response
) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const customReq = req as CustomRequest; // Cast 'req' to 'CustomRequest'
    const sender = customReq?.user;
    const receiver = req.params.receiver; // Get the receiver from the route parameter

    // Create a new message
    const newMessage = new Message({ sender, receiver });

    // Upload the image file using Multer middleware
    upload.single("image")(req, res, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to upload image" });
      }

      // Get the file details from the request
      const file = req.file;

      // Check if a file was uploaded
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Set the message content to the file path
      newMessage.content = file.path;

      // Save the message
      const savedMessage = await newMessage.save();

      // Get the receiver user from the User collection
      const receiverUser = await User.findById(receiver);
      if (!receiverUser) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      // Add the message to the receiver's messages array
      receiverUser.messages.push(savedMessage._id);
      await receiverUser.save();

      // Emit the message to the receiver using Socket.IO
      const socket = io("http://localhost:6400"); // Replace with your WebSocket server URL
      socket.emit("newMessage", { receiver, content: savedMessage.content });

      res.status(200).json({ message: "Image uploaded successfully" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upload image" });
  }
};

/**    Inside the downloadImage function, we extract the filename
 parameter from the request parameters using req.params.filename.
  This parameter represents the name of the image file to be downloaded.

    We construct the full path to the image file using the path.join
     function. In this example, we assume that the uploads directory
      is located one level above the current directory, hence .. is used.

    We check if the image file exists on the server using fs.existsSync.
     If the file does not exist, we respond with a 404 status and a JSON 
     message indicating that the image was not found.

    If the image file exists, we set the appropriate Content-Type 
    header for the response to indicate that it is an image file 
    (in this case, image/jpeg).

    We create a readable stream (fs.createReadStream) from the image 
    file and pipe it to the response (res) object. This streams the 
    image file directly to the client as the response.

    In case of any errors during the process, we catch them and 
    respond with a 500 status and a JSON message indicating the 
    failure to download the image.

    In the messageRoutes.ts file, we create a route using router.get 
    to map the /download-image/:filename URL to the downloadImage 
    function.

    Finally, in the server file (index.ts), we use app.use to mount
     the messageRoutes router under the /api/messages prefix. 
     This means that all routes defined in messageRoutes.ts will 
     be accessible under the /api/messages URL.

With this implementation, when a GET request is made to 
/api/messages/download-image/:filename, the server will 
check if the image file exists and stream it to the client 
as the response. The appropriate Content-Type header 
is set to indicate that the response is an image. */
export const downloadImage: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, "..", "uploads", filename);
  try {
  
    // Check if the image file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Set the appropriate content-type header
    res.setHeader("Content-Type", "image/jpeg");

    // Stream the image file to the response
    const fileStream = fs.createReadStream(imagePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to download image" });
  }
};

export const deleteImage: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { filename } = req.params;
  const imagePath = `uploads/${filename}`;
  try {
    // Check if the image file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete the image file
    fs.unlinkSync(imagePath);

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete image" });
  }
};
