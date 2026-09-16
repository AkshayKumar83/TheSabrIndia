import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-development-secret';

function createToken(user) {
  return jwt.sign({ uId: user.id, email: user.email, role:"USER" }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function getRequiredString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function signup(req, res) {
  try {
    const firstName = getRequiredString(req.body.firstName);
    const lastName = getRequiredString(req.body.lastName);
    const contactNo = String(req.body.contactNo || '').trim();
    const email = getRequiredString(req.body.email).toLowerCase();
    const password = getRequiredString(req.body.password);

    if (!firstName || !lastName || !contactNo || !email || !password) {
      return res.status(400).json({
        message: 'firstName, lastName, contactNo, email and password are required',
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { firstName, lastName, contactNo, email, password: hashedPassword },
    });

    return res.status(201).json({
      message: 'Signup successful',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Unable to create account' });
  }
}

async function login(req, res) {
  try {
    const email = getRequiredString(req.body.email).toLowerCase();
    const password = getRequiredString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = user && (await bcrypt.compare(password, user.password));

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      message: 'Login successful',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to login' });
  }
}

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        contactNo: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ message: 'Unable to fetch users' });
  }
}

export { signup, login, listUsers };
