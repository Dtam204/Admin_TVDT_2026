#!/bin/bash

# Script deploy tự động lên VPS
# Usage: ./scripts/deploy.sh [production|staging]

set -e

ENV=${1:-production}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENV" = "production" ]; then
  COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
fi

echo "🚀 Deploying SFB Website ($ENV)..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "📝 Please copy env.example to .env and configure it"
  exit 1
fi

# Build images
echo "🔨 Building Docker images..."
docker-compose -f $COMPOSE_FILE build

# Start services
echo "🚀 Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check status
echo "📊 Service status:"
docker-compose ps

echo "✅ Deployment complete!"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"

