import mongoose from "mongoose";

const dbConnect = () => {
  try {
    const connection = mongoose.connect(
      process.env.MONGODB_URI!
    ); /**If you're certain that the variable
         will never be undefined, you can use the type assertion 
         operator (!) to tell the TypeScript compiler that the value cannot be undefined. For example, parameter = variable!;. */
    console.log("Database Connection Successfully");
  } catch (error) {
    console.error(error);
  }
};

export default dbConnect;
