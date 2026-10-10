@echo off
rem Inicia el backend usando el JDK 17 de %USERPROFILE%\.jdks, aunque la terminal tenga otro Java configurado.
rem Uso: .\iniciar-backend.cmd   (desde la raiz del proyecto)
setlocal
for /d %%D in ("%USERPROFILE%\.jdks\jdk-17*") do set "JAVA_HOME=%%D"
if not defined JAVA_HOME (
  echo No se encontro un JDK 17 en %USERPROFILE%\.jdks ni la variable JAVA_HOME.
  echo Instala un JDK 17 o superior y define JAVA_HOME antes de continuar.
  exit /b 1
)
echo Usando JAVA_HOME=%JAVA_HOME%
cd /d "%~dp0backend"
call "%~dp0backend\mvnw.cmd" spring-boot:run
