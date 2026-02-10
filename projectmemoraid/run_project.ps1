# Memoraid Unified Startup Script
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Memoraid Project Unified Startup Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Check for Redis (required for Celery)
Write-Host "`n[1/5] Checking for Redis..." -ForegroundColor Yellow
$redisCheck = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet
if (-not $redisCheck) {
    Write-Host "WARNING: Redis not detected on localhost:6379." -ForegroundColor Red
    Write-Host "Celery tasks (notifications/reminders) may fail to start." -ForegroundColor Red
}
else {
    Write-Host "Redis is running." -ForegroundColor Green
}

# 2. Check for MySQL (required for Database)
Write-Host "[2/5] Checking for MySQL..." -ForegroundColor Yellow
$mysqlCheck = Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet
if (-not $mysqlCheck) {
    Write-Host "WARNING: MySQL not detected on localhost:3306." -ForegroundColor Red
    Write-Host "The application will not be able to connect to the database." -ForegroundColor Red
    Write-Host "HINT: Start the 'MySQL80' service or open MySQL Workbench." -ForegroundColor Cyan
}
else {
    Write-Host "MySQL is running." -ForegroundColor Green
}

# 3. Start Django Backend
Write-Host "[3/5] Starting Django Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Memoraid Backend'; cd backend; .\venv\Scripts\python.exe manage.py runserver"

# 4. Start Vite Frontend
Write-Host "[4/5] Starting Vite Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Memoraid Frontend'; cd frontend; npm run dev"

# 5. Start Celery Worker & Beat
Write-Host "[5/5] Starting Celery Services..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Memoraid Celery Worker'; cd backend; .\venv\Scripts\celery.exe -A memoraid_backend worker --loglevel=info -P solo"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Memoraid Celery Beat'; cd backend; .\venv\Scripts\celery.exe -A memoraid_backend beat --loglevel=info"

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "All services have been launched in separate windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Press any key to close this launcher window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
