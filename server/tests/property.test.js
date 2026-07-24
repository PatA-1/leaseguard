const request = require("supertest");
const prisma = require("./prismaMock");
const app = require("../src/app");
const { createUser } = require("./helpers");

let token;
beforeEach(async () => {
  prisma.__reset();
  token = await createUser(app, "owner@test.com");
});

const auth = (req) => req.set("Authorization", `Bearer ${token}`);

describe("Properties", () => {
  test("creates a property with tenancy metadata", async () => {
    const res = await auth(
      request(app).post("/api/properties")
    ).send({
      name: "Flat 12",
      address: "1 Test Road",
      inspectionType: "CHECKOUT",
      moveInDate: "2025-01-15",
      depositAmount: "1200",
      depositScheme: "TDS",
      landlordName: "Jane Doe"
    });
    expect(res.status).toBe(201);
    expect(res.body.inspectionType).toBe("CHECKOUT");
    expect(res.body.depositAmount).toBe(1200);
    expect(res.body.depositScheme).toBe("TDS");
  });

  test("defaults invalid inspectionType to CHECKIN", async () => {
    const res = await auth(request(app).post("/api/properties")).send({
      name: "X",
      address: "Y",
      inspectionType: "BOGUS"
    });
    expect(res.body.inspectionType).toBe("CHECKIN");
  });

  test("rejects a property with no name", async () => {
    const res = await auth(request(app).post("/api/properties")).send({ address: "Y" });
    expect(res.status).toBe(400);
  });

  test("summary endpoint returns aggregated counts in one call", async () => {
    const prop = (await auth(request(app).post("/api/properties")).send({ name: "P", address: "A" })).body;
    const room = (await auth(request(app).post("/api/rooms")).send({ name: "Kitchen", propertyId: prop.id })).body;
    const img = (await auth(request(app).post("/api/images/upload"))
      .field("roomId", String(room.id))
      .attach("image", Buffer.from("fake"), "photo.jpg")).body;
    await auth(request(app).post("/api/annotations")).send({
      x: 0.5, y: 0.5, note: "crack", severity: "High", imageId: img.id
    });

    const res = await auth(request(app).get(`/api/properties/${prop.id}/summary`));
    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({ rooms: 1, images: 1, issues: 1 });
    expect(res.body.rooms[0].issueCount).toBe(1);
  });

  test("updates a property", async () => {
    const prop = (await auth(request(app).post("/api/properties")).send({ name: "P", address: "A" })).body;
    const res = await auth(request(app).put(`/api/properties/${prop.id}`)).send({ name: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
  });

  test("deletes a property and cascades", async () => {
    const prop = (await auth(request(app).post("/api/properties")).send({ name: "P", address: "A" })).body;
    const room = (await auth(request(app).post("/api/rooms")).send({ name: "R", propertyId: prop.id })).body;
    const del = await auth(request(app).delete(`/api/properties/${prop.id}`));
    expect(del.status).toBe(200);
    const check = await auth(request(app).get(`/api/rooms/${room.id}`));
    expect(check.status).toBe(404);
  });
});
