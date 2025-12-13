import User from "../models/User.js";

export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const firebaseUid = req.firebaseUid;

      const user = await User.findOne({ firebaseUid });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("checkRole error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
};
