import express from "express";

import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const CartRouter = express.Router();

CartRouter.get(
  "/",
  authMiddleware,
  authorize("USER"),
  getCart
);

CartRouter.post(
  "/",
  authMiddleware,
  authorize("USER"),
  addToCart
);

CartRouter.patch(
  "/:variantId",
  authMiddleware,
  authorize("USER"),
  updateCartQuantity
);

CartRouter.delete(
  "/:variantId",
  authMiddleware,
  authorize("USER"),
  removeFromCart
);

CartRouter.delete(
  "/",
  authMiddleware,
  authorize("USER"),
  clearCart
);

export default CartRouter;