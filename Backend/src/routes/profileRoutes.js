
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import { getUserById, updateProfile, updatePassword } from '../controllers/profileController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', getUserById);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

export default router;