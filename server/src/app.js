const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const roomRoutes = require("./routes/roomRoutes");
const imageRoutes = require("./routes/imageRoutes");
const annotationRoutes = require("./routes/annotationRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();


app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.get("/api/health", (req, res) => {
  res.json({ message: "API is running" });
});


app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/annotations", annotationRoutes);
app.use("/api/reports", reportRoutes);
module.exports = app;