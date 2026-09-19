import bcrypt from 'bcrypt';
import prisma from "../../lib/prisma.js"

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const  id  = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        contactNo: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};


// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
      const  id  = req.user.id;
    const {
      firstName,
      lastName,
      contactNo,
    //   email
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // // Check if email is already used by another user
    // if (email && email !== existingUser.email) {
    //   const emailExists = await prisma.user.findUnique({
    //     where: { email },
    //   });

    //   if (emailExists) {
    //     return res.status(409).json({
    //       success: false,
    //       message: 'Email already exists',
    //     });
    //   }
    // }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        contactNo,
    //   email
    },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        contactNo: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};


// UPDATE PASSWORD
export const updatePassword = async (req, res) => {
  try {
      const  id  = req.user.id;

    const {
      oldPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Check required fields
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password, new password and confirm password are required',
      });
    }

    // Check new password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Compare old password with hashed password
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect',
      });
    }

    // Optional: prevent same password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from old password',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};