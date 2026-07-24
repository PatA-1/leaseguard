const request = require("supertest");
const prisma = require("./prismaMock");
const app = require("../src/app");
const { createUser } = require("./helpers");

let token, prop, room;
beforeEach(async () => {
  prisma.__reset();
  token = await createUser(app, "owner@test.com");
  const auth = (req) => req.set("Authorization", `Bearer ${token}`);
  prop = (await auth(request(app).post("/api/properties")).send({ name: "P", address: "A" })).body;
  room = (await auth(request(app).post("/api/rooms")).send({ name: "Kitchen", propertyId: prop.id })).body;
});
const auth = (req) => req.set("Authorization", `Bearer ${token}`);

describe("Rooms", () => {
  test("renames a room", async () => {
    const res = await auth(request(app).put(`/api/rooms/${room.id}`)).send({ name: "Lounge" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Lounge");
  });
  test("deletes a room", async () => {
    const res = await auth(request(app).delete(`/api/rooms/${room.id}`));
    expect(res.status).toBe(200);
    const check = await auth(request(app).get(`/api/rooms/${room.id}`));
    expect(check.status).toBe(404);
  });
});

describe("Images", () => {
  test("uploads an image with a caption", async () => {
    const res = await auth(request(app).post("/api/images/upload"))
      .field("roomId", String(room.id))
      .field("caption", "Carpet clean on move-in")
      .attach("image", Buffer.from("fake"), "photo.jpg");
    expect(res.status).toBe(201);
    expect(res.body.caption).toBe("Carpet clean on move-in");
    expect(res.body.url).toContain("cdn.test");
  });

  test("updates an image caption", async () => {
    const img = (await auth(request(app).post("/api/images/upload"))
      .field("roomId", String(room.id))
      .attach("image", Buffer.from("fake"), "photo.jpg")).body;
    const res = await auth(request(app).put(`/api/images/${img.id}`)).send({ caption: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.caption).toBe("Updated");
  });

  test("rejects upload with no file", async () => {
    const res = await auth(request(app).post("/api/images/upload")).field("roomId", String(room.id));
    expect(res.status).toBe(400);
  });
});

describe("Annotations", () => {
  let img;
  beforeEach(async () => {
    img = (await auth(request(app).post("/api/images/upload"))
      .field("roomId", String(room.id))
      .attach("image", Buffer.from("fake"), "photo.jpg")).body;
  });

  test("creates an annotation", async () => {
    const res = await auth(request(app).post("/api/annotations")).send({
      x: 0.5, y: 0.5, note: "Scuff", severity: "Medium", imageId: img.id
    });
    expect(res.status).toBe(201);
    expect(res.body.severity).toBe("Medium");
  });

  test("rejects annotation missing fields", async () => {
    const res = await auth(request(app).post("/api/annotations")).send({ x: 0.5, imageId: img.id });
    expect(res.status).toBe(400);
  });

  test("deletes an annotation", async () => {
    const ann = (await auth(request(app).post("/api/annotations")).send({
      x: 0.5, y: 0.5, note: "Scuff", severity: "Medium", imageId: img.id
    })).body;
    const res = await auth(request(app).delete(`/api/annotations/annotation/${ann.id}`));
    expect(res.status).toBe(200);
  });
});
