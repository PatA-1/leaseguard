const prisma = require("../utils/prisma");

const createAnnotation = async (req, res) => {
  try {
    const { x, y, note, severity, imageId } = req.body;

    if (x === undefined || y === undefined || !note || !severity || !imageId) {
      return res.status(400).json({ message: "All annotation fields are required" });
    }

    const image = await prisma.image.findFirst({
      where: {
        id: Number(imageId),
        room: { property: { userId: req.user.id } }
      }
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const annotation = await prisma.annotation.create({
      data: {
        x: Number(x),
        y: Number(y),
        note,
        severity,
        imageId: Number(imageId)
      }
    });

    return res.status(201).json(annotation);
  } catch (error) {
    console.error("CREATE ANNOTATION ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAnnotationsByImage = async (req, res) => {
  try {
    const imageId = Number(req.params.imageId);

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        room: { property: { userId: req.user.id } }
      },
      include: {
        annotations: { orderBy: { createdAt: "desc" } }
      }
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    return res.json(image.annotations);
  } catch (error) {
    console.error("GET ANNOTATIONS ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteAnnotation = async (req, res) => {
  try {
    const annotationId = Number(req.params.id);

    const annotation = await prisma.annotation.findFirst({
      where: {
        id: annotationId,
        image: { room: { property: { userId: req.user.id } } }
      }
    });

    if (!annotation) {
      return res.status(404).json({ message: "Annotation not found" });
    }

    await prisma.annotation.delete({ where: { id: annotationId } });

    return res.json({ message: "Annotation deleted" });
  } catch (error) {
    console.error("DELETE ANNOTATION ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createAnnotation,
  getAnnotationsByImage,
  deleteAnnotation
};
