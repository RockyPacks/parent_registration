#!/bin/bash

# System Status Check Script
# This script verifies that all components of the Student Enrollment Platform are running correctly

echo "════════════════════════════════════════════════════════════════"
echo "  Student Enrollment Platform - System Status Check"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNING=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    elif [ $1 -eq 2 ]; then
        echo -e "${YELLOW}⚠${NC} $2"
        ((WARNING++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Backend Service Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if backend is running on port 8000
if lsof -i :8000 | grep -q LISTEN; then
    print_status 0 "Backend is running on port 8000"
    
    # Check backend health endpoint
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
    if [ "$HEALTH_RESPONSE" = "200" ] || [ "$HEALTH_RESPONSE" = "404" ]; then
        print_status 0 "Backend is responding (HTTP $HEALTH_RESPONSE)"
    else
        print_status 1 "Backend health check failed (HTTP $HEALTH_RESPONSE)"
    fi
else
    print_status 1 "Backend is NOT running on port 8000"
    echo -e "${YELLOW}   To start backend: cd backend && source .venv/bin/activate && uvicorn app.main:app --reload${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2. Frontend Service Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if frontend is running
FRONTEND_PORT=""
for port in 3000 3001 5173; do
    if lsof -i :$port | grep -q LISTEN; then
        FRONTEND_PORT=$port
        break
    fi
done

if [ -n "$FRONTEND_PORT" ]; then
    print_status 0 "Frontend is running on port $FRONTEND_PORT"
    
    # Check frontend accessibility
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$FRONTEND_PORT 2>/dev/null)
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        print_status 0 "Frontend is accessible (HTTP $FRONTEND_RESPONSE)"
        echo -e "${BLUE}   URL: http://localhost:$FRONTEND_PORT${NC}"
    else
        print_status 1 "Frontend is not accessible (HTTP $FRONTEND_RESPONSE)"
    fi
else
    print_status 1 "Frontend is NOT running"
    echo -e "${YELLOW}   To start frontend: cd frontend && npm run dev${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3. Environment Configuration Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check backend .env file
if [ -f "backend/.env" ]; then
    print_status 0 "Backend .env file exists"
    
    # Check for required variables
    if grep -q "SUPABASE_URL=" backend/.env && [ -n "$(grep "SUPABASE_URL=" backend/.env | cut -d'=' -f2)" ]; then
        print_status 0 "SUPABASE_URL is set"
    else
        print_status 1 "SUPABASE_URL is not set in backend/.env"
    fi
    
    if grep -q "SUPABASE_ANON_KEY=" backend/.env && [ -n "$(grep "SUPABASE_ANON_KEY=" backend/.env | cut -d'=' -f2)" ]; then
        print_status 0 "SUPABASE_ANON_KEY is set"
    else
        print_status 1 "SUPABASE_ANON_KEY is not set in backend/.env"
    fi
else
    print_status 1 "Backend .env file does not exist"
    echo -e "${YELLOW}   Create from template: cp backend/.env.example backend/.env${NC}"
fi

# Check frontend .env file
if [ -f "frontend/.env.local" ] || [ -f "frontend/.env" ]; then
    print_status 0 "Frontend .env file exists"
    
    ENV_FILE="frontend/.env.local"
    [ ! -f "$ENV_FILE" ] && ENV_FILE="frontend/.env"
    
    # Check for required variables
    if grep -q "VITE_SUPABASE_URL=" $ENV_FILE && [ -n "$(grep "VITE_SUPABASE_URL=" $ENV_FILE | cut -d'=' -f2)" ]; then
        print_status 0 "VITE_SUPABASE_URL is set"
    else
        print_status 1 "VITE_SUPABASE_URL is not set in $ENV_FILE"
    fi
    
    if grep -q "VITE_APP_API_URL=" $ENV_FILE && [ -n "$(grep "VITE_APP_API_URL=" $ENV_FILE | cut -d'=' -f2)" ]; then
        API_URL=$(grep "VITE_APP_API_URL=" $ENV_FILE | cut -d'=' -f2)
        print_status 0 "VITE_APP_API_URL is set to: $API_URL"
    else
        print_status 1 "VITE_APP_API_URL is not set in $ENV_FILE"
    fi
else
    print_status 1 "Frontend .env file does not exist"
    echo -e "${YELLOW}   Create from template: cp frontend/.env.example frontend/.env.local${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4. Database Connection Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Extract Supabase URL from backend .env
if [ -f "backend/.env" ]; then
    SUPABASE_URL=$(grep "SUPABASE_URL=" backend/.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    
    if [ -n "$SUPABASE_URL" ]; then
        # Check if Supabase is accessible
        SUPABASE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL" 2>/dev/null)
        if [ "$SUPABASE_RESPONSE" = "200" ] || [ "$SUPABASE_RESPONSE" = "404" ]; then
            print_status 0 "Supabase is accessible"
        else
            print_status 1 "Supabase is not accessible (HTTP $SUPABASE_RESPONSE)"
        fi
    else
        print_status 2 "Supabase URL not configured"
    fi
else
    print_status 2 "Cannot check Supabase - backend/.env not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  5. Dependencies Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Python virtual environment
if [ -d "backend/.venv" ] || [ -d "backend/venv" ]; then
    print_status 0 "Python virtual environment exists"
else
    print_status 1 "Python virtual environment not found"
    echo -e "${YELLOW}   Create venv: cd backend && python -m venv .venv${NC}"
fi

# Check Node modules
if [ -d "frontend/node_modules" ]; then
    print_status 0 "Node modules installed"
else
    print_status 1 "Node modules not installed"
    echo -e "${YELLOW}   Install dependencies: cd frontend && npm install${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  6. File Structure Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check critical files
[ -f "backend/app/main.py" ] && print_status 0 "Backend main.py exists" || print_status 1 "Backend main.py missing"
[ -f "backend/requirements.txt" ] && print_status 0 "Backend requirements.txt exists" || print_status 1 "Backend requirements.txt missing"
[ -f "frontend/package.json" ] && print_status 0 "Frontend package.json exists" || print_status 1 "Frontend package.json missing"
[ -f "frontend/App.tsx" ] && print_status 0 "Frontend App.tsx exists" || print_status 1 "Frontend App.tsx missing"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Passed:${NC}  $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNING"
echo -e "${RED}Failed:${NC}  $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ System is ready for end-to-end testing!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure email confirmation is disabled in Supabase (see ENABLE_E2E_TESTING.md)"
    echo "2. Open http://localhost:$FRONTEND_PORT in your browser"
    echo "3. Sign up and test the complete enrollment flow"
    echo ""
else
    echo -e "${RED}✗ System has issues that need to be resolved${NC}"
    echo ""
    echo "Please fix the failed checks above before proceeding."
    echo ""
fi

echo "════════════════════════════════════════════════════════════════"
echo "  For detailed testing instructions, see:"
echo "  - END_TO_END_TEST_REPORT.md"
echo "  - ENABLE_E2E_TESTING.md"
echo "════════════════════════════════════════════════════════════════"
echo ""
