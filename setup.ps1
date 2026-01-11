# setup.ps1 - Windows Setup Script

Write-Host "🚀 Starting Interview Simulator Setup (Windows)..." -ForegroundColor Cyan

# 1. Start Infrastructure
Write-Host "📦 Starting Infrastructure (Docker)..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker failed to start. Ensure Docker Desktop is running."
    exit 1
}

Write-Host "⏳ Waiting for database..."
Start-Sleep -Seconds 5

# 2. Setup Backend
Write-Host "🐍 Setting up Backend..." -ForegroundColor Green
Set-Location "apps\api"

if (-not (Test-Path "venv")) {
    Write-Host "   Creating virtual environment..."
    python -m venv venv
}

# Activate venv
# Note: This only activates for the current script scope. 
# We call pip/python directly via the venv path to ensure it uses the right one context-free.
.\venv\Scripts\python.exe -m pip install -r requirements.txt

if (-not (Test-Path ".env")) {
    Write-Host "   Creating .env file..."
    $envContent = @"
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/interview_sim
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:3000
"@
    Set-Content -Path ".env" -Value $envContent
    Write-Host "⚠️  Please edit apps\api\.env to add your OPENROUTER_API_KEY" -ForegroundColor Red
}

Write-Host "   Seeding database..."
.\venv\Scripts\python.exe -m app.seed

# 3. Setup Frontend
Write-Host "⚛️ Setting up Frontend..." -ForegroundColor Blue
Set-Location "..\web"

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..."
    npm install
}

if (-not (Test-Path ".env.local")) {
    Write-Host "   Creating .env.local file..."
    $webEnvContent = @"
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
"@
    Set-Content -Path ".env.local" -Value $webEnvContent
}

# 4. Run Application
Write-Host "✅ Setup Complete!" -ForegroundColor Cyan
Write-Host "🚀 Starting services..."

# 1. Start Backend in a new window
# Note: We use relative path from current location (apps/web) back to api
Write-Host "🐍 Starting Backend (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {cd ..\api; if (Test-Path venv) { .\venv\Scripts\Activate.ps1 } else { Write-Error 'venv not found' }; uvicorn app.main:app --reload --port 8000}" -WorkingDirectory .

# Wait a bit for backend
Start-Sleep -Seconds 3

# 2. Start Frontend in a new window
# We are currently in apps/web
Write-Host "⚛️ Starting Frontend (Port 3000)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {npm run dev}" -WorkingDirectory .

Write-Host "✅ Services started in new windows." -ForegroundColor Cyan
Write-Host "Press any key to exit this installer (services will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
