const request = require("supertest");
const prisma = require("./prismaMock");
const app = require("../src/app");

beforeEach(() => prisma.__reset());

describe("Auth", () => {
  test("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("a@test.com");
  });

  test("rejects duplicate registration", async () => {
    await request(app).post("/api/auth/register").send({ email: "a@test.com", password: "x" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "x" });
    expect(res.status).toBe(400);
  });

  test("logs in and returns a token", async () => {
    await request(app).post("/api/auth/register").send({ email: "a@test.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test("rejects wrong password", async () => {
    await request(app).post("/api/auth/register").send({ email: "a@test.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@test.com", password: "wrong" });
    expect(res.status).toBe(400);
  });

  test("blocks protected routes without a token", async () => {
    const res = await request(app).get("/api/properties");
    expect(res.status).toBe(401);
  });
});
