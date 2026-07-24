const request = require("supertest");

async function createUser(app, email, password = "password123") {
  await request(app).post("/api/auth/register").send({ email, password });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
}

module.exports = { createUser };
