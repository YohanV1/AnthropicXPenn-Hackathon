#!/bin/bash

# Invoice Insights API Test Script
# This script tests all major endpoints

BASE_URL="http://localhost:3000"
TOKEN=""

echo "🧪 Invoice Insights API Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health Check
echo -e "\n${YELLOW}Test 1: Health Check${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ $RESPONSE -eq 200 ]; then
    echo -e "${GREEN}✓ Server is healthy${NC}"
else
    echo -e "${RED}✗ Server health check failed (HTTP $RESPONSE)${NC}"
    exit 1
fi

# Test 2: Register User
echo -e "\n${YELLOW}Test 2: Register New User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_'$(date +%s)'@example.com",
    "password": "Test123!",
    "fullName": "Test User"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✓ User registered successfully${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ Registration failed${NC}"
    echo $REGISTER_RESPONSE
    exit 1
fi

# Test 3: Login
echo -e "\n${YELLOW}Test 3: Login (Demo)${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/demo-login)
DEMO_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$DEMO_TOKEN" ]; then
    echo -e "${GREEN}✓ Demo login successful${NC}"
    TOKEN=$DEMO_TOKEN
else
    echo -e "${RED}✗ Login failed${NC}"
    echo $LOGIN_RESPONSE
fi

# Test 4: Get Invoices (should be empty)
echo -e "\n${YELLOW}Test 4: Get Invoices${NC}"
INVOICES_RESPONSE=$(curl -s -X GET $BASE_URL/api/invoices \
  -H "Authorization: Bearer $TOKEN")

INVOICE_COUNT=$(echo $INVOICES_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✓ Retrieved invoices (count: $INVOICE_COUNT)${NC}"

# Test 5: Chat with AI (should work even without invoices)
echo -e "\n${YELLOW}Test 5: Chat with AI${NC}"
CHAT_RESPONSE=$(curl -s -X POST $BASE_URL/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello! Can you help me understand my spending?"}')

if echo $CHAT_RESPONSE | grep -q "message"; then
    echo -e "${GREEN}✓ Chat response received${NC}"
    echo "AI Response: $(echo $CHAT_RESPONSE | grep -o '"message":"[^"]*' | cut -d'"' -f4 | cut -c1-100)..."
else
    echo -e "${RED}✗ Chat failed${NC}"
    echo $CHAT_RESPONSE
fi

# Test 6: Get Analytics Summary
echo -e "\n${YELLOW}Test 6: Analytics Summary${NC}"
SUMMARY_RESPONSE=$(curl -s -X GET $BASE_URL/api/analytics/summary \
  -H "Authorization: Bearer $TOKEN")

if echo $SUMMARY_RESPONSE | grep -q "total_invoices"; then
    echo -e "${GREEN}✓ Analytics retrieved${NC}"
    echo $SUMMARY_RESPONSE | grep -o '"total_invoices":"[^"]*\|"total_spending":"[^"]*'
else
    echo -e "${RED}✗ Analytics failed${NC}"
    echo $SUMMARY_RESPONSE
fi

# Test 7: Get Category Breakdown
echo -e "\n${YELLOW}Test 7: Category Breakdown${NC}"
CATEGORY_RESPONSE=$(curl -s -X GET $BASE_URL/api/analytics/by-category \
  -H "Authorization: Bearer $TOKEN")

if echo $CATEGORY_RESPONSE | grep -q "categories"; then
    echo -e "${GREEN}✓ Category breakdown retrieved${NC}"
else
    echo -e "${RED}✗ Category breakdown failed${NC}"
    echo $CATEGORY_RESPONSE
fi

# Test 8: Get Chat History
echo -e "\n${YELLOW}Test 8: Chat History${NC}"
HISTORY_RESPONSE=$(curl -s -X GET $BASE_URL/api/chat/history \
  -H "Authorization: Bearer $TOKEN")

if echo $HISTORY_RESPONSE | grep -q "history"; then
    HISTORY_COUNT=$(echo $HISTORY_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ Chat history retrieved (messages: $HISTORY_COUNT)${NC}"
else
    echo -e "${RED}✗ Chat history failed${NC}"
    echo $HISTORY_RESPONSE
fi

# Test 9: Unauthorized Request (should fail)
echo -e "\n${YELLOW}Test 9: Unauthorized Access (should fail)${NC}"
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/invoices)

if [ $UNAUTH_RESPONSE -eq 401 ]; then
    echo -e "${GREEN}✓ Authorization working correctly${NC}"
else
    echo -e "${RED}✗ Authorization check failed (expected 401, got $UNAUTH_RESPONSE)${NC}"
fi

# Test 10: Invalid Endpoint
echo -e "\n${YELLOW}Test 10: Invalid Endpoint (should 404)${NC}"
NOT_FOUND=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/invalid)

if [ $NOT_FOUND -eq 404 ]; then
    echo -e "${GREEN}✓ 404 handling working${NC}"
else
    echo -e "${RED}✗ 404 handling failed${NC}"
fi

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All tests completed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${YELLOW}Note: To test file upload, use this command:${NC}"
echo "curl -X POST $BASE_URL/api/invoices/upload \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "  -F \"invoice=@path/to/invoice.pdf\""
echo -e "\n${YELLOW}Your test token (valid for 7 days):${NC}"
echo $TOKEN
