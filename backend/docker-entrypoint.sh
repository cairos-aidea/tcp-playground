#!/bin/bash
set -e

# Create .env from .env.example if it doesn't exist
if [ ! -f /var/www/html/.env ]; then
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Override DB settings from environment variables (set by docker-compose)
# Override DB settings from environment variables (set by docker-compose)
# No need to use sed, as Laravel reads env vars directly

# Generate app key if not set or empty
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Run migrations
php artisan migrate --force

# Generate Passport encryption keys if not present
php artisan passport:keys --force 2>/dev/null || true

# Clear and cache config
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Set permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Start Apache
exec apache2-foreground
