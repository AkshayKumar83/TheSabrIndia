import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || 'change-this-development-secret';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.etoken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = {
      id: decoded.uId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authMiddleware;