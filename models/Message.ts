import { Schema, model, Document } from "mongoose";
import { IUser } from "./User";
import { Types } from "mongoose";

/**The code snippet `sender: IUser;` declares a 
property named `sender` with a type of `IUser`. 

Here's a breakdown of the code:

1. `sender` and `receiver`: These is the name given to the properties. 
These represent  variables or fields that hold  values.

2. `IUser`: This refers to the `IUser` interface 
that you defined earlier. In TypeScript, when you specify 
a type after a colon (`:`), it indicates the expected type 
of the variable or property. In this case, `sender` is expected 
to be of type `IUser`.

By declaring `sender` or `receiver` as type `IUser`, you are specifying 
that the value assigned to the `sender` and `receiver` properties should 
adhere to the structure and properties defined in the `IUser`
 interface. This ensures that the `sender` and `receiver` property contains 
 the necessary properties like `username`, `email`, `password`, 
 `image`, `role`, and `isBlocked` as defined in the `IUser` interface. */
export interface IMessage extends Document {
  sender: IUser["_id"];
  receiver: IUser["_id"];
  likes: Types.Array<IUser["_id"]>;
  replies: IMessage["_id"][];
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default:"" },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    replies: [{ type: Schema.Types.ObjectId, ref: "Message", default: [] }], // Nested replies
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

const Message = model<IMessage>("Message", messageSchema);

export default Message;
