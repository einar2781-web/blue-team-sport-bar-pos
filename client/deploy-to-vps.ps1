# Script de despliegue para Blue Team Sport Bar POS
# Configuración
$VPS_IP = "31.97.43.51"
$VPS_USER = "root"  # Ajusta según tu configuración
$VPS_PATH = "/var/www/pos.chapibot.pro"
$LOCAL_BUILD_PATH = ".\dist"

Write-Host "🚀 Iniciando despliegue de Blue Team Sport Bar POS..." -ForegroundColor Green

# 1. Verificar que existe el build
if (-Not (Test-Path $LOCAL_BUILD_PATH)) {
    Write-Host "❌ Error: No se encuentra la carpeta 'dist'. Ejecuta 'npm run build' primero." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build encontrado" -ForegroundColor Green

# 2. Crear backup en VPS (opcional)
Write-Host "📦 Creando backup en servidor..." -ForegroundColor Yellow
$backupCommand = "ssh ${VPS_USER}@${VPS_IP} `"sudo mkdir -p /var/backups/pos.chapibot.pro && sudo cp -r ${VPS_PATH} /var/backups/pos.chapibot.pro/backup-$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'No backup needed'`""
Invoke-Expression $backupCommand

# 3. Subir archivos usando SCP
Write-Host "📤 Subiendo archivos al servidor..." -ForegroundColor Yellow

# Crear directorio si no existe
$mkdirCommand = "ssh ${VPS_USER}@${VPS_IP} `"sudo mkdir -p ${VPS_PATH}`""
Invoke-Expression $mkdirCommand

# Subir archivos (requiere tener SCP instalado o usar WinSCP en modo consola)
$scpCommand = "scp -r ${LOCAL_BUILD_PATH}/* ${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
try {
    Invoke-Expression $scpCommand
    Write-Host "✅ Archivos subidos exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error subiendo archivos. Verifica conexión SSH y permisos." -ForegroundColor Red
    Write-Host "Comando manual: $scpCommand" -ForegroundColor Yellow
    exit 1
}

# 4. Configurar permisos
Write-Host "🔧 Configurando permisos..." -ForegroundColor Yellow
$permissionsCommand = "ssh ${VPS_USER}@${VPS_IP} `"sudo chown -R www-data:www-data ${VPS_PATH} && sudo chmod -R 755 ${VPS_PATH}`""
Invoke-Expression $permissionsCommand

# 5. Recargar nginx
Write-Host "🔄 Recargando Nginx..." -ForegroundColor Yellow
$reloadCommand = "ssh ${VPS_USER}@${VPS_IP} `"sudo nginx -t && sudo systemctl reload nginx`""
Invoke-Expression $reloadCommand

# 6. Verificar despliegue
Write-Host "🌐 Verificando despliegue..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://pos.chapibot.pro" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ¡Despliegue exitoso! La aplicación está disponible en https://pos.chapibot.pro" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  El sitio puede tardar unos minutos en estar disponible después del despliegue." -ForegroundColor Yellow
}

Write-Host "`n🎉 Despliegue completado!" -ForegroundColor Green
Write-Host "🌐 URL: https://pos.chapibot.pro" -ForegroundColor Cyan
Write-Host "📊 Panel: https://pos.chapibot.pro (credenciales: demo@blueteam.com)" -ForegroundColor Cyan

# Comandos manuales alternativos
Write-Host "`n📋 Comandos manuales alternativos:" -ForegroundColor White
Write-Host "1. Build: npm run build" -ForegroundColor Gray
Write-Host "2. Upload: scp -r dist/* ${VPS_USER}@${VPS_IP}:${VPS_PATH}/" -ForegroundColor Gray
Write-Host "3. Permisos: ssh ${VPS_USER}@${VPS_IP} 'sudo chown -R www-data:www-data ${VPS_PATH}'" -ForegroundColor Gray
Write-Host "4. Nginx: ssh ${VPS_USER}@${VPS_IP} 'sudo systemctl reload nginx'" -ForegroundColor Gray