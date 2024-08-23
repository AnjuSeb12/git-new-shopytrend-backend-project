import express from "express";
import { getAllSellers, getSingleSeller, sellerDelete,sellerLogin,sellerRegisteration,sellerUpdate } from "../controllers/sellerController.js";
import authenticateAdmin from "../middlewares/adminMiddleware.js";
import authenticateSeller from "../middlewares/sellerMiddleware.js";


const sellerRouter=express.Router();





sellerRouter.post("/sellersignup",sellerRegisteration);
sellerRouter.post("/sellerlogin",sellerLogin);
sellerRouter.get("/sellers",getAllSellers);
sellerRouter.get("/sellerbyid/:id",getSingleSeller);
sellerRouter.delete("/deleteseller/:id",authenticateSeller,sellerDelete);
sellerRouter.put("/updateseller/:id",authenticateSeller,sellerUpdate);

export default sellerRouter;