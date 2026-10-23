# Closetly Backend API

Express.js backend with MongoDB for the Closetly application.

## Features

- **Authentication**: JWT-based auth with access/refresh tokens, password hashing (bcrypt)
- **Wardrobe Management**: Full CRUD for clothing items with categories, tags, images
- **Microservice Proxy**: Proxies requests to FastAPI microservice for AI classification/search
- **File Upload**: Multer-based image upload with base64 storage
- **Rate Limiting**: Express-rate-limit for API protection
- **Validation**: Express-validator for request validation
- **Error Handling**: Centralized error handling with custom error classes

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB with Mongoose 8+
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
backend/
├── src/
│   ├── app.js              # Express app entry point
│   ├── config/
│   │   ├── index.js        # Environment configuration
│   │   └── db.js           # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── wardrobeController.js
│   │   └── microserviceController.js
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   ├── validation.js   # Request validation
│   │   ├── errorHandler.js # Global error handling
│   │   └── upload.js       # File upload handling
│   ├── models/
│   │   ├── User.js
│   │   ├── WardrobeItem.js
│   │   └── index.js
│   └── routes/
│       ├── auth.js
│       ├── wardrobe.js
│       └── microservice.js
├── .env                    # Environment variables (create from .env.example)
├── .env.example           # Template for environment variables
└── package.json
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secure random string (64+ chars)
- `JWT_REFRESH_SECRET` - Secure random string (64+ chars)
- `CORS_ORIGIN` - Frontend URL (e.g., `http://localhost:3000`)
- `MICROSERVICE_URL` - FastAPI microservice URL (e.g., `http://localhost:8000`)

### 3. Generate Secure Secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login user |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout user |
| GET | `/me` | Get current user |
| PUT | `/me` | Update profile |
| PUT | `/change-password` | Change password |
| DELETE | `/me` | Delete account |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password |

### Wardrobe (`/api/wardrobe`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Get user's categories with counts |
| GET | `/items/stats` | Get wardrobe statistics |
| GET | `/items` | List items (with filters) |
| GET | `/items/:id` | Get single item |
| POST | `/items` | Create item (JSON) |
| POST | `/items/upload` | Create item with image upload |
| PUT | `/items/:id` | Update item |
| PUT | `/items/:id/upload` | Update item image |
| DELETE | `/items/:id` | Delete item |
| POST | `/items/:id/wear` | Increment wear count |

### Microservice Proxy (`/api/microservice`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/search` | Search products (text) |
| POST | `/search/image` | Search products (image) |
| POST | `/classify` | Classify clothing image |
| POST | `/chat` | Chat with AI assistant |
| GET | `/health` | Check microservice health |

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  avatarUrl: String,
  isEmailVerified: Boolean,
  refreshTokens: [{ token: String, createdAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

### WardrobeItem
```javascript
{
  user: ObjectId (ref: User),
  name: String,
  category: String (enum: 8 categories),
  imageBase64: String,
  imageMetadata: { originalName, mimeType, size },
  tags: [String],
  color: { primary, secondary },
  brand: String,
  season: String (enum: Spring, Summer, Fall, Winter, All Season),
  wearCount: Number,
  lastWorn: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Valid Categories

1. Tops
2. Bottoms
3. Outerwear
4. Dresses/Jumpsuits
5. Footwear
6. Accessories
7. Ethnic/Traditional Wear
8. Activewear

## Authentication Flow

1. **Signup/Login** → Returns access token + refresh token (in cookies & body)
2. **Access Token** → Short-lived (7 days), sent in Authorization header
3. **Refresh Token** → Long-lived (30 days), stored in httpOnly cookie
4. **Token Refresh** → POST `/auth/refresh` with refresh token
5. **Logout** → Invalidates refresh token, clears cookies

## Image Handling

Images are converted to base64 data URLs and stored in MongoDB:
- Max file size: 5MB (configurable)
- Allowed types: JPEG, PNG, WebP
- Automatic downscaling to 800px max dimension

## Development

### Run with Auto-reload
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Production Build
```bash
npm start
```

## Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure MongoDB Atlas with IP whitelist
4. Set up reverse proxy (nginx) with SSL
5. Configure CORS for production domain
6. Use PM2 or similar process manager

## MongoDB Atlas Setup

1. Create cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for all)
4. Get connection string
5. Add to `.env` as `MONGODB_URI`

## FastAPI Microservice

The backend proxies these endpoints to the FastAPI microservice:
- `POST /classify` - Image classification
- `POST /search` - Product search (text & image)
- `POST /chat` - AI assistant

Make sure the microservice is running at `MICROSERVICE_URL`.

## License

MIT