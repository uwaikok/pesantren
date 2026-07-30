# Script untuk set environment variables di Vercel
# Jalankan setelah login: vercel login

$VERCEL = "C:\laragon\bin\nodejs\node-v18\node_modules\.bin\vercel.cmd"
$PROJECT_DIR = "e:\Pesantren"

Write-Host "Setting DATABASE_URL..." -ForegroundColor Cyan
echo "postgresql://neondb_owner:npg_UCdhOS7XP6mN@ep-hidden-snow-az6ct8fs.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" | & $VERCEL env add DATABASE_URL production --cwd $PROJECT_DIR

Write-Host "Setting JWT_SECRET..." -ForegroundColor Cyan
echo "pesantren_secret_key_jwt_super_secure_123!" | & $VERCEL env add JWT_SECRET production --cwd $PROJECT_DIR

Write-Host "Setting NODE_ENV..." -ForegroundColor Cyan
echo "production" | & $VERCEL env add NODE_ENV production --cwd $PROJECT_DIR

Write-Host "Done! Triggering redeploy..." -ForegroundColor Green
& $VERCEL --prod --cwd $PROJECT_DIR
