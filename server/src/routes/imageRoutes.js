const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  uploadImage,
  getImagesByRoom,
  getImageById,
  updateImage,
  deleteImage
} = require("../controllers/imageController");

const router = express.Router();

router.post("/upload", authMiddleware, upload.single("image"), uploadImage);
router.get("/by-id/:id", authMiddleware, getImageById);
router.get("/:roomId", authMiddleware, getImagesByRoom);
router.put("/:id", authMiddleware, updateImage);
router.delete("/:id", authMiddleware, deleteImage);

module.exports = router;
