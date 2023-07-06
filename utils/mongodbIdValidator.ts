import mongoose from 'mongoose';

/**isValidMongoId function takes an id parameter of type string.
 It uses the mongoose.Types.ObjectId.isValid() method to validate
  whether the provided id is a valid MongoDB ObjectId.
The isValidMongoId function returns a boolean value 
indicating whether the id is valid. */
const isValidMongoId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export default isValidMongoId;
