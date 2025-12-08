import User from "../models/User";

export const createUser = async (req, res) => {
  try {
    const { name, email, photoURL, role, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.json({ message: "User already exists" });

    const newUser = new User({
      name,
      email,
      photoURL,
      role: role || "buyer",
      status: status || "pending",
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
