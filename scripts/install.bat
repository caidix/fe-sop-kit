@echo off
REM yh-sop-fe-kit Windows launcher — runs install.sh with Git Bash.
REM Usage:  scripts\install.bat  [args]
REM   args are forwarded to install.sh, e.g.  install.bat --all-react
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "BASH_EXE="

if exist "%ProgramFiles%\Git\bin\bash.exe" (
  set "BASH_EXE=%ProgramFiles%\Git\bin\bash.exe"
) else if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" (
  set "BASH_EXE=%ProgramFiles(x86)%\Git\bin\bash.exe"
) else if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" (
  set "BASH_EXE=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
)

if not defined BASH_EXE (
  echo [ERROR] Git Bash not found. Please install Git for Windows:
  echo   https://git-scm.com/download/win
  echo Or open Git Bash and run:  bash scripts/install.sh
  exit /b 1
)

"%BASH_EXE%" "%SCRIPT_DIR%install.sh" %*
exit /b %ERRORLEVEL%
