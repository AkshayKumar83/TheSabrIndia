import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/userAddressController.js";

const AddressRouter = express.Router();
AddressRouter.use(authMiddleware);
AddressRouter.get("/", getAddresses);
AddressRouter.get("/:id", getAddressById);
AddressRouter.post("/", createAddress);
AddressRouter.patch("/:id", updateAddress);
AddressRouter.patch("/:id/default", setDefaultAddress);
AddressRouter.delete("/:id", deleteAddress);

export default AddressRouter;