import Suspension from "../models/Suspension.js";
import User from "../models/User.js";

/**
 * Suspend a user
 */
export const suspendUser = async (req, res) => {
  try {
    const { userId, reason, feedback } = req.body;

    const suspension = new Suspension({
      userId,
      reason,
      feedback,
      suspendedBy: req.user.email,
    });
    await suspension.save();

    await User.findByIdAndUpdate(userId, { status: "suspended" });

    res
      .status(201)
      .json({ message: "User suspended successfully", suspension });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get suspension feedback for a user
 */
export const getSuspensionByUser = async (req, res) => {
  try {
    const suspensions = await Suspension.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });
    res.json(suspensions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
