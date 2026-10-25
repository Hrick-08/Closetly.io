jest.mock('../src/models', () => ({
  User: {
    findById: jest.fn(),
  },
  StylistConversation: {},
}));

jest.mock('../src/controllers/stylistController', () => ({
  createConversation: (req, res) => res.status(201).json({
    success: true,
    userId: req.user._id.toString(),
  }),
  getConversations: (req, res) => res.json({
    success: true,
    userId: req.user._id.toString(),
  }),
  getConversation: (req, res) => res.json({ success: true }),
  deleteConversation: (req, res) => res.json({
    success: true,
    userId: req.user._id.toString(),
  }),
  sendMessage: (req, res) => res.json({ success: true }),
}));

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');
const config = require('../src/config');
const { User } = require('../src/models');
const stylistRoutes = require('../src/routes/stylist');

describe('AI Stylist routes', () => {
  const app = express();
  const userId = new mongoose.Types.ObjectId();

  beforeAll(() => {
    app.use(express.json());
    app.use('/api/stylist', stylistRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: userId }),
    });
  });

  const authHeader = () => `Bearer ${jwt.sign({ id: userId.toString() }, config.jwtSecret)}`;

  it('requires authentication for conversation routes', async () => {
    const response = await request(app).get('/api/stylist/conversations');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('passes the authenticated account into the protected conversation route', async () => {
    const response = await request(app)
      .post('/api/stylist/conversations')
      .set('Authorization', authHeader());

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(userId.toString());
    expect(User.findById).toHaveBeenCalledWith(userId.toString());
  });

  it('requires authentication and validates IDs when deleting a conversation', async () => {
    const unauthorized = await request(app).delete('/api/stylist/conversations/not-an-id');
    expect(unauthorized.status).toBe(401);

    const invalidId = await request(app)
      .delete('/api/stylist/conversations/not-an-id')
      .set('Authorization', authHeader());
    expect(invalidId.status).toBe(400);

    const response = await request(app)
      .delete(`/api/stylist/conversations/${userId}`)
      .set('Authorization', authHeader());
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(userId.toString());
  });

  it('validates conversation IDs and message bodies', async () => {
    const response = await request(app)
      .post('/api/stylist/conversations/not-an-id/messages')
      .set('Authorization', authHeader())
      .send({ message: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('validates conversation pagination parameters', async () => {
    const response = await request(app)
      .get('/api/stylist/conversations?limit=500')
      .set('Authorization', authHeader());

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });
});
