import exp from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../models/user.js";
import { authMiddleware } from "../middleware/auth.js";

export const authRouter = exp.Router();

const JWT_SECRET = process.env.JWT_SECRET || "url_shortener_secret_key_987654321";

// REGISTER
authRouter.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields (username, email, password) are required" });
    }

    // Check existing
    const existingUser = await userModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: "Email is already registered" });
      }
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const newUser = new userModel({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    await newUser.save();

    // Create Token
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    // Set HTTP-Only Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error during registration", error: err.message });
  }
});

// LOGIN
authRouter.post("/login", async (req, res) => {
  try {
    const { loginKey, password } = req.body; // loginKey can be email or username

    if (!loginKey || !password) {
      return res.status(400).json({ message: "Username/Email and password are required" });
    }

    // Find user by username or email
    const user = await userModel.findOne({
      $or: [
        { email: loginKey.toLowerCase() },
        { username: loginKey }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid username/email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username/email or password" });
    }

    // Create Token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    // Set HTTP-Only Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error during login", error: err.message });
  }
});

// LOGOUT
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logout successful" });
});

// GET CURRENT USER PROFILE
authRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ message: "Internal server error fetching user profile" });
  }
});
