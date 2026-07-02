@echo off
title Lanzador Automatico - Calendario UCT
cls

echo =======================================================
echo     INICIANDO ASISTENTE INTELIGENTE - CALENDARIO UCT
echo =======================================================
echo.

:: 1. Identificar de forma automatica la ruta actual donde se hace clic
set DIRECTORIO_ACTUAL=%~dp0
cd /d "%DIRECTORIO_ACTUAL%"

:: 2. Verificar e instalar librerias por si acaso
echo [1/3] Verificando entorno de Python...
python -m pip install Flask openpyxl pandas --quiet

:: 3. Abrir el navegador web de forma anticipada antes de lanzar el servidor
echo [2/3] Abriendo interfaz web en el navegador...
start "" "http://localhost:5000"

:: 4. Ejecutar el servidor Python visible
echo [3/3] Levantando el servidor backend...
echo -------------------------------------------------------
echo ¡Listo! El servidor esta corriendo. 
echo NO cierres esta ventana mientras uses la aplicacion.
echo -------------------------------------------------------
echo.

:: Ejecutar python de forma visible (le quitamos la 'w') para ver los mensajes en verde
python server.py