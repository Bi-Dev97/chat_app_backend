"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbConnect_1 = __importDefault(require("./config/dbConnect"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**In TypeScript, you can use type annotations
(: Express) to explicitly specify the type of
 a variable. This helps ensure that the variable
  is used correctly and provides more accurate
  type information throughout your codebase.
By using const app: Express = express();,
you are ensuring that the app variable is of
type Express and can be used as an instance of
the Express application with the associated
methods and properties provided by  */
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5500;
(0, dbConnect_1.default)();
app.listen(PORT, () => {
    console.log(`Server is Running at http://localhost:${PORT}`);
});
