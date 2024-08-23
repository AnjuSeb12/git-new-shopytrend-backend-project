import express from "express"
import { getAllUsers, getSingleUser, userDelete, userLogin,userRegisteration, userUpdate } from "../controllers/userController.js";
import authenticateUser from "../middlewares/userMiddleware.js";


const userRouter = express.Router()


userRouter.post("/signup",userRegisteration)
userRouter.post("/login",userLogin)
userRouter.get("/users",getAllUsers)
userRouter.get("/user/:id",getSingleUser)
userRouter.delete("/userdelete/:id",userDelete)
userRouter.put("/userupdate/:id",authenticateUser,userUpdate)



export default userRouter;
