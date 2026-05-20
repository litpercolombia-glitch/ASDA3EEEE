@echo off
REM LITPER DESK v0.1.0 — combinar partes y arrancar
echo Combinando partes...
copy /b LITPER-DESK-win-part-01 + LITPER-DESK-win-part-02 + LITPER-DESK-win-part-03 LITPER-DESK-0.1.0-win-x64-portable.zip
echo.
echo Verificando checksum SHA256...
certutil -hashfile LITPER-DESK-0.1.0-win-x64-portable.zip SHA256
echo.
echo SHA256 esperado: 349042cd0a131b476e0f2ce472f39c0132fde4e97f1006d5ad39a3c40c55489b
echo.
echo Si el SHA256 coincide, descomprime el ZIP con click derecho ^> Extraer todo
echo y luego doble click en "LITPER DESK.exe".
echo.
pause
