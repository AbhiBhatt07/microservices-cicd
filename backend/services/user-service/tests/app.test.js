// backend/services/user-service/tests/app.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");

// Mock MongoDB connection for testing
jest.mock("mongoose", () => ({
  connect: jest.fn(),
  model: jest.fn(() => ({
    find: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  })),
  Schema: jest.fn(() => ({})),
}));

describe("User Service API", () => {
  // Test health check endpoint
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("service", "user-service");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  // Test users endpoint
  describe("GET /api/users", () => {
    it("should return empty array when no users", async () => {
      const response = await request(app).get("/api/users").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // Test create user endpoint
  describe("POST /api/users", () => {
    it("should create user with valid data", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("name", userData.name);
      expect(response.body).toHaveProperty("email", userData.email);
    });
  });

  // Test 404 handler
  describe("GET /nonexistent", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/nonexistent").expect(404);

      expect(response.body).toHaveProperty("error", "Route not found");
    });
  });
});

// Cleanup after tests
afterAll(async () => {
  await mongoose.connection.close();
});
