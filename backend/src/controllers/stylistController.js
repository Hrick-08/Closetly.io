/**
 * Persistent AI Stylist conversations
 */
const crypto = require('crypto');
const { StylistConversation } = require('../models');
const { generateChatResponse } = require('./microserviceController');
const { AppError, NotFoundError, catchAsync } = require('../middleware/errorHandler');

const serializeConversation = (conversation) => (
  typeof conversation.toPublicJSON === 'function'
    ? conversation.toPublicJSON()
    : conversation
);

exports.createConversation = catchAsync(async (req, res) => {
  const conversation = await StylistConversation.create({
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: { conversation: serializeConversation(conversation) },
  });
});

exports.getConversations = catchAsync(async (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10) || 50;
  const skip = Number.parseInt(req.query.skip, 10) || 0;
  const filter = { user: req.user._id };

  const [conversations, total] = await Promise.all([
    StylistConversation.find(filter)
      .select('title lastMessage messageCount createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    StylistConversation.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      conversations: conversations.map(serializeConversation),
      total,
      limit,
      skip,
    },
  });
});

exports.getConversation = catchAsync(async (req, res, next) => {
  const conversation = await StylistConversation.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!conversation) {
    return next(new NotFoundError('Conversation not found'));
  }

  res.json({
    success: true,
    data: { conversation: serializeConversation(conversation) },
  });
});

exports.deleteConversation = catchAsync(async (req, res, next) => {
  const conversation = await StylistConversation.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!conversation) {
    return next(new NotFoundError('Conversation not found'));
  }

  res.json({
    success: true,
    message: 'Conversation deleted successfully',
  });
});

exports.sendMessage = catchAsync(async (req, res, next) => {
  const conversationId = req.params.id;
  const userId = req.user._id;
  const message = req.body.message.trim();
  const clientMessageId = req.body.clientMessageId || crypto.randomUUID();

  let conversation = await StylistConversation.findOne({
    _id: conversationId,
    user: userId,
  });

  if (!conversation) {
    return next(new NotFoundError('Conversation not found'));
  }

  let userMessage = conversation.messages.find(
    (entry) => entry.clientMessageId === clientMessageId && entry.role === 'user'
  );
  let assistantMessage = conversation.messages.find(
    (entry) => entry.clientMessageId === clientMessageId && entry.role === 'assistant'
  );

  if (userMessage && userMessage.content !== message) {
    return next(new AppError('This message ID has already been used', 409));
  }

  if (assistantMessage) {
    return res.json({
      success: true,
      data: {
        conversation: serializeConversation(conversation),
        response: assistantMessage.responseData,
      },
    });
  }

  if (userMessage && userMessage.status !== 'failed') {
    return next(new AppError('This message is already being processed', 409));
  }

  const history = conversation.messages
    .filter((entry) => (
      entry.clientMessageId !== clientMessageId
      && entry.status === 'complete'
      && (entry.role === 'user' || entry.role === 'assistant')
    ))
    .slice(-20)
    .map(({ role, content }) => ({ role, content }));

  if (!userMessage) {
    const updates = {
      $push: {
        messages: {
          role: 'user',
          content: message,
          clientMessageId,
          status: 'processing',
        },
      },
      $inc: { messageCount: 1 },
      $set: { lastMessage: message },
    };

    if (conversation.messageCount === 0) {
      updates.$set.title = message.slice(0, 100);
    }

    conversation = await StylistConversation.findOneAndUpdate(
      {
        _id: conversationId,
        user: userId,
        'messages.clientMessageId': { $ne: clientMessageId },
      },
      updates,
      { new: true }
    );
  } else {
    conversation = await StylistConversation.findOneAndUpdate(
      {
        _id: conversationId,
        user: userId,
        messages: {
          $elemMatch: {
            clientMessageId,
            role: 'user',
            status: 'failed',
          },
        },
      },
      { $set: { 'messages.$.status': 'processing' } },
      { new: true }
    );
  }

  if (!conversation) {
    const latest = await StylistConversation.findOne({
      _id: conversationId,
      user: userId,
    });
    if (!latest) {
      return next(new NotFoundError('Conversation not found'));
    }

    assistantMessage = latest.messages.find(
      (entry) => entry.clientMessageId === clientMessageId && entry.role === 'assistant'
    );
    if (assistantMessage) {
      return res.json({
        success: true,
        data: {
          conversation: serializeConversation(latest),
          response: assistantMessage.responseData,
        },
      });
    }
    return next(new AppError('This message is already being processed', 409));
  }

  userMessage = conversation.messages.find(
    (entry) => entry.clientMessageId === clientMessageId && entry.role === 'user'
  );

  let response;
  try {
    response = await generateChatResponse(message, history, req.user);
    if (!response || typeof response !== 'object') {
      throw new AppError('AI service returned an invalid response', 502);
    }
  } catch (error) {
    await StylistConversation.updateOne(
      {
        _id: conversationId,
        user: userId,
        messages: {
          $elemMatch: {
            clientMessageId,
            role: 'user',
            status: 'processing',
          },
        },
      },
      { $set: { 'messages.$.status': 'failed' } }
    );
    return next(error);
  }

  const assistantContent = typeof response.response === 'string' ? response.response : '';
  const completionTime = new Date();
  const completedConversation = await StylistConversation.findOneAndUpdate(
    {
      _id: conversationId,
      user: userId,
      messages: {
        $elemMatch: {
          clientMessageId,
          role: 'user',
          status: 'processing',
        },
      },
      $nor: [{
        messages: {
          $elemMatch: { clientMessageId, role: 'assistant' },
        },
      }],
    },
    [{
      $set: {
        messages: {
          $concatArrays: [
            {
              $map: {
                input: '$messages',
                as: 'message',
                in: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$$message.clientMessageId', { $literal: clientMessageId }] },
                        { $eq: ['$$message.role', 'user'] },
                      ],
                    },
                    { $mergeObjects: ['$$message', { status: 'complete' }] },
                    '$$message',
                  ],
                },
              },
            },
            [{
              $literal: {
                role: 'assistant',
                content: assistantContent,
                clientMessageId,
                status: 'complete',
                responseData: response,
                createdAt: completionTime,
              },
            }],
          ],
        },
        lastMessage: { $literal: assistantContent || message },
        messageCount: { $add: [{ $ifNull: ['$messageCount', 0] }, 1] },
      },
    }],
    {
      new: true,
    }
  );

  if (!completedConversation) {
    const latest = await StylistConversation.findOne({
      _id: conversationId,
      user: userId,
    });
    assistantMessage = latest?.messages.find(
      (entry) => entry.clientMessageId === clientMessageId && entry.role === 'assistant'
    );
    if (assistantMessage) {
      return res.json({
        success: true,
        data: {
          conversation: serializeConversation(latest),
          response: assistantMessage.responseData,
        },
      });
    }
    return next(new AppError('The stylist response could not be saved. Please retry this message.', 503));
  }

  res.json({
    success: true,
    data: {
      conversation: serializeConversation(completedConversation),
      response,
    },
  });
});
