import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import userRoutes from './src/routes/userRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import { notFoundHandler } from './utils/middleware.js';
import CartRouter from './src/routes/cartRoutes.js';
import OrderRouter from './src/routes/orderRoutes.js';
import AddressRouter from './src/routes/addressRoutes.js';
import profileRouter from './src/routes/profileRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8090;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/cart', CartRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use("/api/orders",OrderRouter);
app.use("/api/address",AddressRouter);
app.use("/api/profile",profileRouter);

app.use(notFoundHandler);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
