const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getPropertyReport } = require("../controllers/reportController");

const router = express.Router();

router.get("/:propertyId", authMiddleware, getPropertyReport);

module.exports = router;