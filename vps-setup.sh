#!/bin/bash
# Script de configuración completa para Blue Team Sport Bar POS
# Ejecutar en VPS Ubuntu como root

echo "🚀 Configurando Blue Team Sport Bar POS en VPS..."

# 1. Configurar SSL
echo "🔐 Configurando SSL..."
apt update
apt install certbot python3-certbot-nginx -y
certbot --nginx -d chapibot.pro -d pos.chapibot.pro --non-interactive --agree-tos --email einar2781.web@gmail.com

# 2. Crear directorio para la aplicación
echo "📁 Creando directorios..."
mkdir -p /var/www/pos.chapibot.pro
chown -R www-data:www-data /var/www/pos.chapibot.pro
chmod -R 755 /var/www/pos.chapibot.pro

# 3. Configuración Nginx optimizada para React SPA
echo "⚙️ Configurando Nginx..."
cat > /etc/nginx/sites-available/pos.chapibot.pro << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name pos.chapibot.pro;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pos.chapibot.pro;

    # SSL configuration (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/pos.chapibot.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.chapibot.pro/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Root directory
    root /var/www/pos.chapibot.pro;
    index index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;
    add_header Permissions-Policy "interest-cohort=()" always;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # PWA assets
    location /manifest.json {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Static assets with long cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Images and icons
    location ~* \.(ico|png|jpg|jpeg|gif|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker (no cache)
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # Main application - React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache HTML for short time
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public";
        }
    }

    # Error handling
    error_page 404 /index.html;
    
    # Logs
    access_log /var/log/nginx/pos.chapibot.pro.access.log;
    error_log /var/log/nginx/pos.chapibot.pro.error.log;
}
EOF

# 4. Habilitar sitio
ln -sf /etc/nginx/sites-available/pos.chapibot.pro /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 5. Configurar firewall
echo "🔥 Configurando firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo "✅ Configuración completada!"
echo "🌐 Tu aplicación estará disponible en: https://pos.chapibot.pro"
echo "📁 Directorio de archivos: /var/www/pos.chapibot.pro"
echo ""
echo "📋 Próximos pasos:"
echo "1. Subir archivos del build a /var/www/pos.chapibot.pro/"
echo "2. Configurar permisos: chown -R www-data:www-data /var/www/pos.chapibot.pro"
echo "3. Verificar funcionamiento: curl -I https://pos.chapibot.pro"