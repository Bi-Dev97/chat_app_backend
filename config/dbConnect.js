"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dbConnect = () => {
    try {
        const connection = mongoose_1.default.connect(process.env.MONGODB_URI); /**If you're certain that the variable
         will never be undefined, you can use the type assertion
         operator (!) to tell the TypeScript compiler that the value cannot be undefined. For example, parameter = variable!;. */
        console.log('Database Connection Successfully');
    }
    catch (error) {
        console.error(error);
    }
};
exports.default = dbConnect;
