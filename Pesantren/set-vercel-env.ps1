# Script untuk set environment variables di Vercel
# Jalankan setelah login: vercel login

$PROJECT_DIR = "e:\Pesantren"

Write-Host "Setting DATABASE_URL..." -ForegroundColor Cyan
echo "postgresql://neondb_owner:npg_UCdhOS7XP6mN@ep-old-shape-azlsyb4p-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" | npx vercel env add DATABASE_URL production --cwd $PROJECT_DIR

Write-Host "Setting JWT_SECRET..." -ForegroundColor Cyan
echo "pesantren_secret_key_jwt_super_secure_123!" | npx vercel env add JWT_SECRET production --cwd $PROJECT_DIR

Write-Host "Setting NODE_ENV..." -ForegroundColor Cyan
echo "production" | npx vercel env add NODE_ENV production --cwd $PROJECT_DIR

Write-Host "Done! Triggering redeploy..." -ForegroundColor Green
npx vercel --prod --yes --cwd $PROJECT_DIR
