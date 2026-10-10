# Borra la base de datos local de demostración (H2) y los CV subidos.
# Al volver a iniciar el backend se cargan otra vez los datos de prueba.
# Uso: .\reiniciar-datos.ps1   (con el backend detenido)

$datos = Join-Path $PSScriptRoot 'backend\data'
$enUso = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($enUso) {
    Write-Host 'El backend sigue en ejecucion (puerto 8080). Detenlo con Ctrl+C y vuelve a ejecutar este script.' -ForegroundColor Yellow
    exit 1
}
if (Test-Path $datos) {
    Remove-Item $datos -Recurse -Force
    Write-Host 'Datos borrados. Inicia el backend para cargar los datos de prueba.' -ForegroundColor Green
} else {
    Write-Host 'No habia datos que borrar.'
}
