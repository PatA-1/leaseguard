const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createAnnotation,
  getAnnotationsByImage,
  deleteAnnotation
} = require("../controllers/annotationController");

const router = express.Router();

router.post("/", authMiddleware, createAnnotation);
router.get("/:imageId", authMiddleware, getAnnotationsByImage);
router.delete("/annotation/:id", authMiddleware, deleteAnnotation);

module.exports = router;
