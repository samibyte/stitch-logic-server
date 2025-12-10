import User from "../models/User.js";

/**
 * Get all users
 * Optional query: searchText
 */
export const getUsers = async (req, res) => {
  try {
    const searchText = req.query.searchText;
    const query = {};

    if (searchText) {
      query.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { email: { $regex: searchText, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).limit(20);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get single user by email
 */
export const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new user
 * Note: Password is handled by Firebase Auth, no password here
 */
export const createUser = async (req, res) => {
  try {
    const { displayName, email, photoURL, role, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.json({ message: "User already exists" });

    const newUser = new User({
      displayName,
      email,
      photoURL,
      role: role || "buyer",
      status: status || "pending",
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
