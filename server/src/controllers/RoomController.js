const prisma = require("../utils/prisma");

const createRoom = async (req, res) => {
  try {
    const { name, propertyId } = req.body;

    if (!name || !propertyId) {
      return res.status(400).json({ message: "Name and propertyId are required" });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: req.user.id
      }
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const room = await prisma.room.create({
      data: { name, propertyId }
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getRoomById = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id, 10);

    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        property: { userId: req.user.id }
      }
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id, 10);
    const { name } = req.body;

    const room = await prisma.room.findFirst({
      where: { id: roomId, property: { userId: req.user.id } }
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: { name: name ?? room.name }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id, 10);

    const room = await prisma.room.findFirst({
      where: { id: roomId, property: { userId: req.user.id } }
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    await prisma.room.delete({ where: { id: roomId } });

    res.json({ message: "Room deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createRoom,
  getRoomById,
  updateRoom,
  deleteRoom
};
