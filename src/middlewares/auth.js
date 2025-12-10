// middleware/auth.js
import admin from "../config/firebase.js";

export const verifyFBToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split("Bearer ")[1].trim();
    const decoded = await admin.auth().verifyIdToken(token);

    req.authUser = decoded;
    req.firebaseUid = decoded.uid;

    next();
  } catch (err) {
    console.error("verifyFBToken error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};
