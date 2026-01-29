@echo off
REM =====================================================
REM SCRIPT PARA WINDOWS - LITPER PRO
REM =====================================================
REM Ejecutar con doble clic o: EJECUTAR_WINDOWS.bat
REM =====================================================

echo.
echo ======================================================
echo      LITPER PRO - INSTALACION AUTOMATICA (Windows)
echo ======================================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no encontrado. Instalalo desde python.org
    pause
    exit /b 1
)

echo [1/4] Instalando dependencias...
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy psycopg2-binary asyncpg
pip install pandas numpy scikit-learn xgboost joblib
pip install anthropic openai aiohttp google-generativeai
pip install python-dotenv loguru pydantic python-multipart openpyxl
pip install apscheduler httpx passlib python-jose bcrypt

echo.
echo [2/4] Verificando configuracion...
if not exist "backend\.env" (
    copy ".env.backend" "backend\.env"
    echo Archivo .env creado. Edita backend\.env con tus API keys.
)

echo.
echo [3/4] Inicializando base de datos...
cd backend
python -c "from database import init_database, crear_configuraciones_default; init_database(); crear_configuraciones_default(); print('OK')"
cd ..

echo.
echo [4/4] Cargando datos de prueba...
python scripts\cargar_datos_prueba.py

echo.
echo ======================================================
echo      INSTALACION COMPLETADA
echo ======================================================
echo.
echo Para iniciar el servidor ejecuta:
echo   cd backend
echo   python main.py
echo.
echo Luego abre: http://localhost:8000/docs
echo.

set /p respuesta="Iniciar servidor ahora? (s/n): "
if "%respuesta%"=="s" (
    cd backend
    python main.py
)

pause
