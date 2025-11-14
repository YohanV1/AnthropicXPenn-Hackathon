#!/bin/bash

echo "🚀 Invoice Insights Backend - Quick Start Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "\n${YELLOW}Checking Node.js...${NC}"
if command -v node &> /dev/null
then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18 or higher${NC}"
    exit 1
fi

# Check PostgreSQL
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null
then
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✓ PostgreSQL found: $PSQL_VERSION${NC}"
else
    echo -e "${RED}✗ PostgreSQL not found. Please install PostgreSQL 14 or higher${NC}"
    exit 1
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Check for .env file
echo -e "\n${YELLOW}Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ No .env file found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please edit .env and add your credentials before continuing${NC}"
    echo -e "${YELLOW}  Required: DB credentials, ANTHROPIC_API_KEY, AWS credentials${NC}"
    exit 0
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Create database
echo -e "\n${YELLOW}Setting up database...${NC}"
read -p "Database name (default: invoice_insights): " DB_NAME
DB_NAME=${DB_NAME:-invoice_insights}

read -p "PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

echo -e "${YELLOW}Creating database $DB_NAME...${NC}"
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${YELLOW}⚠ Database might already exist (continuing...)${NC}"
fi

# Run migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
npm run db:migrate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${RED}✗ Migration failed. Check your database credentials in .env${NC}"
    exit 1
fi

# Final instructions
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Make sure your .env file has all required credentials:"
echo -e "   - ANTHROPIC_API_KEY (get from console.anthropic.com)"
echo -e "   - AWS credentials (for S3 storage)"
echo -e "   - JWT_SECRET (any random string)"
echo -e "\n2. Start the development server:"
echo -e "   ${GREEN}npm run dev${NC}"
echo -e "\n3. Or start in production mode:"
echo -e "   ${GREEN}npm start${NC}"
echo -e "\n4. Test the API:"
echo -e "   ${GREEN}curl http://localhost:3000/health${NC}"
echo -e "\n5. Check the README.md for API documentation"
echo -e "\n${YELLOW}Happy coding! 🎉${NC}\n"
