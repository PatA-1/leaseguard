const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getProperties,
  createProperty,
  getPropertyById,
  getPropertySummary,
  updateProperty,
  deleteProperty
} = require("../controllers/propertyController");

const router = express.Router();

router.get("/", authMiddleware, getProperties);
router.post("/", authMiddleware, createProperty);
router.get("/:id", authMiddleware, getPropertyById);
router.get("/:id/summary", authMiddleware, getPropertySummary);
router.put("/:id", authMiddleware, updateProperty);
router.delete("/:id", authMiddleware, deleteProperty);

module.exports = router;
