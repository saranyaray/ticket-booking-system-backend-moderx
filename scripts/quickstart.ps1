#!/usr/bin/env powershell
# Quick start script for Windows PowerShell
# Usage: .\scripts\quickstart.ps1

Write-Host "Ticket Booking System - Quick Start" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "✓ npm: $npmVersion" -ForegroundColor Green

# Set environment variables
Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:PGHOST = 'localhost'
$env:PGUSER = 'postgres'
$env:PGPASSWORD = 'postgres'
$env:PGDATABASE = 'ticketdb'
$env:PGPORT = '5432'
$env:PORT = '3000'

Write-Host "✓ Database: $env:PGDATABASE" -ForegroundColor Green
Write-Host "✓ Port: $env:PORT" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host ""
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
  $result = psql -h $env:PGHOST -U $env:PGUSER -d postgres -c "SELECT 1" 2>&1
  Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} catch {
  Write-Host "❌ PostgreSQL not running or not found" -ForegroundColor Red
  Write-Host "Please install PostgreSQL or start the PostgreSQL service" -ForegroundColor Yellow
  exit 1
}

# Create database if it doesn't exist
Write-Host ""
Write-Host "Setting up database..." -ForegroundColor Yellow
$dbExists = psql -h $env:PGHOST -U $env:PGUSER -tc "SELECT 1 FROM pg_database WHERE datname = '$env:PGDATABASE'" 2>&1
if ($dbExists -notmatch "1") {
  Write-Host "Creating database: $env:PGDATABASE" -ForegroundColor Yellow
  psql -h $env:PGHOST -U $env:PGUSER -c "CREATE DATABASE $env:PGDATABASE"
}

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Yellow
psql -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -f .\sql\schema.sql
psql -h $env:PGHOST -U $env:PGUSER -d $env:PGDATABASE -f .\sql\feature_flags.sql
Write-Host "✓ Migrations completed" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Start server
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host "Server will run on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host ""

npm start
