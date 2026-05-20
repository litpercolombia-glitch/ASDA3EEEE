@echo off
echo Combinando partes...
copy /b LITPER-DESK-v02-part-01 + LITPER-DESK-v02-part-02 + LITPER-DESK-v02-part-03 LITPER-DESK-0.2.0-win-x64-portable.zip
echo.
echo Verificando SHA256...
certutil -hashfile LITPER-DESK-0.2.0-win-x64-portable.zip SHA256
echo.
echo SHA256 esperado: E3774F533C498F37A42A36736D5182084F272A87552A50AFAB6EFA79A64C8F83
pause
