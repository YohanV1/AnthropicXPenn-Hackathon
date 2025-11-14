# Invoice Insights Frontend

React + Vite + TailwindCSS frontend for Invoice Insights.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Login.jsx          # Login screen
│   ├── Dashboard.jsx      # Dashboard view
│   ├── Chat.jsx           # AI chat interface
│   └── Invoices.jsx       # Invoice table
├── services/
│   └── api.js             # API service layer
├── App.jsx                # Main app component
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## 🎨 Features

- ✅ Minimalist design with TailwindCSS
- ✅ JWT authentication
- ✅ File upload with progress
- ✅ Real-time chat with AI
- ✅ Invoice management
- ✅ Analytics dashboard
- ✅ Responsive design

## 🔌 Backend Connection

Make sure your backend is running on `http://localhost:3000`

The frontend will proxy API requests through Vite's dev server.

## 🏗️ Build

```bash
npm run build
```

Output will be in `dist/` directory.

## 📝 Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:3000/api)

## 🚢 Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Static Hosting

Upload `dist/` folder to any static hosting service.
