# ==============================================================================
# pondok-ai — Cross-Platform One-Command Installer (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "            PONDOK AI            " -ForegroundColor Cyan
Write-Host "  Your private AI environment    " -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking prerequisites..." -ForegroundColor White

# 1. Check Node.js
try {
    $nodeVer = (node -v).TrimStart('v')
    $major = [int]($nodeVer.Split('.')[0])
    if ($major -ge 22) {
        Write-Host "  Node.js:          v$nodeVer" -ForegroundColor Green
    } else {
        Write-Host "  Node.js:          v$nodeVer (Node.js 22+ required)" -ForegroundColor Red
        Write-Host "Error: Node.js (v22+) is required to run pondok-ai." -ForegroundColor Red
        Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  Node.js:          Not installed" -ForegroundColor Red
    Write-Host "Error: Node.js (v22+) is required to run pondok-ai." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 2. Check Docker
try {
    $dockerVer = docker --version
    Write-Host "  Docker:           $dockerVer" -ForegroundColor Green

    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Docker Daemon:    Running" -ForegroundColor Green
    } else {
        Write-Host "  Docker Daemon:    Not running" -ForegroundColor Yellow
        Write-Host "Please ensure Docker Desktop for Windows is running." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Docker:           Not detected" -ForegroundColor Yellow
    Write-Host "Download Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Launching pondok-ai initialization..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "dist\index.js") {
    node dist\index.js init @args
    node dist\index.js up
} else {
    npx pondok-ai init @args
    npx pondok-ai up
}
