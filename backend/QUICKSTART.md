# 🚀 Quick Start Guide

Get your Invoice Insights backend running in 5 minutes!

## ⚡ TL;DR

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 3. Create database
createdb invoice_insights

# 4. Run migrations
npm run db:migrate

# 5. Start server
npm run dev
```

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed (`psql --version`)
- [ ] Anthropic API key ([Get one here](https://console.anthropic.com/))
- [ ] AWS account with S3 access ([Setup guide](https://aws.amazon.com/s3/))
- [ ] Git installed (optional)

## 🎯 Step-by-Step Setup

### Step 1: Get the Code

```bash
# If you have the code
cd invoice-insights-backend

# Or clone from repo
git clone <your-repo-url>
cd invoice-insights-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Express.js - Web framework
- Anthropic SDK - AI capabilities
- AWS SDK - File storage
- PostgreSQL driver - Database
- JWT - Authentication
- And more...

### Step 3: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Open in your editor
nano .env  # or use your favorite editor
```

**Required Configuration:**

```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=invoice_insights
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# AWS S3 Storage
AWS_ACCESS_KEY_ID=AKIAXXXXX
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=invoice-insights-bucket

# JWT Secret (any random string)
JWT_SECRET=change_this_to_random_string_in_production

# Server Config
PORT=3000
FRONTEND_URL=http://localhost:8080
```

### Step 4: Set Up Database

**Option A: Using psql**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE invoice_insights;

# Exit
\q
```

**Option B: Using createdb command**
```bash
createdb -U postgres invoice_insights
```

**Run Migrations:**
```bash
npm run db:migrate
```

You should see:
```
✅ Created users table
✅ Created invoices table
✅ Created invoice_items table
✅ Created chat_history table
✅ Created indexes
✅ Created triggers
🎉 Database migration completed successfully!
```

### Step 5: Set Up AWS S3

1. **Create S3 Bucket:**
   - Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
   - Click "Create bucket"
   - Enter bucket name (e.g., `invoice-insights-yourusername`)
   - Select region
   - Keep default settings
   - Create bucket

2. **Configure CORS:**
   - Select your bucket
   - Go to "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Add this configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:8080", "http://localhost:3000"],
       "ExposeHeaders": []
     }
   ]
   ```

3. **Create IAM User:**
   - Go to [IAM Console](https://console.aws.amazon.com/iam/)
   - Create new user with programmatic access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Save Access Key ID and Secret Access Key
   - Add to `.env` file

### Step 6: Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. Add to `.env` file

### Step 7: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
🚀 Invoice Insights API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:3000
🌍 Environment: development
📊 Health check: http://localhost:3000/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 8: Test the API

**Quick test:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-14T...",
  "service": "Invoice Insights API"
}
```

**Run full test suite:**
```bash
chmod +x test-api.sh
./test-api.sh
```

## 🎉 You're Ready!

Your backend is now running! Here's what you can do:

### Test with cURL

**1. Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
```

**2. Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**3. Upload an invoice:**
```bash
curl -X POST http://localhost:3000/api/invoices/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "invoice=@/path/to/invoice.pdf"
```

**4. Chat with AI:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"message":"How much did I spend this month?"}'
```

### Test with Postman

1. Import `Invoice-Insights-API.postman_collection.json`
2. Set environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (get from login request)
3. Test all endpoints

### Connect Frontend

Update your frontend to use:
```javascript
const API_URL = 'http://localhost:3000';
```

## 🐳 Using Docker (Alternative)

If you prefer Docker:

```bash
# Start everything (PostgreSQL + API)
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

The database will be automatically created and migrated.

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Check credentials in .env
# Make sure DB_HOST, DB_USER, DB_PASSWORD are correct

# Try connecting manually
psql -U postgres -d invoice_insights
```

### Anthropic API Errors
- Check API key is correct and active
- Verify you have credits: [console.anthropic.com](https://console.anthropic.com/)
- Check rate limits

### AWS S3 Errors
- Verify bucket exists and region is correct
- Check IAM user has S3 permissions
- Verify access keys are correct
- Check CORS configuration

### Migration Fails
```bash
# Drop and recreate database
dropdb invoice_insights
createdb invoice_insights
npm run db:migrate
```

## 📚 Next Steps

1. **Read the docs:** Check `README.md` for full API documentation
2. **Explore structure:** See `PROJECT_STRUCTURE.md` for architecture
3. **Connect frontend:** Update your frontend to use this backend
4. **Deploy:** See deployment section in README.md

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Run `./test-api.sh` to diagnose issues
- Review logs in the console
- Check environment variables in `.env`

## 🎊 Success Checklist

- [ ] Server starts without errors
- [ ] Health check returns 200 OK
- [ ] Can register a new user
- [ ] Can login and get JWT token
- [ ] Can access protected endpoints with token
- [ ] Database queries work
- [ ] Claude API responds
- [ ] S3 uploads work (when uploading files)

Once all boxes are checked, you're good to go! 🚀
