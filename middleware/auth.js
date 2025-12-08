import admin from "../config/firebase";

export const verifyFBToken = async (req, res, next) => {
  const token = req.header.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized access" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded_email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};
