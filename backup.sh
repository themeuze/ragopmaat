#!/bin/bash

# RAG Op Maat - Backup Script
# Dit script maakt backups van de database en documenten

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

# Backup directory
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="ragopmaat-backup-$TIMESTAMP"

echo -e "${BLUE}"
echo "=========================================="
echo "    RAG Op Maat - Backup Script"
echo "=========================================="
echo -e "${NC}"

# Maak backup directory
print_info "Maak backup directory..."
mkdir -p "$BACKUP_DIR"

# Maak backup directory voor deze backup
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH"

print_info "Start backup op $(date)"

# Database backup
print_info "Maak database backup..."
if docker-compose exec -T postgres pg_dump -U raguser ragdb > "$BACKUP_PATH/database.sql"; then
    print_success "Database backup voltooid"
else
    print_error "Database backup gefaald"
    exit 1
fi

# Documenten backup
print_info "Maak documenten backup..."
if [ -d "backend/documents" ]; then
    tar -czf "$BACKUP_PATH/documents.tar.gz" -C backend documents/
    print_success "Documenten backup voltooid"
else
    print_warning "Documenten directory niet gevonden"
fi

# Data directory backup
print_info "Maak data directory backup..."
if [ -d "data" ]; then
    tar -czf "$BACKUP_PATH/data.tar.gz" data/
    print_success "Data directory backup voltooid"
else
    print_warning "Data directory niet gevonden"
fi

# Environment file backup
print_info "Backup environment bestand..."
if [ -f ".env" ]; then
    cp .env "$BACKUP_PATH/"
    print_success "Environment backup voltooid"
else
    print_warning ".env bestand niet gevonden"
fi

# Maak backup info bestand
print_info "Maak backup info..."
cat > "$BACKUP_PATH/backup-info.txt" << EOF
RAG Op Maat Backup
==================

Backup gemaakt op: $(date)
Backup ID: $BACKUP_NAME
Docker containers: $(docker-compose ps --format "table {{.Name}}\t{{.Status}}")

Backup inhoud:
- database.sql: PostgreSQL database dump
- documents.tar.gz: Geüploade documenten
- data.tar.gz: Data directory (embeddings, etc.)
- .env: Environment configuratie

Restore instructies:
1. Stop applicatie: docker-compose down
2. Restore database: docker-compose exec -T postgres psql -U raguser ragdb < database.sql
3. Restore documenten: tar -xzf documents.tar.gz -C backend/
4. Restore data: tar -xzf data.tar.gz
5. Restart applicatie: docker-compose up -d
EOF

print_success "Backup info bestand aangemaakt"

# Maak gecomprimeerde backup
print_info "Comprimeer backup..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd ..

# Bereken backup grootte
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)

print_success "Backup voltooid!"
echo
print_info "Backup details:"
echo "  • Bestand: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "  • Grootte: $BACKUP_SIZE"
echo "  • Timestamp: $TIMESTAMP"
echo
print_info "Backup inhoud:"
echo "  • Database dump"
echo "  • Documenten"
echo "  • Data directory"
echo "  • Environment configuratie"
echo "  • Backup info"
echo
print_warning "Bewaar backups veilig en test restore procedures regelmatig!"
echo
print_success "Backup script voltooid! 💾" 