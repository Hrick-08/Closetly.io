/**
 * Microservice Controller
 * Proxies requests to the FastAPI microservice for classify, search, and chat
 */
const axios = require('axios');
const FormData = require('form-data');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const config = require('../config');

// Create axios instance for microservice
const microserviceClient = axios.create({
  baseURL: config.microserviceUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
microserviceClient.interceptors.request.use(
  (request) => {
    console.log(`[Microservice] ${request.method.toUpperCase()} ${request.url}`);
    return request;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
microserviceClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[Microservice Error]', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Microservice Error] No response:', error.message);
    } else {
      console.error('[Microservice Error]', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Handle microservice errors
 */
const handleMicroserviceError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 503) {
      return new AppError(data.detail || 'Microservice is temporarily unavailable', 503);
    }
    if (status === 400) {
      return new AppError(data.detail || 'Invalid request to microservice', 400);
    }
    if (status === 422) {
      return new AppError('Validation error in microservice', 422);
    }
    
    return new AppError(data.detail || `Microservice error: ${status}`, status);
  }
  
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new AppError('Cannot connect to microservice. Please check if it\'s running.', 503);
  }
  
  if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
    return new AppError('Microservice request timed out', 504);
  }
  
  return new AppError('Microservice communication error', 500);
};

/**
 * @route POST /api/microservice/search
 * @description Search for clothing products (text query)
 * @access Private
 */
exports.searchProducts = catchAsync(async (req, res, next) => {
  const { query, numResults = 10 } = req.body;
  
  if (!query) {
    return next(new AppError('Search query is required', 400));
  }
  
  try {
    const response = await microserviceClient.post('/search', {
      query,
      num_results: numResults,
    });
    
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    return next(handleMicroserviceError(error));
  }
});

/**
 * @route POST /api/microservice/search/image
 * @description Search for clothing products by image
 * @access Private
 */
exports.searchByImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Image file is required', 400));
  }
  
  const { numResults = 10 } = req.body;
  
  try {
    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('num_results', numResults);
    
    const response = await microserviceClient.post('/search', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    return next(handleMicroserviceError(error));
  }
});

/**
 * @route POST /api/microservice/classify
 * @description Classify a clothing image
 * @access Private
 */
exports.classifyImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Image file is required', 400));
  }
  
  try {
    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    
    const response = await microserviceClient.post('/classify', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    return next(handleMicroserviceError(error));
  }
});

/**
 * @route POST /api/microservice/chat
 * @description Chat with the AI assistant
 * @access Private
 */
exports.chat = catchAsync(async (req, res, next) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return next(new AppError('Message is required', 400));
  }

  try {
    const response = await exports.generateChatResponse(message, history, req.user);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    return next(error);
  }
});

exports.generateChatResponse = async (message, history, user) => {
  try {
    const response = await microserviceClient.post('/chat', {
      message,
      history: Array.isArray(history) ? history.slice(-20) : [],
      preferences: user.preferences || {},
    }, {
      headers: {
        'X-Closetly-User-Id': user._id.toString(),
      },
    });

    return response.data;
  } catch (error) {
    throw handleMicroserviceError(error);
  }
};

/**
 * @route GET /api/microservice/health
 * @description Check microservice health
 * @access Private
 */
exports.healthCheck = catchAsync(async (req, res, next) => {
  try {
    const response = await microserviceClient.get('/health');
    
    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    return next(handleMicroserviceError(error));
  }
});