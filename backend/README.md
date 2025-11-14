# Invoice Insights Backend

AI-powered invoice processing backend with OCR, natural language querying, and financial analytics.

## 🚀 Features

- **AI-Powered OCR**: Extract invoice data using Claude Vision API
- **Smart Categorization**: Automatic invoice categorization
- **Natural Language Queries**: Ask questions about your invoices in plain English
- **Financial Analytics**: Spending reports, tax summaries, and trends
- **Secure Storage**: AWS S3 integration for file storage
- **RESTful API**: Clean, documented API endpoints
- **PostgreSQL Database**: Reliable data storage with relationships

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **AI/ML**: Anthropic Claude API
- **Storage**: AWS S3
- **Authentication**: JWT
- **ORM**: Raw SQL with pg driver

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- AWS Account (for S3)
- Anthropic API Key

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd invoice-insights-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=invoice_insights
DB_USER=postgres
DB_PASSWORD=your_password

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# JWT Secret
JWT_SECRET=your_super_secret_key

# Server
PORT=3000
FRONTEND_URL=http://localhost:8080
```

### 4. Set up PostgreSQL

Create a database:

```bash
psql -U postgres
CREATE DATABASE invoice_insights;
\q
```

Run migrations:

```bash
npm run db:migrate
```

### 5. Set up AWS S3

1. Go to AWS S3 Console
2. Create a new bucket (e.g., `invoice-insights-bucket`)
3. Set appropriate CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:8080"],
    "ExposeHeaders": []
  }
]
```

4. Create IAM user with S3 permissions
5. Add credentials to `.env`

### 6. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key
4. Add to `.env` file

## 🏃 Running the Server

### Development mode (with auto-reload)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "fullName": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Demo Login (Quick Testing)
```http
POST /api/auth/demo-login
```

### Invoice Endpoints

All invoice endpoints require authentication header:
```
Authorization: Bearer <your_jwt_token>
```

#### Upload Invoice
```http
POST /api/invoices/upload
Content-Type: multipart/form-data

invoice: <file>
```

#### Get All Invoices
```http
GET /api/invoices?startDate=2024-01-01&endDate=2024-12-31&category=Software
```

#### Get Single Invoice
```http
GET /api/invoices/:id
```

#### Update Invoice
```http
PUT /api/invoices/:id
Content-Type: application/json

{
  "category": "Software",
  "status": "paid",
  "notes": "Subscription renewed"
}
```

#### Delete Invoice
```http
DELETE /api/invoices/:id
```

### Chat Endpoints

#### Send Message
```http
POST /api/chat
Content-Type: application/json

{
  "message": "How much did I spend on taxes this month?"
}
```

#### Get Chat History
```http
GET /api/chat/history?limit=50
```

#### Clear Chat History
```http
DELETE /api/chat/history
```

### Analytics Endpoints

#### Get Summary
```http
GET /api/analytics/summary?startDate=2024-01-01&endDate=2024-12-31
```

#### Get Category Breakdown
```http
GET /api/analytics/by-category
```

#### Get Vendor Breakdown
```http
GET /api/analytics/by-vendor?limit=10
```

#### Get Monthly Trend
```http
GET /api/analytics/monthly-trend?months=12
```

#### Get Tax Report
```http
GET /api/analytics/tax-report?year=2024&quarter=4
```

#### Get Top Expenses
```http
GET /api/analytics/top-expenses?limit=10
```

## 🧪 Testing

### Using cURL

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","fullName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Upload invoice (save token from login)
curl -X POST http://localhost:3000/api/invoices/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "invoice=@/path/to/invoice.pdf"

# Chat with AI
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"How much did I spend this month?"}'
```

### Using Postman

1. Import the endpoints into Postman
2. Set environment variable for `baseUrl`: `http://localhost:3000`
3. Set environment variable for `token` after login
4. Test endpoints

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- All sensitive routes require authentication
- SQL injection prevention through parameterized queries
- File upload size limits (50MB)
- CORS configured for frontend origin

## 📊 Database Schema

### Users
- id (UUID, Primary Key)
- email (Unique)
- password_hash
- full_name
- created_at, updated_at

### Invoices
- id (UUID, Primary Key)
- user_id (Foreign Key)
- vendor_name
- invoice_number
- invoice_date
- total_amount
- tax_amount
- category
- file_url
- s3_key
- metadata (JSONB)

### Invoice Items
- id (UUID, Primary Key)
- invoice_id (Foreign Key)
- description
- quantity
- unit_price
- total_price

### Chat History
- id (UUID, Primary Key)
- user_id (Foreign Key)
- role (user/assistant)
- content
- created_at

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U postgres -d invoice_insights
```

### AWS S3 Issues
- Verify IAM user has `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` permissions
- Check bucket name and region in `.env`
- Verify CORS configuration

### Claude API Issues
- Check API key is valid
- Verify you have credits available
- Check rate limits

## 📈 Performance

- Database queries use indexes for optimization
- Connection pooling for database
- File uploads streamed to S3
- Async/await throughout for non-blocking operations

## 🚢 Deployment

### Heroku
```bash
heroku create invoice-insights-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set ANTHROPIC_API_KEY=your_key
heroku config:set AWS_ACCESS_KEY_ID=your_key
# ... set other env vars
git push heroku main
```

### Railway
1. Connect GitHub repo
2. Add PostgreSQL plugin
3. Set environment variables
4. Deploy

### Render
1. Create new Web Service
2. Connect repository
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.

## 🎉 Acknowledgments

- Inspired by InvoiceGPT
- Built with Claude AI
- Uses Anthropic's Claude API for OCR and chat
