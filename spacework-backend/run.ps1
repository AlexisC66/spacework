# SpaceWork Backend — Script de inicio
# Carga el .env y ejecuta Spring Boot

$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            # No sobreescribir variables del sistema ya definidas
            if (-not [Environment]::GetEnvironmentVariable($key, 'Process')) {
                [Environment]::SetEnvironmentVariable($key, $value, 'Process')
            }
        }
    }
    Write-Host "✅ .env cargado" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se encontró .env, usando variables del sistema" -ForegroundColor Yellow
}

Write-Host "🚀 Iniciando SpaceWork Backend..." -ForegroundColor Cyan
Push-Location $PSScriptRoot
try {
    & ".\mvnw.cmd" spring-boot:run
} finally {
    Pop-Location
}
