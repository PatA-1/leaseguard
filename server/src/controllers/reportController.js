const prisma = require("../utils/prisma");

const getPropertyReport = async (req, res) => {
  try {
    const propertyId = Number(req.params.propertyId);

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
              orderBy: { createdAt: "asc" },
              include: {
                annotations: {
                  orderBy: { createdAt: "asc" }
                }
              }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.json({
      property,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("GET PROPERTY REPORT ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getPropertyReport };
