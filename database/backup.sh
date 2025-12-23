#!/bin/bash

# Database backup script
# Usage: ./backup.sh [environment]

ENVIRONMENT=${1:-development}
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${ENVIRONMENT}_vibe_db"
DB_USER="vibe_user"
DB_HOST="localhost"
DB_PORT="5432"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup filename
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

echo "Starting database backup for $ENVIRONMENT environment..."

# Perform backup with compression
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-privileges \
    | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✓ Backup completed successfully!"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $BACKUP_SIZE"
    
    # Keep only last 30 backups
    ls -1t "$BACKUP_DIR"/${DB_NAME}_*.sql.gz | tail -n +31 | xargs -r rm
    echo "  Cleaned up old backups (kept last 30)"
else
    echo "✗ Backup failed!"
    exit 1
fi

exit 0
