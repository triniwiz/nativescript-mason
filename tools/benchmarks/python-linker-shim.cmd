@echo off
setlocal EnableExtensions DisableDelayedExpansion
for %%I in ("%RUST_ANDROID_GRADLE_PYTHON_COMMAND%") do set "MASON_LINKER_SHIM_DIR=%%~dpI"
set "MASON_LINKER_RAW_ARGUMENTS=%*"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%MASON_LINKER_SHIM_DIR%python-linker-shim.ps1"
exit /b %ERRORLEVEL%
