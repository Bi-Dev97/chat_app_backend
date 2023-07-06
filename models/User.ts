import { Schema, model, Document } from "mongoose";
import { IMessage } from "./Message";
import { Types } from "mongoose";
import bcrypt from "bcrypt";

/**The code you provided defines an interface called
 IUser that extends another interface called Document.
  In TypeScript, an interface is a way to define a 
  contract for an object, specifying the properties 
  and methods it should have. */
/**By extending the Document interface, it indicates
 that the IUser interface inherits all the properties 
 and methods from the Document interface as well. 
 The Document interface likely represents some kind 
 of document or record, and IUser is extending it 
 to add specific properties related to user information.

This code is defining a contract for objects that 
represent user data, stating that they should have 
these properties and their respective types. 
Other parts of the codebase can then use this 
interface to ensure consistency and enforce 
the presence of these properties when working with user objects. */
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  image: string;
  mobile: string;
  role: "admin" | "user"; // Define the role field with specific values;
  isBlocked: boolean;
  messages: Types.Array<IMessage["_id"]> /**It is same as IMessage['_id'][] */;
  /**Types.Array<IMessage['_id']>: This type declaration indicates that the messages 
      property is of type Types.Array<IMessage['_id']>.
      Types.Array: It refers to a specific type provided by Mongoose or a similar library, which represents an array of values.
      IMessage['_id']: It accesses the _id property of the IMessage interface or model. This likely represents a unique identifier 
      for a message document.
      Therefore, messages: Types.Array<IMessage['_id']>; states that the messages property is an array containing values 
      of type IMessage['_id']. This suggests that the messages property 
      is intended to store an array of unique identifiers of message documents. It allows for referencing and 
      associating messages with the object or entity that contains this property. */
  createdAt: Date;
  updatedAt: Date;
  passwordChangedAt: Date;
  passwordResetToken: String;
  passwordResetExpires: Date;
  token: String;
  refreshToken: String;
}

/**new Schema<IUser>({...}): Creates a new instance of the 
Schema class, which is provided by Mongoose. The generic 
parameter <IUser> is used to specify that the schema will 
conform to the IUser interface you defined earlier. */
let userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    image: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3OKqB5Y1I0CYTBLCz_Ibh7Dafpm5u2NXjv08upwpKYKDh2Yhwvy9PhUQpM3IjRrffFhE&usqp=CAU",
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      index: true /**index: true: This configuration specifies that an 
        index should be created for the email property.
        An index helps improve the performance of database
      queries by allowing faster lookup of documents based  
       on the indexed field. In this case, it creates an index 
for the email property, which can enhance the efficiency 
of queries involving email-based searches or filtering. */,
    },
    role: {
      type: String,
      enum: ["admin", "user"], // Specify the allowed values for the role field
      default: "user", // Set a default value if needed
    },
    isBlocked: { type: Boolean, default: false },
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    token: String,
    refreshToken: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = model<IUser>(
  "User",
  userSchema
); /**The code you provided creates a Mongoose model named `User` based on the `userSchema` and the `IUser` interface.
Here's a breakdown of the code:
1. `const User`: Declares a constant variable named `User` to hold the Mongoose model.
2. `model<IUser>('User', userSchema)`: This line creates the Mongoose model using the `model` function. The generic parameter `<IUser>` specifies the type of the model, indicating that it should conform to the `IUser` interface.
   - `'User'` is the name of the collection (or table) in the database where the documents created from this model will be stored.
   - `userSchema` is the schema object that defines the structure and configuration of the user documents.
So, this code creates a Mongoose model named `User` that is associated with the `'User'` collection in the database. The model enforces the structure and configuration defined in the `userSchema`, which is based on the `IUser` interface. This model can be used to perform various operations such as creating, reading, updating, and deleting user documents in the MongoDB database. */

export default User;
