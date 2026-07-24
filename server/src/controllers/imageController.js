const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const prisma = require("../utils/prisma");

// Confirms the room belongs to the requesting user before any image action
const findOwnedRoom = (roomId, userId) =>
  prisma.room.findFirst({
    where: {
      id: roomId,
      property: { userId }
    }
  });

// Upload image to Cloudinary
const uploadImage = async (req, res) => {
  try {
    const roomId = parseInt(req.body.roomId, 10);
    const { caption } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // Ownership check: only upload to a room the user owns
    const room = await findOwnedRoom(roomId, req.user.id);
    if (!room) {
      // Remove the temp file we are not going to use
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Room not found" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "leaseguard"
    });

    // Delete temp file from server
    fs.unlinkSync(req.file.path);

    // Save to DB
    const image = await prisma.image.create({
      data: {
        url: result.secure_url, // FULL URL from Cloudinary
        caption: caption || null,
        roomId
      }
    });

    return res.status(201).json(image);
  } catch (error) {
    console.error("UPLOAD IMAGE ERROR:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// Get all images for a room (scoped to the owner)
const getImagesByRoom = async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);

    const room = await findOwnedRoom(roomId, req.user.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const images = await prisma.image.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" }
    });

    res.json(images);
  } catch (error) {
    console.error("GET IMAGES ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get image by ID, with annotations (scoped to the owner)
const getImageById = async (req, res) => {
  try {
    const imageId = parseInt(req.params.id, 10);

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        room: {
          property: { userId: req.user.id }
        }
      },
      include: {
        annotations: true
      }
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json(image);
  } catch (error) {
    console.error("GET IMAGE BY ID ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update an image caption (scoped to the owner)
const updateImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.id, 10);
    const { caption } = req.body;

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        room: { property: { userId: req.user.id } }
      }
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const updated = await prisma.image.update({
      where: { id: imageId },
      data: { caption: caption ?? null }
    });

    res.json(updated);
  } catch (error) {
    console.error("UPDATE IMAGE ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete an image (scoped to the owner). Annotations cascade.
const deleteImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.id, 10);

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        room: { property: { userId: req.user.id } }
      }
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Best-effort removal from Cloudinary if we can derive the public_id
    try {
      const match = image.url.match(/leaseguard\/([^./]+)/);
      if (match) {
        await cloudinary.uploader.destroy(`leaseguard/${match[1]}`);
      }
    } catch (cloudErr) {
      console.error("CLOUDINARY DELETE WARNING:", cloudErr.message);
    }

    await prisma.image.delete({ where: { id: imageId } });

    res.json({ message: "Image deleted" });
  } catch (error) {
    console.error("DELETE IMAGE ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  uploadImage,
  getImagesByRoom,
  getImageById,
  updateImage,
  deleteImage
};
