#!/bin/bash
set -e
docker-compose down
docker-compose build --no-cache frontend
# Start database eerst
docker-compose up -d postgres
sleep 10
docker-compose up -d backend frontend 