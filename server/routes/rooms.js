const express = require("express");
const Room = require("../models/Room");
const Message = require("../models/Message");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
	try {
		const rooms = await Room.find({}).sort({ createdAt: 1 });
		return res.json(rooms);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch rooms" });
	}
});

router.post("/", async (req, res) => {
	const { name, description = "" } = req.body;

	if (!name || !name.trim()) {
		return res.status(400).json({ message: "Room name is required" });
	}

	try {
		const existingRoom = await Room.findOne({ name: name.trim() });
		if (existingRoom) {
			return res.status(400).json({ message: "Room already exists" });
		}

		const room = await Room.create({
			name: name.trim(),
			description: description.trim(),
			createdBy: req.user._id,
			members: [req.user._id],
		});

		return res.status(201).json(room);
	} catch (error) {
		return res.status(500).json({ message: "Failed to create room" });
	}
});

router.get("/:roomId/messages", async (req, res) => {
	try {
		const messages = await Message.find({ room: req.params.roomId })
			.sort({ createdAt: 1 })
			.populate("sender", "username avatarColor");

		return res.json(messages);
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch messages" });
	}
});

module.exports = router;
