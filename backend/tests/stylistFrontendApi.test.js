const ACCESS_TOKEN_KEY = 'closetly_access_token';
const REFRESH_TOKEN_KEY = 'closetly_refresh_token';

const makeToken = (expiresAt) => (
  `header.${Buffer.from(JSON.stringify({ exp: expiresAt })).toString('base64')}.signature`
);

const makeResponse = (status, data) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => data,
});

describe('AI Stylist frontend API client', () => {
  let storage;

  beforeEach(() => {
    storage = new Map();
    global.localStorage = {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    };
    global.window = { location: { href: '' } };
    global.fetch = jest.fn();
    jest.resetModules();
  });

  it('uses authenticated Node conversation endpoints', async () => {
    storage.set(ACCESS_TOKEN_KEY, makeToken(Math.floor(Date.now() / 1000) + 3600));
    global.fetch
      .mockResolvedValueOnce(makeResponse(201, {
        success: true,
        data: { conversation: { _id: 'chat-1', messages: [] } },
      }))
      .mockResolvedValueOnce(makeResponse(200, {
        success: true,
        data: { conversations: [{ _id: 'chat-1' }], total: 1 },
      }))
      .mockResolvedValueOnce(makeResponse(200, {
        success: true,
        data: { conversation: { _id: 'chat-1', messages: [] } },
      }))
      .mockResolvedValueOnce(makeResponse(200, {
        success: true,
        message: 'Conversation deleted successfully',
      }))
      .mockResolvedValueOnce(makeResponse(200, {
        success: true,
        data: { conversation: { _id: 'chat-1' }, response: { response: 'Try navy.' } },
      }));
    const Api = require('../../frontend/script/api');

    await Api.stylist.createConversation();
    await Api.stylist.getConversations({ limit: 100, skip: 0 });
    await Api.stylist.getConversation('chat-1');
    await Api.stylist.deleteConversation('chat-1');
    const result = await Api.stylist.sendMessage(
      'chat-1',
      'Suggest an outfit',
      'a997e375-34c3-46a2-8b55-475b2e9a039b'
    );

    expect(result.response.response).toBe('Try navy.');
    expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://closetly-io.vercel.app/api/stylist/conversations',
      'https://closetly-io.vercel.app/api/stylist/conversations?limit=100&skip=0',
      'https://closetly-io.vercel.app/api/stylist/conversations/chat-1',
      'https://closetly-io.vercel.app/api/stylist/conversations/chat-1',
      'https://closetly-io.vercel.app/api/stylist/conversations/chat-1/messages',
    ]);
    global.fetch.mock.calls.forEach(([, options]) => {
      expect(options.headers.Authorization).toMatch(/^Bearer /);
      expect(options.credentials).toBe('include');
    });
    expect(JSON.parse(global.fetch.mock.calls[4][1].body)).toEqual({
      message: 'Suggest an outfit',
      clientMessageId: 'a997e375-34c3-46a2-8b55-475b2e9a039b',
    });
    expect(global.fetch.mock.calls[3][1].method).toBe('DELETE');
  });

  it('parses the retried Stylist response after access-token refresh', async () => {
    const oldToken = makeToken(Math.floor(Date.now() / 1000) + 3600);
    const newToken = makeToken(Math.floor(Date.now() / 1000) + 7200);
    storage.set(ACCESS_TOKEN_KEY, oldToken);
    storage.set(REFRESH_TOKEN_KEY, 'refresh-token');
    global.fetch
      .mockResolvedValueOnce(makeResponse(401, { message: 'Expired' }))
      .mockResolvedValueOnce(makeResponse(200, {
        data: { accessToken: newToken, refreshToken: 'new-refresh-token' },
      }))
      .mockResolvedValueOnce(makeResponse(200, {
        success: true,
        data: { conversations: [{ _id: 'chat-1' }], total: 1 },
      }));
    const Api = require('../../frontend/script/api');

    const result = await Api.stylist.getConversations();

    expect(result.conversations).toEqual([{ _id: 'chat-1' }]);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[2][1].headers.Authorization).toBe(`Bearer ${newToken}`);
  });

  it('routes local Stylist requests to the local Node backend', async () => {
    global.window.location.hostname = '127.0.0.1';
    global.window.location.protocol = 'http:';
    global.fetch.mockResolvedValue(makeResponse(200, {
      success: true,
      data: { conversations: [], total: 0, limit: 50, skip: 0 },
    }));
    const Api = require('../../frontend/script/api');

    await Api.stylist.getConversations();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/stylist/conversations?limit=50&skip=0',
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });
});
