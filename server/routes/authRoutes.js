import {Router} from "express";
import {register,login,me,logout} from "../controllers/authControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post("/register",register);
authRouter.post("/login",login);
authRouter.post("/logout",logout);
authRouter.get("/me",authMiddleware,me);

export default authRouter;