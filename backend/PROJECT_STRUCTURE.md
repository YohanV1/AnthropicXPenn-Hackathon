# Invoice Insights Backend - Project Structure

## 📁 Directory Structure

```
invoice-insights-backend/
├── config/
│   └── database.js          # PostgreSQL connection pool and query helpers
├── database/
│   └── migrate.js           # Database schema creation script
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication endpoints (register, login)
│   ├── invoices.js          # Invoice CRUD operations
│   ├── chat.js              # AI chat endpoints
│   └── analytics.js         # Analytics and reporting endpoints
├── services/
│   ├── claude.js            # Anthropic Claude API integration
│   └── s3.js                # AWS S3 file storage service
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Docker setup with PostgreSQL
├── Dockerfile               # Container configuration
├── package.json             # Dependencies and scripts
├── README.md                # Main documentation
├── server.js                # Express server entry point
└── setup.sh                 # Quick setup script
```

## 🏗️ Architecture

### Layer Structure

```
┌─────────────────────────────────────────┐
│         Client (Frontend)               │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────┐
│         API Routes (Express)            │
│  ┌────────────────────────────────────┐ │
│  │ auth.js  invoices.js  chat.js      │ │
│  └────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Middleware Layer                │
│  ┌────────────────────────────────────┐ │
│  │ Authentication  Validation  CORS   │ │
│  └────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Service Layer                   │
│  ┌────────────────────────────────────┐ │
│  │ Claude AI   AWS S3   Database      │ │
│  └────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    External Services & Storage          │
│  ┌────────────────────────────────────┐ │
│  │ PostgreSQL  Anthropic  AWS S3      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔄 Data Flow

### Invoice Upload Flow

```
1. User uploads invoice file
   ↓
2. Express receives multipart/form-data
   ↓
3. File uploaded to AWS S3
   ↓
4. Claude Vision API extracts data
   ↓
5. Data stored in PostgreSQL
   ↓
6. Response sent to client
```

### Chat Query Flow

```
1. User sends message
   ↓
2. System fetches user's invoice data
   ↓
3. Data sent to Claude API with context
   ↓
4. AI generates response
   ↓
5. Conversation saved to chat_history
   ↓
6. Response sent to client
```

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│   users     │────────<│   invoices   │
└─────────────┘         └──────┬───────┘
                               │
                               │ 1:N
                               │
                        ┌──────▼──────────┐
                        │ invoice_items   │
                        └─────────────────┘
                               
┌─────────────┐
│   users     │────────<│ chat_history │
└─────────────┘         └──────────────┘
```

### Table Details

**users**
- Stores user authentication data
- One user can have many invoices
- One user can have many chat messages

**invoices**
- Main invoice records
- References user via user_id
- Contains extracted metadata in JSONB
- Stores S3 file reference

**invoice_items**
- Line items from invoices
- References invoice via invoice_id
- Allows detailed spending analysis

**chat_history**
- Conversation logs
- References user via user_id
- Used for context in AI responses

## 🔌 API Endpoints

### Authentication Flow

```
POST /api/auth/register
  → Create new user
  → Returns JWT token

POST /api/auth/login
  → Authenticate user
  → Returns JWT token

JWT Token used in header:
Authorization: Bearer <token>
```

### Core Features

**Invoice Management**
- Upload: `POST /api/invoices/upload`
- List: `GET /api/invoices`
- View: `GET /api/invoices/:id`
- Update: `PUT /api/invoices/:id`
- Delete: `DELETE /api/invoices/:id`

**AI Chat**
- Chat: `POST /api/chat`
- History: `GET /api/chat/history`
- Clear: `DELETE /api/chat/history`

**Analytics**
- Summary: `GET /api/analytics/summary`
- By Category: `GET /api/analytics/by-category`
- By Vendor: `GET /api/analytics/by-vendor`
- Monthly Trend: `GET /api/analytics/monthly-trend`
- Tax Report: `GET /api/analytics/tax-report`
- Top Expenses: `GET /api/analytics/top-expenses`

## 🧩 Key Components

### 1. Claude Service (`services/claude.js`)

**Functions:**
- `extractInvoiceData()`: OCR on invoice images/PDFs
- `generateChatResponse()`: AI responses to user queries
- `categorizeInvoice()`: Auto-categorization

**Features:**
- Handles base64 image encoding
- Supports multiple file types
- Context-aware responses
- JSON extraction from AI responses

### 2. S3 Service (`services/s3.js`)

**Functions:**
- `uploadFile()`: Upload to S3
- `getPresignedUrl()`: Generate secure URLs
- `deleteFile()`: Remove files

**Features:**
- Unique file naming
- Metadata storage
- Presigned URLs for security
- Error handling

### 3. Database Config (`config/database.js`)

**Features:**
- Connection pooling (max 20 connections)
- Query helper with logging
- Transaction support
- Error handling

### 4. Auth Middleware (`middleware/auth.js`)

**Features:**
- JWT verification
- Token generation (7 day expiry)
- Request user injection
- 401/403 responses

## 🔐 Security Considerations

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- Tokens in Authorization header

### Database
- Parameterized queries prevent SQL injection
- Connection pooling prevents exhaustion
- Foreign key constraints ensure data integrity

### File Upload
- 50MB file size limit
- Allowed file types checked
- Files stored in user-specific S3 paths
- Presigned URLs for access

### API
- CORS configured for frontend
- Rate limiting ready to implement
- Error messages don't leak sensitive info

## 🚀 Deployment Options

### Option 1: Traditional Hosting

```bash
# On server
git clone <repo>
cd invoice-insights-backend
npm install
npm run db:migrate
npm start
```

### Option 2: Docker

```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

**Heroku**
```bash
heroku create
heroku addons:create heroku-postgresql
git push heroku main
```

**Railway**
- Connect GitHub repo
- Add PostgreSQL database
- Set environment variables
- Deploy

**Render**
- Connect repository
- Add PostgreSQL
- Configure environment
- Deploy

## 📊 Performance Tips

1. **Database Indexes**: Already created on common query fields
2. **Connection Pooling**: Max 20 connections configured
3. **File Streaming**: Large files streamed to S3
4. **Async Operations**: Non-blocking I/O throughout
5. **Query Optimization**: Joins minimize round trips

## 🔧 Configuration

### Required Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=invoice_insights
DB_USER=postgres
DB_PASSWORD=your_password

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket

# Auth
JWT_SECRET=random_secret_string

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com
```

## 🧪 Testing Strategy

### Unit Tests (Future)
- Service functions
- Utility functions
- Validation logic

### Integration Tests (Future)
- API endpoints
- Database operations
- External service mocking

### Manual Testing
```bash
# Use provided cURL commands in README
# Or import into Postman
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
- Console logs for development
- Consider Winston/Pino for production
- Error tracking with Sentry

### Metrics
- Database query timing logged
- API response times
- Error rates

## 🔄 CI/CD Ready

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run deploy
```

## 📚 Further Reading

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
