# 🚀 Blue Team Sport Bar POS - Deploy Production Script
# Ejecutar desde el directorio client/

param(
    [string]$VpsIp = "31.97.43.51",
    [string]$VpsUser = "root",
    [string]$Domain = "pos.chapibot.pro",
    [switch]$SkipBuild = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

# Colores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "🏆 Blue Team Sport Bar POS - Despliegue en Producción"
Write-ColorOutput Cyan "Destino: https://$Domain"
Write-Output ""

# 1. Verificar prerrequisitos
Write-ColorOutput Yellow "📋 Verificando prerrequisitos..."

if (-not (Test-Path "package.json")) {
    Write-ColorOutput Red "❌ Error: No se encontró package.json. Ejecutar desde el directorio client/"
    exit 1
}

# Verificar que Node.js está instalado
try {
    $nodeVersion = node --version
    Write-ColorOutput Green "✅ Node.js: $nodeVersion"
} catch {
    Write-ColorOutput Red "❌ Error: Node.js no está instalado"
    exit 1
}

# Verificar conexión SSH
Write-ColorOutput Yellow "🔍 Verificando conexión SSH..."
$sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $VpsUser@$VpsIp "echo 'SSH OK'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Error: No se puede conectar via SSH a $VpsUser@$VpsIp"
    Write-ColorOutput Yellow "Configura la autenticación SSH primero"
    exit 1
}
Write-ColorOutput Green "✅ Conexión SSH establecida"

# 2. Build de producción (opcional)
if (-not $SkipBuild) {
    Write-ColorOutput Yellow "🏗️ Generando build de producción..."
    
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput Yellow "📦 Instalando dependencias..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput Red "❌ Error instalando dependencias"
            exit 1
        }
    }
    
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Error en el build"
        exit 1
    }
    Write-ColorOutput Green "✅ Build completado"
} else {
    Write-ColorOutput Yellow "⏭️ Saltando build (usando build existente)"
}

# Verificar que existe el build
if (-not (Test-Path "dist")) {
    Write-ColorOutput Red "❌ Error: No se encuentra la carpeta 'dist'"
    Write-ColorOutput Yellow "Ejecuta 'npm run build' primero o quita el flag -SkipBuild"
    exit 1
}

# 3. Información del build
$buildSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum / 1MB
Write-ColorOutput Green "📊 Tamaño del build: $([math]::Round($buildSize, 2)) MB"

# 4. Backup en servidor (opcional)
Write-ColorOutput Yellow "💾 Creando backup en servidor..."
$backupCmd = "mkdir -p /var/backups/pos.chapibot.pro && cp -r /var/www/pos.chapibot.pro /var/backups/pos.chapibot.pro/backup-$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'No previous version to backup'"
ssh $VpsUser@$VpsIp $backupCmd

# 5. Subir archivos
Write-ColorOutput Yellow "📤 Subiendo archivos al servidor..."

# Crear directorio si no existe
ssh $VpsUser@$VpsIp "mkdir -p /var/www/pos.chapibot.pro"

# Limpiar directorio anterior
ssh $VpsUser@$VpsIp "rm -rf /var/www/pos.chapibot.pro/*"

# Subir archivos del build
Write-ColorOutput Yellow "🔄 Transfiriendo archivos..."
scp -r "dist/*" "${VpsUser}@${VpsIp}:/var/www/pos.chapibot.pro/"
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Error subiendo archivos"
    exit 1
}

# 6. Configurar permisos
Write-ColorOutput Yellow "🔧 Configurando permisos..."
ssh $VpsUser@$VpsIp "chown -R www-data:www-data /var/www/pos.chapibot.pro && chmod -R 755 /var/www/pos.chapibot.pro"

# 7. Verificar y recargar Nginx
Write-ColorOutput Yellow "🔄 Verificando configuración Nginx..."
$nginxTest = ssh $VpsUser@$VpsIp "nginx -t" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "✅ Configuración Nginx OK"
    ssh $VpsUser@$VpsIp "systemctl reload nginx"
    Write-ColorOutput Green "✅ Nginx recargado"
} else {
    Write-ColorOutput Red "❌ Error en configuración Nginx:"
    Write-Output $nginxTest
    exit 1
}

# 8. Verificar despliegue
Write-ColorOutput Yellow "🌐 Verificando despliegue..."
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "https://$Domain" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-ColorOutput Green "✅ ¡Despliegue exitoso!"
        Write-ColorOutput Green "🌐 Aplicación disponible en: https://$Domain"
        
        # Verificar título específico
        if ($response.Content -like "*Blue Team Sport Bar*") {
            Write-ColorOutput Green "🏆 Branding Blue Team verificado"
        }
    }
} catch {
    Write-ColorOutput Red "⚠️ Advertencia: No se pudo verificar la respuesta HTTP"
    Write-ColorOutput Yellow "El sitio podría tardar unos minutos en estar completamente disponible"
}

# 9. Información post-despliegue
Write-Output ""
Write-ColorOutput Green "🎉 ¡DESPLIEGUE COMPLETADO!"
Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput White "📱 Aplicación Web: https://$Domain"
Write-ColorOutput White "🏆 Sistema: Blue Team Sport Bar POS"
Write-ColorOutput White "🔐 Demo Login: demo@blueteam.com / password123"
Write-ColorOutput White "📊 PWA: Instalable desde el navegador"
Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 10. Comandos útiles para troubleshooting
if ($Verbose) {
    Write-Output ""
    Write-ColorOutput White "🔧 Comandos útiles para troubleshooting:"
    Write-ColorOutput Gray "# Ver logs Nginx:"
    Write-ColorOutput Gray "ssh $VpsUser@$VpsIp 'tail -f /var/log/nginx/pos.chapibot.pro.access.log'"
    Write-ColorOutput Gray "ssh $VpsUser@$VpsIp 'tail -f /var/log/nginx/pos.chapibot.pro.error.log'"
    Write-ColorOutput Gray ""
    Write-ColorOutput Gray "# Verificar archivos:"
    Write-ColorOutput Gray "ssh $VpsUser@$VpsIp 'ls -la /var/www/pos.chapibot.pro/'"
    Write-ColorOutput Gray ""
    Write-ColorOutput Gray "# Recargar Nginx:"
    Write-ColorOutput Gray "ssh $VpsUser@$VpsIp 'sudo systemctl reload nginx'"
}

Write-ColorOutput Green "✨ Deploy completado exitosamente!"