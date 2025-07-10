#!/bin/bash

# RAG Op Maat - Restore Script
# Dit script herstelt backups van de database en documenten

set -e

# Kleuren voor output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}"
echo "=========================================="
echo "    RAG Op Maat - Restore Script"
echo "=========================================="
echo -e "${NC}"

# Check argumenten
if [ $# -eq 0 ]; then
    print_error "Gebruik: ./restore.sh <backup-file.tar.gz>"
    echo
    print_info "Beschikbare backups:"
    if [ -d "backups" ]; then
        ls -la backups/*.tar.gz 2>/dev/null || print_warning "Geen backups gevonden"
    else
        print_warning "Backups directory niet gevonden"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# Check of backup bestand bestaat
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup bestand niet gevonden: $BACKUP_FILE"
    exit 1
fi

print_info "Start restore van: $BACKUP_FILE"

# Backup directory
BACKUP_DIR="./backups"
RESTORE_DIR="$BACKUP_DIR/restore-temp"

# Maak restore directory
print_info "Maak restore directory..."
rm -rf "$RESTORE_DIR"
mkdir -p "$RESTORE_DIR"

# Extract backup
print_info "Extract backup bestand..."
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Zoek backup directory
BACKUP_NAME=$(ls "$RESTORE_DIR")
RESTORE_PATH="$RESTORE_DIR/$BACKUP_NAME"

if [ ! -d "$RESTORE_PATH" ]; then
    print_error "Ongeldige backup structuur"
    exit 1
fi

print_info "Backup gevonden: $BACKUP_NAME"

# Toon backup info
if [ -f "$RESTORE_PATH/backup-info.txt" ]; then
    print_info "Backup informatie:"
    cat "$RESTORE_PATH/backup-info.txt"
    echo
fi

# Bevestiging
print_warning "Dit zal alle huidige data vervangen!"
read -p "Weet je zeker dat je wilt doorgaan? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Restore geannuleerd"
    rm -rf "$RESTORE_DIR"
    exit 0
fi

# Stop applicatie
print_info "Stop applicatie..."
docker-compose down

# Restore database
print_info "Restore database..."
if [ -f "$RESTORE_PATH/database.sql" ]; then
    # Start alleen postgres voor restore
    docker-compose up -d postgres
    sleep 10
    
    # Restore database
    docker-compose exec -T postgres psql -U raguser -d ragdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    docker-compose exec -T postgres psql -U raguser ragdb < "$RESTORE_PATH/database.sql"
    print_success "Database restore voltooid"
else
    print_warning "Database backup niet gevonden"
fi

# Restore documenten
print_info "Restore documenten..."
if [ -f "$RESTORE_PATH/documents.tar.gz" ]; then
    rm -rf backend/documents
    tar -xzf "$RESTORE_PATH/documents.tar.gz" -C backend/
    print_success "Documenten restore voltooid"
else
    print_warning "Documenten backup niet gevonden"
fi

# Restore data directory
print_info "Restore data directory..."
if [ -f "$RESTORE_PATH/data.tar.gz" ]; then
    rm -rf data
    tar -xzf "$RESTORE_PATH/data.tar.gz"
    print_success "Data directory restore voltooid"
else
    print_warning "Data directory backup niet gevonden"
fi

# Restore environment (optioneel)
if [ -f "$RESTORE_PATH/.env" ]; then
    print_warning "Environment backup gevonden. Wil je deze herstellen? (y/N): "
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "$RESTORE_PATH/.env" .env.backup
        print_success "Environment backup gemaakt als .env.backup"
    fi
fi

# Start applicatie
print_info "Start applicatie..."
docker-compose up -d

# Wacht tot services draaien
print_info "Wacht tot services volledig gestart zijn..."
sleep 30

# Health check
print_info "Voer health check uit..."
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    print_success "Health check geslaagd"
else
    print_warning "Health check gefaald (kan nog opstarten)"
fi

# Cleanup
print_info "Cleanup restore directory..."
rm -rf "$RESTORE_DIR"

# Success bericht
echo -e "${GREEN}"
echo "=========================================="
echo "    Restore Voltooid!"
echo "=========================================="
echo -e "${NC}"

print_success "Backup succesvol hersteld!"
echo
print_info "Toegang tot de applicatie:"
echo "  • Frontend: http://localhost:3001"
echo "  • Backend API: http://localhost:8001"
echo "  • API Docs: http://localhost:8001/docs"
echo
print_info "Controleer of alle data correct is hersteld"
echo
print_success "Restore script voltooid! 🔄" 