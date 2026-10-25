jest.mock('../src/models', () => ({
  StylistConversation: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('../src/controllers/microserviceController', () => ({
  generateChatResponse: jest.fn(),
}));

const { StylistConversation } = require('../src/models');
const { generateChatResponse } = require('../src/controllers/microserviceController');
const stylistController = require('../src/controllers/stylistController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const settleController = () => new Promise((resolve) => setImmediate(resolve));

describe('AI Stylist conversation controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a conversation for the authenticated user', async () => {
    const conversation = {
      toPublicJSON: () => ({ _id: 'conversation-1', messages: [] }),
    };
    StylistConversation.create.mockResolvedValue(conversation);
    const req = { user: { _id: 'user-1' } };
    const res = createResponse();

    await stylistController.createConversation(req, res);
    await settleController();

    expect(StylistConversation.create).toHaveBeenCalledWith({ user: 'user-1' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { conversation: { _id: 'conversation-1', messages: [] } },
    });
  });

  it('lists only the authenticated user conversations', async () => {
    const conversation = { _id: 'conversation-1', title: 'Outfit ideas' };
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([conversation]),
    };
    StylistConversation.find.mockReturnValue(query);
    StylistConversation.countDocuments.mockResolvedValue(1);
    const req = { user: { _id: 'user-1' }, query: { limit: '10', skip: '5' } };
    const res = createResponse();
    const next = jest.fn();

    await stylistController.getConversations(req, res, next);
    await settleController();

    expect(next).not.toHaveBeenCalled();
    expect(StylistConversation.find).toHaveBeenCalledWith({ user: 'user-1' });
    expect(StylistConversation.countDocuments).toHaveBeenCalledWith({ user: 'user-1' });
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { conversations: [conversation], total: 1, limit: 10, skip: 5 },
    });
  });

  it('does not return a conversation owned by another user', async () => {
    StylistConversation.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await stylistController.getConversation({
      params: { id: 'conversation-1' },
      user: { _id: 'user-2' },
    }, createResponse(), next);
    await settleController();

    expect(StylistConversation.findOne).toHaveBeenCalledWith({
      _id: 'conversation-1',
      user: 'user-2',
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'Conversation not found',
    }));
  });

  it('deletes only a conversation owned by the authenticated user', async () => {
    StylistConversation.findOneAndDelete.mockResolvedValue({ _id: 'conversation-1' });
    const res = createResponse();
    const next = jest.fn();

    await stylistController.deleteConversation({
      params: { id: 'conversation-1' },
      user: { _id: 'user-1' },
    }, res, next);
    await settleController();

    expect(StylistConversation.findOneAndDelete).toHaveBeenCalledWith({
      _id: 'conversation-1',
      user: 'user-1',
    });
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Conversation deleted successfully',
    });
  });

  it('returns not found when the conversation is not owned by the authenticated user', async () => {
    StylistConversation.findOneAndDelete.mockResolvedValue(null);
    const next = jest.fn();

    await stylistController.deleteConversation({
      params: { id: 'conversation-1' },
      user: { _id: 'user-2' },
    }, createResponse(), next);
    await settleController();

    expect(StylistConversation.findOneAndDelete).toHaveBeenCalledWith({
      _id: 'conversation-1',
      user: 'user-2',
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'Conversation not found',
    }));
  });

  it('saves the user/AI exchange without conflicting MongoDB message update paths', async () => {
    const response = {
      response: 'Try a relaxed denim look.',
      outfits: [{ name: 'Campus casual', items: [] }],
    };
    const initialConversation = {
      _id: 'conversation-1',
      user: 'user-1',
      title: 'New conversation',
      messageCount: 2,
      messages: [
        { role: 'user', content: 'I like blue', status: 'complete' },
        { role: 'assistant', content: 'Navy could work well.', status: 'complete' },
      ],
    };
    const completedConversation = {
      ...initialConversation,
      title: 'Suggest an outfit',
      messageCount: 4,
      messages: [
        ...initialConversation.messages,
        {
          role: 'user',
          content: 'Suggest an outfit',
          clientMessageId: 'a997e375-34c3-46a2-8b55-475b2e9a039b',
          status: 'complete',
        },
        {
          role: 'assistant',
          content: response.response,
          clientMessageId: 'a997e375-34c3-46a2-8b55-475b2e9a039b',
          status: 'complete',
          responseData: response,
        },
      ],
      toPublicJSON() { return this; },
    };
    StylistConversation.findOne.mockResolvedValue(initialConversation);
    StylistConversation.findOneAndUpdate
      .mockResolvedValueOnce({
        ...initialConversation,
        title: 'Suggest an outfit',
        messageCount: 3,
        messages: [
          ...initialConversation.messages,
          {
            role: 'user',
            content: 'Suggest an outfit',
            clientMessageId: 'a997e375-34c3-46a2-8b55-475b2e9a039b',
            status: 'processing',
          },
        ],
      })
      .mockResolvedValueOnce(completedConversation);
    generateChatResponse.mockResolvedValue(response);
    const res = createResponse();
    const next = jest.fn();

    await stylistController.sendMessage({
      params: { id: 'conversation-1' },
      body: {
        message: '  Suggest an outfit  ',
        clientMessageId: 'a997e375-34c3-46a2-8b55-475b2e9a039b',
      },
      user: { _id: 'user-1', preferences: { style: ['casual'] } },
    }, res, next);
    await settleController();

    expect(next).not.toHaveBeenCalled();
    expect(StylistConversation.findOne).toHaveBeenCalledWith({
      _id: 'conversation-1',
      user: 'user-1',
    });
    expect(generateChatResponse).toHaveBeenCalledWith(
      'Suggest an outfit',
      [
        { role: 'user', content: 'I like blue' },
        { role: 'assistant', content: 'Navy could work well.' },
      ],
      expect.objectContaining({ _id: 'user-1' })
    );
    expect(StylistConversation.findOneAndUpdate).toHaveBeenCalledTimes(2);
    const completionUpdate = StylistConversation.findOneAndUpdate.mock.calls[1][1];
    expect(completionUpdate).toHaveLength(1);
    const completionSet = completionUpdate[0].$set;
    const [mappedMessages, appendedMessages] = completionSet.messages.$concatArrays;
    expect(mappedMessages.$map.input).toBe('$messages');
    expect(mappedMessages.$map.in.$cond[1].$mergeObjects[1]).toEqual({
      status: 'complete',
    });
    expect(appendedMessages).toEqual([{
      $literal: {
        role: 'assistant',
        content: response.response,
        clientMessageId: 'a997e375-34c3-46a2-8b55-475b2e9a039b',
        status: 'complete',
        responseData: response,
        createdAt: expect.any(Date),
      },
    }]);
    expect(completionSet.lastMessage).toEqual({ $literal: response.response });
    expect(completionSet.messageCount).toEqual({
      $add: [{ $ifNull: ['$messageCount', 0] }, 1],
    });
    expect(completionUpdate[0].$push).toBeUndefined();
    expect(completionUpdate[0].$set).not.toHaveProperty('messages.$[userMessage].status');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { conversation: completedConversation, response },
    });
  });

  it('returns an already-saved reply for a repeated client message ID', async () => {
    const savedResponse = { response: 'Try a linen shirt.' };
    const conversation = {
      messages: [
        {
          role: 'user',
          content: 'Suggest an outfit',
          clientMessageId: '817e09a6-dcb4-44d3-9c7b-cfd316481edf',
          status: 'complete',
        },
        {
          role: 'assistant',
          content: savedResponse.response,
          clientMessageId: '817e09a6-dcb4-44d3-9c7b-cfd316481edf',
          responseData: savedResponse,
        },
      ],
      toPublicJSON() { return this; },
    };
    StylistConversation.findOne.mockResolvedValue(conversation);
    const res = createResponse();

    await stylistController.sendMessage({
      params: { id: 'conversation-1' },
      body: {
        message: 'Suggest an outfit',
        clientMessageId: '817e09a6-dcb4-44d3-9c7b-cfd316481edf',
      },
      user: { _id: 'user-1' },
    }, res, jest.fn());
    await settleController();

    expect(generateChatResponse).not.toHaveBeenCalled();
    expect(StylistConversation.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { conversation, response: savedResponse },
    });
  });

  it('marks a failed AI turn retryable without inserting a second user message', async () => {
    const conversation = {
      _id: 'conversation-1',
      messageCount: 1,
      messages: [{
        role: 'user',
        content: 'Help me dress for work',
        clientMessageId: '05397920-2fd4-48f7-8b04-08aaf5389c28',
        status: 'failed',
      }],
    };
    const claimedConversation = {
      ...conversation,
      messages: [{ ...conversation.messages[0], status: 'processing' }],
    };
    StylistConversation.findOne.mockResolvedValue(conversation);
    StylistConversation.findOneAndUpdate.mockResolvedValue(claimedConversation);
    StylistConversation.updateOne.mockResolvedValue({ modifiedCount: 1 });
    generateChatResponse.mockRejectedValue(new Error('AI service unavailable'));
    const next = jest.fn();

    await stylistController.sendMessage({
      params: { id: 'conversation-1' },
      body: {
        message: 'Help me dress for work',
        clientMessageId: '05397920-2fd4-48f7-8b04-08aaf5389c28',
      },
      user: { _id: 'user-1' },
    }, createResponse(), next);
    await settleController();

    expect(StylistConversation.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(StylistConversation.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'conversation-1', user: 'user-1' }),
      { $set: { 'messages.$.status': 'failed' } }
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: 'AI service unavailable',
    }));
  });
});
