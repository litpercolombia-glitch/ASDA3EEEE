# LITPER DESK v0.3.0 — Instalador automatico Windows
# Sprint 0B: Score, novedades sub-tipos, KPIs expandidos.
# Uso: paste en PowerShell desde cualquier carpeta.

$ErrorActionPreference = 'Stop'
$Branch = 'claude/order-management-desktop-app-aajeM'
$Base   = "https://raw.githubusercontent.com/litpercolombia-glitch/ASDA3EEEE/$Branch/releases/v0.3.0"
$WorkDir = Join-Path $env:USERPROFILE 'LitperDesk'
$ExpectedSHA = 'D6D51214BDC6BA5D5602938DB0E5BE220E5AA98615912CAB160E1711B4E716B2'

Write-Host "`n=== LITPER DESK Instalador v0.3.0 (Sprint 0B) ===" -ForegroundColor Yellow
Write-Host "Carpeta destino: $WorkDir`n"

Get-Process -Name 'LITPER DESK','litper-desk' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if (Test-Path $WorkDir) {
  Write-Host "Limpiando instalacion anterior..." -ForegroundColor Gray
  Remove-Item -Recurse -Force $WorkDir -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $WorkDir | Out-Null
Set-Location $WorkDir

$parts = @('LITPER-DESK-v03-part-01','LITPER-DESK-v03-part-02','LITPER-DESK-v03-part-03')
foreach ($p in $parts) {
  Write-Host "Descargando $p ..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri "$Base/$p" -OutFile $p -UseBasicParsing
  $size = [math]::Round((Get-Item $p).Length / 1MB, 1)
  Write-Host "  OK ($size MB)" -ForegroundColor Green
}

Write-Host "`nCombinando partes..." -ForegroundColor Cyan
$Zip = 'LITPER-DESK-0.3.0-win-x64-portable.zip'
$out = [System.IO.File]::OpenWrite($Zip)
foreach ($p in $parts) {
  $in = [System.IO.File]::OpenRead($p)
  $in.CopyTo($out)
  $in.Close()
}
$out.Close()
$totalMB = [math]::Round((Get-Item $Zip).Length / 1MB, 1)
Write-Host "  OK ($totalMB MB total)" -ForegroundColor Green

Write-Host "`nVerificando SHA256..." -ForegroundColor Cyan
$actualSHA = (Get-FileHash $Zip -Algorithm SHA256).Hash
if ($actualSHA -ne $ExpectedSHA) {
  Write-Host "  ERROR: SHA256 no coincide!" -ForegroundColor Red
  Write-Host "  Esperado: $ExpectedSHA"
  Write-Host "  Obtenido: $actualSHA"
  exit 1
}
Write-Host "  OK (integridad verificada)" -ForegroundColor Green

Write-Host "`nDescomprimiendo..." -ForegroundColor Cyan
Expand-Archive -Path $Zip -DestinationPath 'app' -Force
Write-Host "  OK" -ForegroundColor Green

Remove-Item $parts -Force -ErrorAction SilentlyContinue
Remove-Item $Zip -Force -ErrorAction SilentlyContinue

$Exe = Join-Path $WorkDir 'app\LITPER DESK.exe'
if (-not (Test-Path $Exe)) {
  Write-Host "ERROR: no encontre LITPER DESK.exe" -ForegroundColor Red
  exit 1
}

Write-Host "`n=== LITPER DESK v0.3.0 instalado ===" -ForegroundColor Yellow
Write-Host "Novedades v0.3.0:" -ForegroundColor Cyan
Write-Host "  + Score basado en 1 pedido / 3 min (gauge 0-100)"
Write-Host "  + 10 sub-tipos de Novedades con popup 1-tap"
Write-Host "  + Velocidad real (ped/min) y estimacion al cierre"
Write-Host "  + Mejor hora del dia, horas trabajadas / restantes"
Write-Host "  + Jornada laboral configurable por operador"
Write-Host "  + Mas detalle bajo Guardar ronda (realizados/rondas/pendientes/novedades)"

# Acceso directo
$Desktop = [Environment]::GetFolderPath('Desktop')
$Lnk = Join-Path $Desktop 'LITPER DESK.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($Lnk)
$Shortcut.TargetPath = $Exe
$Shortcut.WorkingDirectory = Split-Path $Exe
$Shortcut.IconLocation = $Exe
$Shortcut.Description = 'LITPER DESK v0.3.0'
$Shortcut.Save()
Write-Host "`nAcceso directo actualizado en el escritorio." -ForegroundColor Green

Write-Host "Abriendo LITPER DESK..." -ForegroundColor Green
Start-Process -FilePath $Exe
Write-Host ""
