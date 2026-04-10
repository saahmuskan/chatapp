const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const getRandomColor = () => {
	const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
	return colors[Math.floor(Math.random() * colors.length)];
};

router.post("/register", async (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		return res.status(400).json({ message: "Please fill in all fields" });
	}

	try {
		const existingUser = await User.findOne({ $or: [{ email }, { username }] });
		if (existingUser) {
			return res.status(400).json({ message: "Username or email already in use" });
		}

		const user = await User.create({
			username,
			email,
			password,
			avatarColor: getRandomColor(),
		});

		return res.status(201).json({
			_id: user._id,
			username: user.username,
			email: user.email,
			avatarColor: user.avatarColor,
			token: generateToken(user._id),
		});
	} catch (error) {
		return res.status(500).json({ message: "Server error during registration" });
	}
});

router.post("/login", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: "Please provide email and password" });
	}

	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		return res.json({
			_id: user._id,
			username: user.username,
			email: user.email,
			avatarColor: user.avatarColor,
			token: generateToken(user._id),
		});
	} catch (error) {
		return res.status(500).json({ message: "Server error during login" });
	}
});

router.get("/me", protect, (req, res) => {
	res.json(req.user);
});

module.exports = router;
