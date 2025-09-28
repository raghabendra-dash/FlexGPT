import User from "./../models/User.js"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Chat from "../models/Chat.js";
import validator from "validator";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// API to register a user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Validate inputs
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all fields" });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters",
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // 3. Create and save the new user
    const user = await User.create({ name, email, password });

    // 4. Generate token
    const token = generateToken(user._id);

    // 5. Send response
    res.status(201).json({ success: true, token });
  } catch (error) {
    console.error("User registration error:", error); // Log the error for debugging
    res
      .status(500)
      .json({ success: false, message: "Something went wrong on the server" });
  }
};

// API to login a user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all fields" });
    }
    const user = await User.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = generateToken(user._id);
        return res.json({ success: true, token });
      }
    }

    return res.status(400).json({ success: false, message: "Invalid email or password" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// API to get user data
export const getUser = async (req, res) => {
  try {
    const user = req.user;
    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API to get published images
export const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await Chat.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.isImage": true, "messages.isPublished": true } },
      { $sort: { "messages.createdAt": -1 } },
      { $limit: 50 },
      {
        $project: {
          _id: 0,
          imageUrl: "$messages.content",
          userName: "$userName",
        },
      },
    ]);

    res.json({ success: true, images: publishedImageMessages.reverse() });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
