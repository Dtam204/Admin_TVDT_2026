#!/bin/bash

# Script backup database
# Usage: ./scripts/backup-db.sh

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo "📦 Backing up database..."

# Backup database
docker-compose exec -T postgres pg_dump -U postgres library_tn | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Backup created: $BACKUP_FILE"
  
  # Remove backups older than 7 days
  find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
  echo "🧹 Cleaned up old backups (>7 days)"
else
  echo "❌ Backup failed!"
  exit 1
fi

