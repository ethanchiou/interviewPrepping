#!/bin/bash
# Complete Backend Setup and Troubleshooting Script

echo "🚀 Interview Simulator - Complete Backend Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: requirements.txt not found${NC}"
    echo "Please run this script from apps/api directory"
    exit 1
fi

echo "Step 1: Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${YELLOW}⚠️  Virtual environment already exists${NC}"
fi

echo ""
echo "Step 2: Activating virtual environment..."
source venv/bin/activate

echo ""
echo "Step 3: Installing dependencies..."
pip install -r requirements.txt --quiet
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""
echo "Step 4: Creating directory structure..."
mkdir -p app/routes app/services app/utils

echo ""
echo "Step 5: Creating __init__.py files..."

# App __init__.py
cat > app/__init__.py << 'EOF'
"""Interview Simulator API application."""
EOF

# Routes __init__.py
cat > app/routes/__init__.py << 'EOF'
"""Routes package."""
EOF

# Services __init__.py
cat > app/services/__init__.py << 'EOF'
"""Services package."""
from .llm_openrouter import openrouter
from .session_state import session_state

__all__ = ["openrouter", "session_state"]
EOF

# Utils __init__.py
cat > app/utils/__init__.py << 'EOF'
"""Utils package."""
from .id import generate_id
from .json_schema import validate_coach_output

__all__ = ["generate_id", "validate_coach_output"]
EOF

echo -e "${GREEN}✅ __init__.py files created${NC}"

echo ""
echo "Step 6: Checking environment file..."
if [ -f ".env.local" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Found .env.local but not .env${NC}"
    echo "Creating symlink: .env -> .env.local"
    ln -sf .env.local .env
    echo -e "${GREEN}✅ Symlink created${NC}"
elif [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${RED}❌ No environment file found${NC}"
    echo "Creating .env template..."
    cat > .env << 'EOF'
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/interview_sim
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000
EOF
    echo -e "${YELLOW}⚠️  Created .env template - PLEASE EDIT WITH YOUR ACTUAL API KEY${NC}"
fi

echo ""
echo "Step 7: Checking required files..."

MISSING_FILES=()

# Check for service files
if [ ! -f "app/services/llm_openrouter.py" ]; then
    MISSING_FILES+=("app/services/llm_openrouter.py")
fi
if [ ! -f "app/services/session_state.py" ]; then
    MISSING_FILES+=("app/services/session_state.py")
fi
if [ ! -f "app/services/prompt_templates.py" ]; then
    MISSING_FILES+=("app/services/prompt_templates.py")
fi

# Check for util files
if [ ! -f "app/utils/json_schema.py" ]; then
    MISSING_FILES+=("app/utils/json_schema.py")
fi
if [ ! -f "app/utils/id.py" ]; then
    MISSING_FILES+=("app/utils/id.py")
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please copy these files from the outputs directory"
    exit 1
else
    echo -e "${GREEN}✅ All required files present${NC}"
fi

echo ""
echo "Step 8: Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL client installed${NC}"
    
    # Try to connect
    if psql -h localhost -U postgres -d postgres -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is running${NC}"
        
        # Check if database exists
        if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw interview_sim; then
            echo -e "${GREEN}✅ Database 'interview_sim' exists${NC}"
        else
            echo -e "${YELLOW}⚠️  Database 'interview_sim' not found${NC}"
            echo "Creating database..."
            createdb -h localhost -U postgres interview_sim
            echo -e "${GREEN}✅ Database created${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot connect to PostgreSQL${NC}"
        echo "Please start PostgreSQL:"
        echo "  macOS: brew services start postgresql@14"
        echo "  Linux: sudo systemctl start postgresql"
    fi
else
    echo -e "${RED}❌ PostgreSQL not installed${NC}"
    echo "Install PostgreSQL:"
    echo "  macOS: brew install postgresql@14"
    echo "  Linux: sudo apt-get install postgresql"
fi

echo ""
echo "Step 9: Checking Redis..."
if command -v redis-cli &> /dev/null; then
    echo -e "${GREEN}✅ Redis client installed${NC}"
    
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis not running${NC}"
        echo "Please start Redis:"
        echo "  macOS: brew services start redis"
        echo "  Linux: sudo systemctl start redis"
    fi
else
    echo -e "${RED}❌ Redis not installed${NC}"
    echo "Install Redis:"
    echo "  macOS: brew install redis"
    echo "  Linux: sudo apt-get install redis-server"
fi

echo ""
echo "Step 10: Running test imports..."
python3 << 'PYEOF'
import sys
sys.path.insert(0, '.')

errors = []

try:
    from app.config import settings
    print("✅ Config imports successfully")
except Exception as e:
    print(f"❌ Config import failed: {e}")
    errors.append("config")

try:
    from app.db import get_db, init_db
    print("✅ Database imports successfully")
except Exception as e:
    print(f"❌ Database import failed: {e}")
    errors.append("db")

try:
    from app.services.llm_openrouter import openrouter
    print("✅ OpenRouter service imports successfully")
except Exception as e:
    print(f"❌ OpenRouter service import failed: {e}")
    errors.append("openrouter")

try:
    from app.services.session_state import session_state
    print("✅ Session state service imports successfully")
except Exception as e:
    print(f"❌ Session state service import failed: {e}")
    errors.append("session_state")

if errors:
    print(f"\n❌ Import errors detected in: {', '.join(errors)}")
    sys.exit(1)
PYEOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Import tests failed${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file has your actual OpenRouter API key"
echo "2. Seed the database: python -m app.seed"
echo "3. Start the server: uvicorn app.main:app --reload --port 8000"
echo ""