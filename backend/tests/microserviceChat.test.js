jest.mock('axios', () => {
  const mockPost = jest.fn();
  return {
    create: jest.fn(() => ({
      post: mockPost,
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
    mockPost,
  };
});

const axios = require('axios');
const { generateChatResponse } = require('../src/controllers/microserviceController');

describe('shared AI response generation', () => {
  beforeEach(() => {
    axios.mockPost.mockReset();
  });

  it('uses the existing microservice chat contract and user wardrobe context', async () => {
    const response = { response: 'A relaxed outfit would work well.', outfits: [] };
    axios.mockPost.mockResolvedValue({ data: response });
    const history = Array.from({ length: 22 }, (_, index) => ({
      role: index % 2 ? 'assistant' : 'user',
      content: `turn ${index}`,
    }));
    const user = {
      _id: { toString: () => 'user-123' },
      preferences: { style: ['casual'] },
    };

    await expect(generateChatResponse('What should I wear?', history, user))
      .resolves.toEqual(response);

    expect(axios.mockPost).toHaveBeenCalledWith(
      '/chat',
      {
        message: 'What should I wear?',
        history: history.slice(-20),
        preferences: { style: ['casual'] },
      },
      { headers: { 'X-Closetly-User-Id': 'user-123' } }
    );
  });

  it('maps an existing AI service failure to the standard API error', async () => {
    axios.mockPost.mockRejectedValue({
      response: { status: 503, data: { detail: 'Stylist temporarily unavailable' } },
    });

    await expect(generateChatResponse('Suggest an outfit', [], { _id: 'user-123' }))
      .rejects.toMatchObject({
        statusCode: 503,
        message: 'Stylist temporarily unavailable',
      });
  });
});
