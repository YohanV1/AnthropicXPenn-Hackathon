# 📁 File Summary - Complete Backend

This document explains what each file does and how they work together.

## 🎯 Core Server Files

### `server.js`
**Purpose:** Main entry point for the application
- Sets up Express server
- Configures middleware (CORS, body parsing, file uploads)
- Registers all API routes
- Handles errors globally
- Starts the HTTP server on specified port

**Key Features:**
- Health check endpoint at `/health`
- 404 handler for invalid routes
- Development-friendly error messages
- Startup banner with configuration info

---

### `package.json`
**Purpose:** Project configuration and dependencies
- Lists all npm packages required
- Defines npm scripts (start, dev, migrate)
- Sets project metadata
- Uses ES modules (`"type": "module"`)

**Important Scripts:**
- `npm start` - Production server
- `npm run dev` - Development with nodemon
- `npm run db:migrate` - Run database migrations

---

## 🗄️ Database Files

### `config/database.js`
**Purpose:** PostgreSQL connection management
- Creates connection pool (max 20 connections)
- Exports query helper function
- Provides transaction support
- Handles connection errors
- Logs query performance

**Usage:**
```javascript
import { query } from './config/database.js';
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
```

---

### `database/migrate.js`
**Purpose:** Database schema creation
- Creates all tables (users, invoices, invoice_items, chat_history)
- Sets up indexes for performance
- Creates triggers for auto-updating timestamps
- Can be run multiple times safely (IF NOT EXISTS)

**Run with:**
```bash
npm run db:migrate
```

---

## 🔐 Authentication

### `middleware/auth.js`
**Purpose:** JWT authentication middleware
- Verifies JWT tokens from Authorization header
- Generates new tokens (7-day expiry)
- Injects user info into request object
- Returns 401/403 for invalid tokens

**Usage in routes:**
```javascript
router.use(authenticateToken);  // Protect all routes below
```

---

## 🛣️ API Routes

### `routes/auth.js`
**Purpose:** User authentication endpoints

**Endpoints:**
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login existing user
- `POST /api/auth/demo-login` - Create demo user for testing

**Features:**
- Password hashing with bcrypt
- JWT token generation
- Input validation
- Duplicate email checking

---

### `routes/invoices.js`
**Purpose:** Invoice CRUD operations

**Endpoints:**
- `POST /api/invoices/upload` - Upload & process invoice
- `GET /api/invoices` - List all invoices (with filters)
- `GET /api/invoices/:id` - Get single invoice
- `PUT /api/invoices/:id` - Update invoice metadata
- `DELETE /api/invoices/:id` - Delete invoice

**Features:**
- File upload to S3
- AI-powered OCR extraction
- Auto-categorization
- Line item storage
- Presigned URL generation

**Example Upload:**
```bash
curl -X POST http://localhost:3000/api/invoices/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "invoice=@invoice.pdf"
```

---

### `routes/chat.js`
**Purpose:** AI chat interface

**Endpoints:**
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history` - Get conversation history
- `DELETE /api/chat/history` - Clear history

**Features:**
- Context-aware responses using invoice data
- Conversation history tracking
- Natural language understanding
- Claude API integration

**Example:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message":"How much did I spend on taxes?"}'
```

---

### `routes/analytics.js`
**Purpose:** Financial insights and reports

**Endpoints:**
- `GET /api/analytics/summary` - Overall statistics
- `GET /api/analytics/by-category` - Category breakdown
- `GET /api/analytics/by-vendor` - Vendor breakdown
- `GET /api/analytics/monthly-trend` - Spending over time
- `GET /api/analytics/tax-report` - Detailed tax report
- `GET /api/analytics/top-expenses` - Highest invoices

**Features:**
- Date range filtering
- Aggregation queries
- Quarterly and annual reports
- Top N queries

---

## 🤖 AI Services

### `services/claude.js`
**Purpose:** Anthropic Claude API integration

**Functions:**

1. **`extractInvoiceData(fileBuffer, fileType)`**
   - Uses Claude Vision to extract invoice data
   - Supports images (JPG, PNG, WebP, GIF) and PDFs
   - Returns structured JSON with vendor, amounts, line items
   - Handles base64 encoding

2. **`generateChatResponse(userMessage, invoiceContext, chatHistory)`**
   - Generates AI responses to user queries
   - Uses invoice data as context
   - Maintains conversation history
   - Returns natural language answers

3. **`categorizeInvoice(vendorName, items)`**
   - Auto-categorizes invoices
   - Uses vendor name and line items
   - Returns category string

**Key Features:**
- Claude Sonnet 4.5 model
- Structured output parsing
- Error handling
- Retry logic ready

---

## ☁️ Cloud Services

### `services/s3.js`
**Purpose:** AWS S3 file storage

**Functions:**

1. **`uploadFile(fileBuffer, fileName, fileType, userId)`**
   - Uploads files to S3
   - Generates unique filenames with UUID
   - Organizes by user ID
   - Stores metadata

2. **`getPresignedUrl(key, expiresIn)`**
   - Generates temporary download URLs
   - Default 1-hour expiry
   - Secure file access

3. **`deleteFile(key)`**
   - Removes files from S3
   - Used when deleting invoices

