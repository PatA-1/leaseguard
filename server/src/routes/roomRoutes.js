const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createRoom,
  getRoomById,
  updateRoom,
  deleteRoom
} = require("../controllers/RoomController");

const router = express.Router();

router.post("/", authMiddleware, createRoom);
router.get("/:id", authMiddleware, getRoomById);
router.put("/:id", authMiddleware, updateRoom);
router.delete("/:id", authMiddleware, deleteRoom);

module.exports = router;
