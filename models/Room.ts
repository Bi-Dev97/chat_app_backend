import { Schema, model, Document } from "mongoose";
import { IUser } from "./User";
import { IMessage } from "./Message";

/**The code snippet `members: IUser['_id'][];` declares a property named `members` with a type of `IUser['_id'][]`.
Here's a breakdown of the code:
1. `members`: This is the name given to the property. It represents a variable or a field that holds a value.
2. `IUser['_id'][]`: This type declaration indicates that the `members` property is an array (`[]`) of `IUser['_id']` elements.
   - `IUser`: Refers to the `IUser` interface that you defined earlier.
   - `['_id']`: Accesses the `_id` property of the `IUser` interface. The `_id` property is likely defined in the `IUser` 
   interface as a unique identifier, such as a MongoDB ObjectId.
   - `[]`: Indicates that the `members` property is an array that can contain multiple values of `IUser['_id']` type.
Therefore, `members: IUser['_id'][];` states that the `members` property is an array of `_id` values of type `IUser`, 
which likely represents a collection of unique identifiers of users. This code allows the `members` property 
to store an array of user IDs that can be used to reference and identify individual users within a given context. */
export interface IRoom extends Document {
  name: string;
  members: IUser["_id"][];
  messages: IMessage["_id"][];
}

const roomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  },
  { timestamps: true }
);

const Room = model<IRoom>("Room", roomSchema);

export default Room;
