$envFile = Join-Path $PSScriptRoot "..\.env"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: No se encontró el archivo .env en la raíz del proyecto." -ForegroundColor Red
    return
}

Write-Host "Cargando variables desde .env..." -ForegroundColor Cyan

Get-Content $envFile | ForEach-Object {

    $line = $_.Trim()

    if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {

        $name = $matches[1].Trim()
        $value = $matches[2].Trim()

[Environment]::SetEnvironmentVariable($name, $value, "Process")
        Write-Host "  - $name cargada" -ForegroundColor Green
    }
}

Write-Host "Variables de entorno cargadas correctamente." -ForegroundColor Green
