# 🎉 Invoice Insights Backend - START HERE!

Welcome! This is your complete, production-ready backend for invoice management with AI.

## 📋 What You Have

A modern Node.js backend with:
- ✅ AI-powered OCR (Claude Vision API)
- ✅ Natural language chat interface
- ✅ AWS S3 file storage
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ RESTful API
- ✅ Financial analytics
- ✅ Docker support

## 🚀 Quick Start (3 Steps)

### 1. Read This First
📖 **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide

### 2. Set Up Your Environment
```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run db:migrate
```

### 3. Start the Server
```bash
npm run dev
```

That's it! Server running on http://localhost:3000

## 📚 Documentation Map

### For Developers
- **[README.md](./README.md)** - Complete API documentation, deployment guides
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Architecture, diagrams, data flow
- **[FILE_SUMMARY.md](./FILE_SUMMARY.md)** - What each file does

### For Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - Step-by-step setup (READ THIS FIRST!)
- **[setup.sh](./setup.sh)** - Automated setup script
- **[test-api.sh](./test-api.sh)** - Test all endpoints

### For Testing
- **[Invoice-Insights-API.postman_collection.json](./Invoice-Insights-API.postman_collection.json)** - Import into Postman

## 🛠️ Tech Stack

**Backend:** Node.js + Express.js  
**Database:** PostgreSQL  
**AI/ML:** Anthropic Claude API  
**Storage:** AWS S3  
**Auth:** JWT  

## 📁 Project Structure

```
invoice-insights-backend/
├── 📝 START_HERE.md          ← You are here!
├── 📖 QUICKSTART.md           ← Start with this
├── 📚 README.md               ← Full documentation
├── 🏗️ PROJECT_STRUCTURE.md    ← Architecture guide
├── 📋 FILE_SUMMARY.md         ← File explanations
│
├── server.js                  ← Main entry point
├── package.json               ← Dependencies
│
├── config/
│   └── database.js            ← PostgreSQL setup
│
├── database/
│   └── migrate.js             ← Schema creation
│
├── middleware/
│   └── auth.js                ← JWT authentication
│
├── routes/
│   ├── auth.js                ← Register/login
│   ├── invoices.js            ← Invoice CRUD
│   ├── chat.js                ← AI chat
│   └── analytics.js           ← Reports
│
├── services/
│   ├── claude.js              ← AI integration
│   └── s3.js                  ← File storage
│
└── 🐳 Docker files
    ├── Dockerfile
    └── docker-compose.yml
```

## 🎯 What Can It Do?

### 1. Upload Invoices
Upload images or PDFs → AI extracts all data automatically

### 2. Natural Language Queries
"How much did I spend on taxes this month?" → Instant AI answer

### 3. Financial Analytics
- Spending by category
- Monthly trends
- Tax reports
- Vendor analysis

### 4. Smart Features
- Auto-categorization
- Line item extraction
- Secure file storage
- Conversation history

## 🔑 Required Credentials

Before running, you need:

1. **PostgreSQL Database**
   - Local: `brew install postgresql` or `apt-get install postgresql`
   - Cloud: Heroku, Railway, Render, Supabase

2. **Anthropic API Key**
   - Sign up: https://console.anthropic.com/
   - Get API key from dashboard
   - Free tier available!

3. **AWS Account**
   - Create S3 bucket
   - Generate IAM access keys
   - Free tier: 5GB storage

4. **JWT Secret**
   - Any random string
   - Example: `openssl rand -base64 32`

## ⚡ Quick Commands

```bash
# Install everything
npm install

# Set up database
npm run db:migrate

# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Test API
./test-api.sh

# Docker (includes PostgreSQL)
docker-compose up -d
```

## 🧪 Testing

### Quick Test
```bash
curl http://localhost:3000/health
```

### Full Test Suite
```bash
chmod +x test-api.sh
./test-api.sh
```

### With Postman
1. Import `Invoice-Insights-API.postman_collection.json`
2. Set variables: baseUrl, token
3. Test all endpoints

## 🐛 Troubleshooting

**Port in use?**
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

**Database connection failed?**
```bash
pg_isready  # Check PostgreSQL is running
```

**Need help?**
- Check [QUICKSTART.md](./QUICKSTART.md) troubleshooting section
- Review [README.md](./README.md) for detailed guides
- Check logs in terminal

## 📊 API Endpoints Preview

```
Authentication:
POST /api/auth/register
POST /api/auth/login

Invoices:
POST /api/invoices/upload
GET  /api/invoices
GET  /api/invoices/:id
PUT  /api/invoices/:id
DELETE /api/invoices/:id

Chat:
POST /api/chat
GET  /api/chat/history

Analytics:
GET /api/analytics/summary
GET /api/analytics/by-category
GET /api/analytics/by-vendor
GET /api/analytics/monthly-trend
GET /api/analytics/tax-report
```

## 🎓 Learning Path

**New to this project?**
1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Run `./setup.sh`
3. Test with `./test-api.sh`
4. Explore [README.md](./README.md) for API details

**Want to understand the code?**
1. Read [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
2. Check [FILE_SUMMARY.md](./FILE_SUMMARY.md)
3. Browse the code with comments

**Ready to deploy?**
1. See deployment section in [README.md](./README.md)
2. Choose: Heroku, Railway, Render, or Docker
3. Set environment variables
4. Deploy!

## 🚢 Deployment Options

- **Heroku** - Easy, one-click deploy
- **Railway** - Modern, GitHub integration
- **Render** - Free tier, auto-deploy
- **Docker** - Run anywhere
- **AWS/GCP** - Full control

All documented in [README.md](./README.md)!

## 💡 What's Next?

1. ✅ Follow [QUICKSTART.md](./QUICKSTART.md)
2. ✅ Get your API keys
3. ✅ Run the server
4. ✅ Test the endpoints
5. ✅ Connect your frontend
6. ✅ Deploy to production

## 🆘 Need Help?

1. Check [QUICKSTART.md](./QUICKSTART.md) troubleshooting
2. Review [README.md](./README.md) FAQ
3. Run `./test-api.sh` to diagnose
4. Check server logs

## 🎊 You're All Set!

Everything you need is here. Start with [QUICKSTART.md](./QUICKSTART.md) and you'll be running in 5 minutes!

**Happy coding! 🚀**

---

Built with ❤️ using Node.js, Express, PostgreSQL, Claude AI, and AWS S3
