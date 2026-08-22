# Dayflow HRMS Backend Setup Script

Write-Host "🚀 Setting up Dayflow HRMS Backend..." -ForegroundColor Cyan

# Check if Python is installed
Write-Host "`n1️⃣  Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host "`n2️⃣  Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "   ℹ️  Virtual environment already exists" -ForegroundColor Blue
} else {
    python -m venv venv
    Write-Host "   ✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "`n3️⃣  Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
Write-Host "   ✅ Virtual environment activated" -ForegroundColor Green

# Install dependencies
Write-Host "`n4️⃣  Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green

# Check if .env exists
Write-Host "`n5️⃣  Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env file not found, creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "   ✅ .env file created" -ForegroundColor Green
}

# Check Redis
Write-Host "`n6️⃣  Checking Redis..." -ForegroundColor Yellow
$redisCheck = redis-cli ping 2>&1
if ($LASTEXITCODE -eq 0 -and $redisCheck -eq "PONG") {
    Write-Host "   ✅ Redis is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Redis not detected" -ForegroundColor Yellow
    Write-Host "   📝 Install Redis using one of these methods:" -ForegroundColor Cyan
    Write-Host "      - Chocolatey: choco install redis-64" -ForegroundColor White
    Write-Host "      - Docker: docker run -d -p 6379:6379 redis:latest" -ForegroundColor White
    Write-Host "      - Redis Cloud: https://redis.com/try-free/" -ForegroundColor White
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📚 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure Redis is running" -ForegroundColor White
Write-Host "   2. Update .env file with your configuration" -ForegroundColor White
Write-Host "   3. Run: python main.py" -ForegroundColor White
Write-Host "   4. Open: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`n🎉 Happy coding!" -ForegroundColor Magenta
