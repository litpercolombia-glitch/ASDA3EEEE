# LITPER DESK v0.2.0 — Instalador automatico Windows
# Uso: paste en PowerShell desde cualquier carpeta.

$ErrorActionPreference = 'Stop'
$Branch = 'claude/order-management-desktop-app-aajeM'
$Base   = "https://raw.githubusercontent.com/litpercolombia-glitch/ASDA3EEEE/$Branch/releases/v0.2.0"
$WorkDir = Join-Path $env:USERPROFILE 'LitperDesk'
$ExpectedSHA = 'E3774F533C498F37A42A36736D5182084F272A87552A50AFAB6EFA79A64C8F83'

Write-Host "`n=== LITPER DESK Instalador v0.2.0 ===" -ForegroundColor Yellow
Write-Host "Carpeta destino: $WorkDir`n"

# Cerrar instancia previa si esta corriendo
Get-Process -Name 'LITPER DESK','litper-desk' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if (Test-Path $WorkDir) {
  Write-Host "Limpiando instalacion anterior..." -ForegroundColor Gray
  Remove-Item -Recurse -Force $WorkDir -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $WorkDir | Out-Null
Set-Location $WorkDir

$parts = @('LITPER-DESK-v02-part-01','LITPER-DESK-v02-part-02','LITPER-DESK-v02-part-03')
foreach ($p in $parts) {
  Write-Host "Descargando $p ..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri "$Base/$p" -OutFile $p -UseBasicParsing
  $size = [math]::Round((Get-Item $p).Length / 1MB, 1)
  Write-Host "  OK ($size MB)" -ForegroundColor Green
}

Write-Host "`nCombinando partes..." -ForegroundColor Cyan
$Zip = 'LITPER-DESK-0.2.0-win-x64-portable.zip'
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

Write-Host "`n=== LITPER DESK v0.2.0 instalado ===" -ForegroundColor Yellow
Write-Host "Ubicacion: $Exe"

# Actualizar acceso directo
$Desktop = [Environment]::GetFolderPath('Desktop')
$Lnk = Join-Path $Desktop 'LITPER DESK.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($Lnk)
$Shortcut.TargetPath = $Exe
$Shortcut.WorkingDirectory = Split-Path $Exe
$Shortcut.IconLocation = $Exe
$Shortcut.Description = 'LITPER DESK v0.2.0'
$Shortcut.Save()
Write-Host "Acceso directo actualizado en el escritorio." -ForegroundColor Green

Write-Host "`nAbriendo LITPER DESK..." -ForegroundColor Green
Start-Process -FilePath $Exe
Write-Host ""
