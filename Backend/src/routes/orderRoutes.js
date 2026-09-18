// routes/order.routes.js

import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

import {
  createOrder,
  verifyOrderPayment,
  getMyOrders,
  getOrderById,
  getAllOrders
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", authMiddleware, createOrder);

router.post("/:orderId/payment/verify", authMiddleware, verifyOrderPayment);

router.get("/users", authMiddleware, getMyOrders);

router.get("/order/:id/:orderNo", authMiddleware, getOrderById);
router.get("/list", getAllOrders);


export default router;
