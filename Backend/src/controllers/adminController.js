import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-development-secret';

function createToken(admin) {
  return jwt.sign({ adminId: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

function publicAdmin(admin) {
  const { password, ...safeAdmin } = admin;
  return safeAdmin;
}

function getRequiredString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function register(req, res) {
  try {
    const name = getRequiredString(req.body.name);
    const email = getRequiredString(req.body.email).toLowerCase();
    const password = getRequiredString(req.body.password);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: { name, email, password: hashedPassword },
    });

    return res.status(201).json({
      message: 'Admin registration successful',
      token: createToken(admin),
      admin: publicAdmin(admin),
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Admin email is already registered' });
    }

    console.error('Admin registration error:', error);
    return res.status(500).json({ message: 'Unable to register admin' });
  }
}

async function login(req, res) {
  try {
    const email = getRequiredString(req.body.email).toLowerCase();
    const password = getRequiredString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    const passwordMatches = admin && (await bcrypt.compare(password, admin.password));

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid admin email or password' });
    }

    return res.json({
      message: 'Admin login successful',
      token: createToken(admin),
      admin: publicAdmin(admin),
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Unable to login admin' });
  }
}

export { register, login };
