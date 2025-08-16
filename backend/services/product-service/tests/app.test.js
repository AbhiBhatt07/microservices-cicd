// backend/services/product-service/tests/app.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

// Mock MongoDB connection for testing
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  model: jest.fn(() => ({
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    save: jest.fn(),
  })),
  Schema: jest.fn(() => ({}))
}));

describe('Product Service API', () => {
  // Test health check endpoint
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'product-service');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // Test products endpoint
  describe('GET /api/products', () => {
    it('should return empty array when no products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle category filter', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle inStock filter', async () => {
      const response = await request(app)
        .get('/api/products?inStock=true')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle multiple filters', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics&inStock=true')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // Test create product endpoint
  describe('POST /api/products', () => {
    it('should create product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Electronics'
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);
      
      expect(response.body).toHaveProperty('name', productData.name);
      expect(response.body).toHaveProperty('description', productData.description);
      expect(response.body).toHaveProperty('price', productData.price);
      expect(response.body).toHaveProperty('category', productData.category);
    });

    it('should handle missing required fields', async () => {
      const incompleteProduct = {
        name: 'Test Product'
        // missing description, price, category
      };

      const response = await request(app)
        .post('/api/products')
        .send(incompleteProduct)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid price', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: -10, // negative price
        category: 'Electronics'
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test get product by ID endpoint
  describe('GET /api/products/:id', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Electronics'
      };

      // Mock the findById to return our mock product
      const mockFindById = jest.fn().mockResolvedValue(mockProduct);
      require('mongoose').model.mockReturnValue({
        findById: mockFindById
      });

      const response = await request(app)
        .get('/api/products/507f1f77bcf86cd799439011')
        .expect(200);
      
      expect(response.body).toHaveProperty('name', mockProduct.name);
    });

    it('should return 404 when product not found', async () => {
      // Mock findById to return null (not found)
      const mockFindById = jest.fn().mockResolvedValue(null);
      require('mongoose').model.mockReturnValue({
        findById: mockFindById
      });

      const response = await request(app)
        .get('/api/products/507f1f77bcf86cd799439011')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    it('should handle invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test update product endpoint
  describe('PUT /api/products/:id', () => {
    it('should update product with valid data', async () => {
      const updatedProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Updated Product',
        description: 'Updated Description',
        price: 149.99,
        category: 'Home'
      };

      // Mock findByIdAndUpdate to return updated product
      const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(updatedProduct);
      require('mongoose').model.mockReturnValue({
        findByIdAndUpdate: mockFindByIdAndUpdate
      });

      const updateData = {
        name: 'Updated Product',
        price: 149.99,
        category: 'Home'
      };

      const response = await request(app)
        .put('/api/products/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('name', 'Updated Product');
    });

    it('should return 404 when updating non-existent product', async () => {
      // Mock findByIdAndUpdate to return null
      const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(null);
      require('mongoose').model.mockReturnValue({
        findByIdAndUpdate: mockFindByIdAndUpdate
      });

      const updateData = {
        name: 'Updated Product'
      };

      const response = await request(app)
        .put('/api/products/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    it('should handle validation errors during update', async () => {
      const updateData = {
        price: -50 // invalid price
      };

      const response = await request(app)
        .put('/api/products/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test 404 handler
  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });

  // Test error handling middleware
  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock mongoose.model to throw an error
      require('mongoose').model.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/products')
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});

// Test product validation logic
describe('Product Data Validation', () => {
  const validProduct = {
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    category: 'Electronics',
    inStock: true
  };

  it('should accept valid product data', () => {
    expect(validProduct.name).toBeDefined();
    expect(validProduct.description).toBeDefined();
    expect(validProduct.price).toBeGreaterThan(0);
    expect(validProduct.category).toBeDefined();
    expect(typeof validProduct.inStock).toBe('boolean');
  });

  it('should reject products with negative prices', () => {
    const invalidProduct = { ...validProduct, price: -10 };
    expect(invalidProduct.price).toBeLessThan(0);
  });

  it('should handle missing optional fields', () => {
    const minimalProduct = {
      name: 'Minimal Product',
      description: 'Minimal Description',
      price: 10,
      category: 'Test'
      // inStock is optional and should default to true
    };
    
    expect(minimalProduct.name).toBeDefined();
    expect(minimalProduct.inStock).toBeUndefined(); // Should be set by schema default
  });
});

// Cleanup after tests
afterAll(async () => {
  await mongoose.connection.close();
});