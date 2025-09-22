# Blue Team Sport Bar POS - VPS Deployment Script
# Deploy to pos.chapibot.pro (31.97.43.51)

param(
    [switch]$BuildOnly,
    [switch]$UploadOnly,
    [switch]$SetupSSL,
    [switch]$FullDeploy
)

# Configuration
$VPS_IP = "31.97.43.51"
$VPS_USER = "root"  # Change if using different user
$DOMAIN = "pos.chapibot.pro"
$REMOTE_PATH = "/var/www/pos.chapibot.pro"
$LOCAL_BUILD_PATH = "./client/dist"

Write-Host "🚀 Blue Team Sport Bar POS - Deployment Script" -ForegroundColor Blue
Write-Host "Target: $DOMAIN ($VPS_IP)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Yellow

function Build-Project {
    Write-Host "📦 Building project for production..." -ForegroundColor Yellow
    
    # Install dependencies if needed
    if (!(Test-Path "./client/node_modules")) {
        Write-Host "📥 Installing client dependencies..." -ForegroundColor Blue
        Set-Location client
        pnpm install
        Set-Location ..
    }
    
    # Build client for production
    Write-Host "🔨 Building client..." -ForegroundColor Blue
    Set-Location client
    pnpm run build
    Set-Location ..
    
    if (Test-Path $LOCAL_BUILD_PATH) {
        Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}

function Upload-Files {
    Write-Host "📤 Uploading files to VPS..." -ForegroundColor Yellow
    
    # Create remote directory if it doesn't exist
    ssh $VPS_USER@$VPS_IP "mkdir -p $REMOTE_PATH"
    
    # Upload build files
    Write-Host "📤 Uploading build files..." -ForegroundColor Blue
    scp -r "$LOCAL_BUILD_PATH/*" $VPS_USER@$VPS_IP:$REMOTE_PATH/
    
    # Set proper permissions
    ssh $VPS_USER@$VPS_IP "chown -R www-data:www-data $REMOTE_PATH && chmod -R 755 $REMOTE_PATH"
    
    Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
}

function Setup-SSL {
    Write-Host "🔐 Setting up SSL with Let's Encrypt..." -ForegroundColor Yellow
    
    $sslSetupScript = @"
#!/bin/bash
echo "🔐 Setting up SSL for $DOMAIN..."

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📥 Installing certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Generate SSL certificate
echo "🔒 Generating SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email einar2781@gmail.com

# Test automatic renewal
echo "🔄 Testing automatic renewal..."
certbot renew --dry-run

echo "✅ SSL setup completed!"
"@
    
    # Upload and execute SSL setup script
    $sslSetupScript | ssh $VPS_USER@$VPS_IP "cat > /tmp/ssl-setup.sh && chmod +x /tmp/ssl-setup.sh && /tmp/ssl-setup.sh"
    
    Write-Host "✅ SSL configured successfully!" -ForegroundColor Green
}

function Update-NginxConfig {
    Write-Host "⚙️ Updating Nginx configuration..." -ForegroundColor Yellow
    
    $nginxConfig = @"
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA;
    ssl_prefer_server_ciphers on;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Document root
    root $REMOTE_PATH;
    index index.html index.htm;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy (if backend is needed)
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|log|config)$ {
        deny all;
    }
}
"@
    
    # Upload nginx configuration
    $nginxConfig | ssh $VPS_USER@$VPS_IP "cat > /etc/nginx/sites-available/$DOMAIN"
    
    # Enable site and reload nginx
    ssh $VPS_USER@$VPS_IP "ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"
    
    Write-Host "✅ Nginx configuration updated!" -ForegroundColor Green
}

function Test-Deployment {
    Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "https://$DOMAIN" -Method HEAD -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Site is accessible at https://$DOMAIN" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Site responded with status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Site is not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution logic
try {
    if ($BuildOnly) {
        Build-Project
    } elseif ($UploadOnly) {
        Upload-Files
    } elseif ($SetupSSL) {
        Setup-SSL
    } elseif ($FullDeploy) {
        Build-Project
        Upload-Files
        Update-NginxConfig
        Setup-SSL
        Test-Deployment
    } else {
        # Default: Build and Upload
        Build-Project
        Upload-Files
        Test-Deployment
    }
    
    Write-Host ""
    Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
    Write-Host "🌐 Visit: https://$DOMAIN" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
"@

# Usage examples
Write-Host ""
Write-Host "📝 Usage examples:" -ForegroundColor Blue
Write-Host "  .\deploy-to-vps.ps1                 # Build and upload"
Write-Host "  .\deploy-to-vps.ps1 -BuildOnly      # Only build"
Write-Host "  .\deploy-to-vps.ps1 -UploadOnly     # Only upload"
Write-Host "  .\deploy-to-vps.ps1 -SetupSSL       # Only setup SSL"
Write-Host "  .\deploy-to-vps.ps1 -FullDeploy     # Complete deployment"