import express from 'express';
import {
	register,
	login,
	listAdmins,
	getAdminById,
	updateAdmin,
	deleteAdmin,
} from '../controllers/adminController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/', listAdmins);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/delete/:id', deleteAdmin);

export default router;
