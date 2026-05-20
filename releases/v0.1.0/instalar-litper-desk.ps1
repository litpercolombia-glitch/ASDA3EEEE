# LITPER DESK — Instalador automatico Windows
# Descarga, combina, verifica, descomprime y abre la app.
# Uso: paste en PowerShell desde cualquier carpeta vacia.

$ErrorActionPreference = 'Stop'
$Branch = 'claude/order-management-desktop-app-aajeM'
$Base   = "https://raw.githubusercontent.com/litpercolombia-glitch/ASDA3EEEE/$Branch/releases/v0.1.0"
$WorkDir = Join-Path $env:USERPROFILE 'LitperDesk'
$ExpectedSHA = '349042CD0A131B476E0F2CE472F39C0132FDE4E97F1006D5AD39A3C40C55489B'

Write-Host "`n=== LITPER DESK Instalador v0.1.0 ===" -ForegroundColor Yellow
Write-Host "Carpeta destino: $WorkDir`n"

# 1. Crear carpeta limpia
if (Test-Path $WorkDir) {
  Write-Host "Limpiando instalacion anterior..." -ForegroundColor Gray
  Remove-Item -Recurse -Force $WorkDir
}
New-Item -ItemType Directory -Path $WorkDir | Out-Null
Set-Location $WorkDir

# 2. Descargar las 3 partes
$parts = @('LITPER-DESK-win-part-01','LITPER-DESK-win-part-02','LITPER-DESK-win-part-03')
foreach ($p in $parts) {
  Write-Host "Descargando $p ..." -ForegroundColor Cyan
  Invoke-WebRequest -Uri "$Base/$p" -OutFile $p -UseBasicParsing
  $size = [math]::Round((Get-Item $p).Length / 1MB, 1)
  Write-Host "  OK ($size MB)" -ForegroundColor Green
}

# 3. Combinar en un solo ZIP
Write-Host "`nCombinando partes..." -ForegroundColor Cyan
$Zip = 'LITPER-DESK-0.1.0-win-x64-portable.zip'
$out = [System.IO.File]::OpenWrite($Zip)
foreach ($p in $parts) {
  $in = [System.IO.File]::OpenRead($p)
  $in.CopyTo($out)
  $in.Close()
}
$out.Close()
$totalMB = [math]::Round((Get-Item $Zip).Length / 1MB, 1)
Write-Host "  OK ($totalMB MB total)" -ForegroundColor Green

# 4. Verificar SHA256
Write-Host "`nVerificando SHA256..." -ForegroundColor Cyan
$actualSHA = (Get-FileHash $Zip -Algorithm SHA256).Hash
if ($actualSHA -ne $ExpectedSHA) {
  Write-Host "  ERROR: SHA256 no coincide!" -ForegroundColor Red
  Write-Host "  Esperado: $ExpectedSHA"
  Write-Host "  Obtenido: $actualSHA"
  exit 1
}
Write-Host "  OK (integridad verificada)" -ForegroundColor Green

# 5. Descomprimir
Write-Host "`nDescomprimiendo..." -ForegroundColor Cyan
Expand-Archive -Path $Zip -DestinationPath 'app' -Force
Write-Host "  OK" -ForegroundColor Green

# 6. Limpiar partes temporales
Remove-Item $parts -Force
Remove-Item $Zip -Force

# 7. Localizar el exe y arrancar
$Exe = Join-Path $WorkDir 'app\LITPER DESK.exe'
if (-not (Test-Path $Exe)) {
  Write-Host "ERROR: no encontre 'LITPER DESK.exe' en $WorkDir\app" -ForegroundColor Red
  exit 1
}

Write-Host "`n=== LITPER DESK instalado ===" -ForegroundColor Yellow
Write-Host "Ubicacion: $Exe"
Write-Host "`nAbriendo la app..." -ForegroundColor Green
Start-Process -FilePath $Exe

# 8. Crear acceso directo en el escritorio para proximas veces
$Desktop = [Environment]::GetFolderPath('Desktop')
$Lnk = Join-Path $Desktop 'LITPER DESK.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($Lnk)
$Shortcut.TargetPath = $Exe
$Shortcut.WorkingDirectory = Split-Path $Exe
$Shortcut.IconLocation = $Exe
$Shortcut.Description = 'LITPER DESK - Centro operativo de escritorio'
$Shortcut.Save()
Write-Host "Acceso directo creado en el escritorio."
Write-Host "`nSi SmartScreen avisa: 'Mas informacion' -> 'Ejecutar de todas formas'." -ForegroundColor Yellow
Write-Host ""
