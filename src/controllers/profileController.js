import admin from "../config/firebase.js";
import User from "../models/User.js";

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user profile
 */

export const updateProfile = async (req, res) => {
  try {
    const { displayName, email, photoURL } = req.body;
    const firebaseUid = req.firebaseUid;

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email already in use in our database" });
      }
    }

    try {
      await admin.auth().updateUser(firebaseUid, {
        email: email || user.email,
        displayName: displayName || user.displayName,
        photoURL: photoURL || user.photoURL,
      });
    } catch (firebaseError) {
      console.error("Firebase Update Error:", firebaseError);
      if (firebaseError.code === "auth/email-already-exists") {
        return res
          .status(400)
          .json({ message: "Email already exists in Firebase" });
      }
      return res
        .status(500)
        .json({ message: "Failed to update Firebase profile" });
    }
    user.displayName = displayName || user.displayName;
    user.email = email || user.email;
    user.photoURL = photoURL || user.photoURL;

    await user.save();

    res.json({
      message: "Profile updated successfully!",
      user: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("General Update Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
