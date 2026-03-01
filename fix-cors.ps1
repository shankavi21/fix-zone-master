# Firebase Storage CORS Fix - Quick Setup Script
# Run this script to fix the CORS error

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Firebase Storage CORS Fix - Setup Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
Write-Host "Checking for Google Cloud SDK..." -ForegroundColor Yellow
$gcloudInstalled = Get-Command gcloud -ErrorAction SilentlyContinue

if (-not $gcloudInstalled) {
    Write-Host "❌ Google Cloud SDK (gcloud) is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it from:" -ForegroundColor Yellow
    Write-Host "https://cloud.google.com/sdk/docs/install" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit
}

Write-Host "✅ Google Cloud SDK found!" -ForegroundColor Green
Write-Host ""

# Authenticate
Write-Host "Step 1: Authenticating with Google Cloud..." -ForegroundColor Yellow
Write-Host "A browser window will open for authentication." -ForegroundColor Gray
gcloud auth login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Authentication failed!" -ForegroundColor Red
    exit
}

Write-Host "✅ Authentication successful!" -ForegroundColor Green
Write-Host ""

# Set project
Write-Host "Step 2: Setting Firebase project..." -ForegroundColor Yellow
gcloud config set project fixzone-927de

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project!" -ForegroundColor Red
    exit
}

Write-Host "✅ Project set to fixzone-927de!" -ForegroundColor Green
Write-Host ""

# Apply CORS configuration
Write-Host "Step 3: Applying CORS configuration..." -ForegroundColor Yellow
gsutil cors set cors.json gs://fixzone-927de.firebasestorage.app

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to apply CORS configuration!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "1. Ensure billing is enabled for your Firebase project" -ForegroundColor Gray
    Write-Host "2. Enable the Storage API in Google Cloud Console" -ForegroundColor Gray
    Write-Host "3. Check that you have proper permissions" -ForegroundColor Gray
    exit
}

Write-Host "✅ CORS configuration applied successfully!" -ForegroundColor Green
Write-Host ""

# Verify CORS configuration
Write-Host "Step 4: Verifying CORS configuration..." -ForegroundColor Yellow
gsutil cors get gs://fixzone-927de.firebasestorage.app

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ CORS Configuration Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Clear your browser cache (Ctrl + Shift + Delete)" -ForegroundColor Gray
Write-Host "2. Restart your development server (stop and run 'npm start' again)" -ForegroundColor Gray
Write-Host "3. Try the technician registration again" -ForegroundColor Gray
Write-Host ""
Write-Host "If you still see CORS errors, check the FIREBASE_STORAGE_CORS_FIX.md guide." -ForegroundColor Yellow
