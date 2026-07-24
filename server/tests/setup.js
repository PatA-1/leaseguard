process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://test";

// Redirect the app's prisma util to our in-memory mock
jest.mock("../src/utils/prisma", () => require("./prismaMock"));

// Mock Cloudinary so no network calls happen
jest.mock("../src/config/cloudinary", () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({ secure_url: "https://cdn.test/leaseguard/photo1.jpg" }),
    destroy: jest.fn().mockResolvedValue({ result: "ok" })
  }
}));
