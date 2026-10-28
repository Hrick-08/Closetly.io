const config = require('./index');

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Closetly Backend API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'API for authentication, wardrobe management, AI search, and stylist conversations.',
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Local development',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Authentication' },
    { name: 'Wardrobe' },
    { name: 'Microservice' },
    { name: 'Stylist' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: { type: 'array', items: { type: 'object' } },
        },
      },
      AuthCredentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', format: 'password', example: 'Password1' },
        },
      },
      WardrobeItem: {
        type: 'object',
        required: ['name', 'category'],
        properties: {
          name: { type: 'string', maxLength: 100, example: 'Blue denim jacket' },
          category: {
            type: 'string',
            enum: ['Tops', 'Bottoms', 'Outerwear', 'Dresses/Jumpsuits', 'Footwear', 'Accessories', 'Ethnic/Traditional Wear', 'Activewear'],
            example: 'Outerwear',
          },
          tags: { type: 'array', items: { type: 'string' }, example: ['casual', 'denim'] },
          color: {
            type: 'object',
            properties: {
              primary: { type: 'string', example: 'Blue' },
              secondary: { type: 'string', example: 'White' },
            },
          },
          brand: { type: 'string', example: 'Closetly' },
          season: { type: 'string', enum: ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'] },
          notes: { type: 'string', maxLength: 500 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API health',
        responses: { 200: { description: 'API is running' } },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a user',
        requestBody: { required: true, content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/AuthCredentials' }, { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Alex' }, phone: { type: 'string' } } }] } } } },
        responses: { 201: { description: 'User registered' }, 400: { $ref: '#/components/responses/Error' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthCredentials' } } } },
        responses: { 200: { description: 'Logged in' }, 401: { $ref: '#/components/responses/Error' } },
      },
    },
    '/api/auth/refresh': { post: { tags: ['Authentication'], summary: 'Refresh access token', responses: { 200: { description: 'Token refreshed' } } } },
    '/api/auth/logout': { post: { tags: ['Authentication'], security: [{ bearerAuth: [] }], summary: 'Log out', responses: { 200: { description: 'Logged out' } } } },
    '/api/auth/forgot-password': { post: { tags: ['Authentication'], summary: 'Request password reset', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } }, responses: { 200: { description: 'Reset request accepted' } } } },
    '/api/auth/reset-password': { post: { tags: ['Authentication'], summary: 'Reset password', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', format: 'password' } } } } } }, responses: { 200: { description: 'Password reset' } } } },
    '/api/auth/me': {
      get: { tags: ['Authentication'], security: [{ bearerAuth: [] }], summary: 'Get current user', responses: { 200: { description: 'Current user' } } },
      put: { tags: ['Authentication'], security: [{ bearerAuth: [] }], summary: 'Update profile', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, avatarUrl: { type: 'string', format: 'uri' } } } } } }, responses: { 200: { description: 'Profile updated' } } },
      delete: { tags: ['Authentication'], security: [{ bearerAuth: [] }], summary: 'Delete account', responses: { 200: { description: 'Account deleted' } } },
    },
    '/api/auth/change-password': { put: { tags: ['Authentication'], security: [{ bearerAuth: [] }], summary: 'Change password', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string', format: 'password' }, newPassword: { type: 'string', format: 'password' } } } } } }, responses: { 200: { description: 'Password changed' } } } },
    '/api/wardrobe/categories': { get: { tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'List categories', responses: { 200: { description: 'Category counts' } } } },
    '/api/wardrobe/items': {
      get: {
        tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'List wardrobe items',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200 } }, { name: 'skip', in: 'query', schema: { type: 'integer', minimum: 0 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'name', 'category', 'wearCount'] } }, { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { 200: { description: 'Wardrobe items' } },
      },
      post: {
        tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'Create a wardrobe item',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WardrobeItem' } } } },
        responses: { 201: { description: 'Item created' } },
      },
    },
    '/api/wardrobe/items/stats': { get: { tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'Get wardrobe statistics', responses: { 200: { description: 'Statistics' } } } },
    '/api/wardrobe/items/upload': {
      post: {
        tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'Create an item with an image',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' }, name: { type: 'string' }, category: { type: 'string' } } } } } },
        responses: { 201: { description: 'Item created' } },
      },
    },
    '/api/wardrobe/items/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: { tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'Get an item', responses: { 200: { description: 'Wardrobe item' } } },
      put: { tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'Update an item', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/WardrobeItem' } } } }, responses: { 200: { description: 'Item updated' } } },
      delete: { tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'Delete an item', responses: { 200: { description: 'Item deleted' } } },
    },
    '/api/wardrobe/items/{id}/upload': { put: { tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'Update an item image', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' } } } } } }, responses: { 200: { description: 'Image updated' } } } },
    '/api/wardrobe/items/{id}/wear': { post: { tags: ['Wardrobe'], security: [{ bearerAuth: [] }], summary: 'Increment wear count', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Wear count incremented' } } } },
    '/api/microservice/search': { post: { tags: ['Microservice'], security: [{ bearerAuth: [] }], summary: 'Search products', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { query: { type: 'string' }, numResults: { type: 'integer', minimum: 1, maximum: 50 } } } } } }, responses: { 200: { description: 'Search results' } } } },
    '/api/microservice/search/image': { post: { tags: ['Microservice'], security: [{ bearerAuth: [] }], summary: 'Search products by image', requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' } } } } } }, responses: { 200: { description: 'Search results' } } } },
    '/api/microservice/classify': { post: { tags: ['Microservice'], security: [{ bearerAuth: [] }], summary: 'Classify an image', requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' } } } } } }, responses: { 200: { description: 'Classification result' } } } },
    '/api/microservice/chat': { post: { tags: ['Microservice'], security: [{ bearerAuth: [] }], summary: 'Chat with the AI assistant', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['message'], properties: { message: { type: 'string', maxLength: 1000 }, history: { type: 'array', items: { type: 'object' } } } } } } }, responses: { 200: { description: 'Assistant response' } } } },
    '/api/stylist/conversations': {
      get: { tags: ['Stylist'], security: [{ bearerAuth: [] }], summary: 'List conversations', parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }, { name: 'skip', in: 'query', schema: { type: 'integer' } }], responses: { 200: { description: 'Conversations' } } },
      post: { tags: ['Stylist'], security: [{ bearerAuth: [] }], summary: 'Create a conversation', responses: { 201: { description: 'Conversation created' } } },
    },
    '/api/stylist/conversations/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: { tags: ['Stylist'], security: [{ bearerAuth: [] }], summary: 'Get a conversation', responses: { 200: { description: 'Conversation' } } },
      delete: { tags: ['Stylist'], security: [{ bearerAuth: [] }], summary: 'Delete a conversation', responses: { 200: { description: 'Conversation deleted' } } },
    },
    '/api/stylist/conversations/{id}/messages': { post: { tags: ['Stylist'], security: [{ bearerAuth: [] }], summary: 'Send a conversation message', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['message'], properties: { message: { type: 'string', maxLength: 1000 }, clientMessageId: { type: 'string', format: 'uuid' } } } } } }, responses: { 200: { description: 'Message and assistant reply' } } } },
  },
};

openapi.components.responses = {
  Error: {
    description: 'Request failed',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  },
};

module.exports = openapi;
