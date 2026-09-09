import express from 'express';
import { register, login, listAdmins } from '../controllers/adminController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/', listAdmins);

export default router;
