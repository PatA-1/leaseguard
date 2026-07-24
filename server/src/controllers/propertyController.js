const prisma = require("../utils/prisma");

// Allowed values kept server-side so the client cannot inject arbitrary types
const VALID_INSPECTION_TYPES = ["CHECKIN", "CHECKOUT"];

const parseOptionalDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const parseOptionalFloat = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
};

const getProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" }
    });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createProperty = async (req, res) => {
  try {
    const {
      name,
      address,
      inspectionType,
      moveInDate,
      depositAmount,
      depositScheme,
      landlordName
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({ message: "Name and address are required" });
    }

    const type = VALID_INSPECTION_TYPES.includes(inspectionType)
      ? inspectionType
      : "CHECKIN";

    const property = await prisma.property.create({
      data: {
        name,
        address,
        inspectionType: type,
        moveInDate: parseOptionalDate(moveInDate),
        depositAmount: parseOptionalFloat(depositAmount),
        depositScheme: depositScheme || null,
        landlordName: landlordName || null,
        userId: req.user.id
      }
    });

    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPropertyById = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id, 10);

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: req.user.id
      },
      include: {
        rooms: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Single aggregated endpoint: rooms with image and issue counts in one query.
// Replaces the previous N+1 waterfall on the frontend.
const getPropertySummary = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id, 10);

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: req.user.id
      },
      include: {
        rooms: {
          orderBy: { createdAt: "asc" },
          include: {
            images: {
              include: {
                _count: { select: { annotations: true } }
              }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const rooms = property.rooms.map((room) => {
      const imageCount = room.images.length;
      const issueCount = room.images.reduce(
        (sum, img) => sum + img._count.annotations,
        0
      );
      return {
        id: room.id,
        name: room.name,
        createdAt: room.createdAt,
        imageCount,
        issueCount
      };
    });

    const totals = rooms.reduce(
      (acc, r) => {
        acc.images += r.imageCount;
        acc.issues += r.issueCount;
        return acc;
      },
      { rooms: rooms.length, images: 0, issues: 0 }
    );

    res.json({
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        inspectionType: property.inspectionType,
        moveInDate: property.moveInDate,
        depositAmount: property.depositAmount,
        depositScheme: property.depositScheme,
        landlordName: property.landlordName,
        createdAt: property.createdAt
      },
      rooms,
      totals
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id, 10);

    const existing = await prisma.property.findFirst({
      where: { id: propertyId, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ message: "Property not found" });
    }

    const {
      name,
      address,
      inspectionType,
      moveInDate,
      depositAmount,
      depositScheme,
      landlordName
    } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address;
    if (inspectionType !== undefined && VALID_INSPECTION_TYPES.includes(inspectionType)) {
      data.inspectionType = inspectionType;
    }
    if (moveInDate !== undefined) data.moveInDate = parseOptionalDate(moveInDate);
    if (depositAmount !== undefined) data.depositAmount = parseOptionalFloat(depositAmount);
    if (depositScheme !== undefined) data.depositScheme = depositScheme || null;
    if (landlordName !== undefined) data.landlordName = landlordName || null;

    const property = await prisma.property.update({
      where: { id: propertyId },
      data
    });

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id, 10);

    const existing = await prisma.property.findFirst({
      where: { id: propertyId, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Rooms, images and annotations cascade via the schema relations
    await prisma.property.delete({ where: { id: propertyId } });

    res.json({ message: "Property deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProperties,
  createProperty,
  getPropertyById,
  getPropertySummary,
  updateProperty,
  deleteProperty
};
