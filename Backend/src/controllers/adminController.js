import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-development-secret';

function createToken(admin) {
  return jwt.sign({ uId: admin.id, email: admin.email, role: 'ADMIN' }, JWT_SECRET, {
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
    const firstName = getRequiredString(req.body.firstName);
    const lastName = getRequiredString(req.body.lastName);
    const email = getRequiredString(req.body.email).toLowerCase();
    const contactNo = getRequiredString(req.body.contactNo);
    const password = getRequiredString(req.body.password);

    if (!firstName || !lastName || !email || !contactNo || !password) {
      return res.status(400).json({
        message: 'firstName, lastName, email, contactNo and password are required',
      });
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
      data: { firstName, lastName, email, contactNo, password: hashedPassword },
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

async function listAdmins(req, res) {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ admins });
  } catch (error) {
    console.error('List admins error:', error);
    return res.status(500).json({ message: 'Unable to fetch admins' });
  }
}

async function getAdminById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Admin ID must be a positive integer' });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.json({ admin });
  } catch (error) {
    console.error('Get admin error:', error);
    return res.status(500).json({ message: 'Unable to fetch admin' });
  }
}

async function updateAdmin(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Admin ID must be a positive integer' });
  }

  const data = {};
  const fields = ['firstName', 'lastName', 'contactNo'];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      const value = getRequiredString(req.body[field]);
      if (!value) {
        return res.status(400).json({ message: `${field} cannot be empty` });
      }
      data[field] = value;
    }
  }

  if (req.body.email !== undefined) {
    const email = getRequiredString(req.body.email).toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }
    data.email = email;
  }

  if (req.body.password !== undefined) {
    const password = getRequiredString(req.body.password);
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    data.password = await bcrypt.hash(password, 12);
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      message: 'Provide firstName, lastName, email, contactNo or password to update',
    });
  }

  try {
    const admin = await prisma.admin.update({ where: { id }, data });

    return res.json({
      message: 'Admin updated successfully',
      admin: publicAdmin(admin),
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Admin email is already registered' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    console.error('Update admin error:', error);
    return res.status(500).json({ message: 'Unable to update admin' });
  }
}

async function deleteAdmin(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Admin ID must be a positive integer' });
  }

  try {
    await prisma.admin.delete({ where: { id } });
    return res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    console.error('Delete admin error:', error);
    return res.status(500).json({ message: 'Unable to delete admin' });
  }
}

export { register, login, listAdmins, getAdminById, updateAdmin, deleteAdmin };
