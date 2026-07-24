const request = require("supertest");
const prisma = require("./prismaMock");
const app = require("../src/app");
const { createUser } = require("./helpers");

// The security-critical suite: user B must never read or mutate user A's data.
let tokenA, tokenB, propA, roomA, imageA, annotationA;

beforeEach(async () => {
  prisma.__reset();
  tokenA = await createUser(app, "a@test.com");
  tokenB = await createUser(app, "b@test.com");

  const asA = (req) => req.set("Authorization", `Bearer ${tokenA}`);

  propA = (await asA(request(app).post("/api/properties")).send({ name: "A-Prop", address: "A" })).body;
  roomA = (await asA(request(app).post("/api/rooms")).send({ name: "A-Room", propertyId: propA.id })).body;
  imageA = (await asA(request(app).post("/api/images/upload"))
    .field("roomId", String(roomA.id))
    .attach("image", Buffer.from("fake"), "a.jpg")).body;
  annotationA = (await asA(request(app).post("/api/annotations")).send({
    x: 0.1, y: 0.1, note: "A note", severity: "Low", imageId: imageA.id
  })).body;
});

const asB = (req) => req.set("Authorization", `Bearer ${tokenB}`);

describe("Cross-user access control", () => {
  test("B cannot read A's property", async () => {
    const res = await asB(request(app).get(`/api/properties/${propA.id}`));
    expect(res.status).toBe(404);
  });

  test("B cannot read A's property summary", async () => {
    const res = await asB(request(app).get(`/api/properties/${propA.id}/summary`));
    expect(res.status).toBe(404);
  });

  test("B cannot delete A's property", async () => {
    const res = await asB(request(app).delete(`/api/properties/${propA.id}`));
    expect(res.status).toBe(404);
  });

  test("B cannot read A's room", async () => {
    const res = await asB(request(app).get(`/api/rooms/${roomA.id}`));
    expect(res.status).toBe(404);
  });

  test("B cannot list images in A's room (regression: previously unscoped)", async () => {
    const res = await asB(request(app).get(`/api/images/${roomA.id}`));
    expect(res.status).toBe(404);
  });

  test("B cannot read A's image by id (regression: previously unscoped)", async () => {
    const res = await asB(request(app).get(`/api/images/by-id/${imageA.id}`));
    expect(res.status).toBe(404);
  });

  test("B cannot delete A's image", async () => {
    const res = await asB(request(app).delete(`/api/images/${imageA.id}`));
    expect(res.status).toBe(404);
  });

  test("B cannot read annotations on A's image", async () => {
    const res = await asB(request(app).get(`/api/annotations/${imageA.id}`));
    expect(res.status).toBe(404);
  });

  test("B cannot delete A's annotation", async () => {
    const res = await asB(request(app).delete(`/api/annotations/annotation/${annotationA.id}`));
    expect(res.status).toBe(404);
  });

  test("B cannot read A's report", async () => {
    const res = await asB(request(app).get(`/api/reports/${propA.id}`));
    expect(res.status).toBe(404);
  });
});
