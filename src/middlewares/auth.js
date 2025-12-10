import admin from "../config/firebase.js";

export const verifyFBToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.get("Authorization");

  if (!authHeader)
    return res.status(401).json({ message: "Unauthorized access" });

  const token = authHeader.split(" ")[1]; // "Bearer <token>"

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded_email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};