**S3 Structure:**
```
bucket-name/
├── user-id-1/
│   ├── uuid-1.pdf
│   └── uuid-2.jpg
└── user-id-2/
    └── uuid-3.png
```

---

## 🐳 Docker Files

### `Dockerfile`
**Purpose:** Container image definition
- Based on Node.js 18 Alpine (lightweight)
- Installs production dependencies only
- Sets up health checks
- Exposes port 3000

**Build:**
```bash
docker build -t invoice-insights .
```

---

### `docker-compose.yml`
**Purpose:** Multi-container orchestration
- Runs PostgreSQL database
- Runs Node.js API
- Connects services
- Manages volumes for data persistence

**Usage:**
```bash
docker-compose up -d    # Start
docker-compose logs -f  # View logs
docker-compose down     # Stop
```

---

## 📝 Configuration Files

### `.env.example`
**Purpose:** Environment variable template
- Documents all required variables
- Provides example values
- Copy to `.env` and customize

**Required Variables:**
- Database credentials
- Anthropic API key
- AWS credentials
- JWT secret

---

### `.gitignore`
**Purpose:** Git exclusion rules
- Ignores `node_modules/`
- Ignores `.env` file (security)
- Ignores logs and temp files
- Ignores IDE files

---

## 🛠️ Utility Scripts

### `setup.sh`
**Purpose:** Automated setup script
- Checks prerequisites (Node.js, PostgreSQL)
- Installs dependencies
- Creates `.env` from template
- Creates database
- Runs migrations

**Usage:**
```bash
chmod +x setup.sh
./setup.sh
```

---

### `test-api.sh`
**Purpose:** API testing script
- Tests all major endpoints
- Validates responses
- Checks authentication
- Provides test token

**Usage:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📚 Documentation Files

### `README.md`
**Purpose:** Main project documentation
- Complete feature overview
- Installation instructions
- API endpoint documentation
- Deployment guides
- Troubleshooting tips

---

### `QUICKSTART.md`
**Purpose:** Step-by-step setup guide
- Beginner-friendly instructions
- Prerequisites checklist
- Common issues and solutions
- Success verification

---

### `PROJECT_STRUCTURE.md`
**Purpose:** Architecture documentation
- System architecture diagrams
- Data flow explanations
- Database schema
- Component relationships

---

### `FILE_SUMMARY.md` (this file)
**Purpose:** File-by-file explanations
- What each file does
- How files work together
- Usage examples
- Key features

---

## 🧪 Testing Files

### `Invoice-Insights-API.postman_collection.json`
**Purpose:** Postman API collection
- Pre-configured requests for all endpoints
- Environment variables setup
- Request examples with sample data
- Import into Postman for testing

**Usage:**
1. Open Postman
2. Import collection
3. Set `baseUrl` and `token` variables
4. Test endpoints

---

## 📊 File Dependency Graph

```
server.js
├── config/database.js
├── middleware/auth.js
├── routes/
│   ├── auth.js
│   │   ├── config/database.js
│   │   └── middleware/auth.js
│   ├── invoices.js
│   │   ├── config/database.js
│   │   ├── middleware/auth.js
│   │   ├── services/s3.js
│   │   └── services/claude.js
│   ├── chat.js
│   │   ├── config/database.js
│   │   ├── middleware/auth.js
│   │   └── services/claude.js
│   └── analytics.js
│       ├── config/database.js
│       └── middleware/auth.js
└── .env
```

---

## 🎯 Request Flow Example

**Invoice Upload Flow:**

1. User sends POST to `/api/invoices/upload`
2. `server.js` receives request
3. `authenticateToken` middleware verifies JWT
4. Request routed to `routes/invoices.js`
5. File uploaded to S3 via `services/s3.js`
6. Invoice data extracted via `services/claude.js`
7. Data stored in PostgreSQL via `config/database.js`
8. Response sent to user

---

## 📦 NPM Package Purposes

**Core:**
- `express` - Web framework
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

**Database:**
- `pg` - PostgreSQL driver

**AI/ML:**
- `@anthropic-ai/sdk` - Claude API client

**Storage:**
- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/s3-request-presigner` - Presigned URLs

**Auth:**
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing

**File Handling:**
- `express-fileupload` - File uploads
- `sharp` - Image processing

**Utilities:**
- `uuid` - Unique IDs
- `nodemon` - Auto-reload (dev)

---

## 🔄 Data Flow Summary

```
Frontend
   ↓
Express Routes (auth check)
   ↓
Service Layer (S3, Claude)
   ↓
Database Layer (PostgreSQL)
   ↓
Response to Frontend
```

---

## 📈 Scalability Considerations

Each file is designed for:
- **Modularity** - Easy to modify individual components
- **Testability** - Functions can be tested in isolation
- **Scalability** - Ready for horizontal scaling
- **Maintainability** - Clear separation of concerns

---

## 🎉 Summary

You have a complete, production-ready backend with:
- ✅ 18 total files
- ✅ Full authentication system
- ✅ AI-powered OCR
- ✅ Cloud file storage
- ✅ Comprehensive API
- ✅ Database migrations
- ✅ Docker support
- ✅ Complete documentation
- ✅ Testing tools

Everything is organized, documented, and ready to run!
