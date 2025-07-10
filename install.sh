#!/bin/bash

# RAG Op Maat - Installatie Script v2.0
# Dit script installeert en configureert de volledige RAG Op Maat applicatie

set -e  # Stop bij errors

# Kleuren voor output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functies voor output
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

print_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

# Header
echo -e "${CYAN}"
echo "=========================================="
echo "    RAG Op Maat - Installatie Script v2.0"
echo "=========================================="
echo -e "${NC}"

print_header "Welkom bij RAG Op Maat!"
print_info "Dit script installeert de volledige RAG Op Maat applicatie"
print_info "Inclusief: Backend (FastAPI), Frontend (Next.js), Database (PostgreSQL)"
echo

# Check vereisten
print_header "Stap 1: Controleer vereisten..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is niet geïnstalleerd."
    print_info "Installeer Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is niet geïnstalleerd."
    print_info "Installeer Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check Docker daemon
if ! docker info &> /dev/null; then
    print_error "Docker daemon draait niet."
    print_info "Start Docker en probeer opnieuw."
    exit 1
fi

# Check systeem resources
print_info "Controleer systeem resources..."
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
if [ "$TOTAL_MEM" -lt 4 ]; then
    print_warning "Aanbevolen: minimaal 4GB RAM (huidig: ${TOTAL_MEM}GB)"
    read -p "Doorgaan? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_success "Alle vereisten zijn aanwezig"
echo

# Environment file setup
print_header "Stap 2: Setup environment bestand..."

if [ ! -f .env ]; then
    print_warning ".env bestand niet gevonden. Maak een nieuw bestand aan..."
    
    # Vraag om OpenAI API key
    echo -n "Voer je OpenAI API key in: "
    read -s OPENAI_API_KEY
    echo
    
    if [ -z "$OPENAI_API_KEY" ]; then
        print_error "OpenAI API key is verplicht!"
        print_info "Krijg een API key op: https://platform.openai.com/api-keys"
        exit 1
    fi
    
    # Genereer secret key
    SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || echo "your-secret-key-change-this-in-production")
    
    # Maak .env bestand
    cat > .env << EOF
# OpenAI API Key (verplicht)
OPENAI_API_KEY=$OPENAI_API_KEY

# JWT Secret Key (automatisch gegenereerd)
SECRET_KEY=$SECRET_KEY

# Database configuratie
DATABASE_URL=postgresql://ragopmaat:ragopmaat@postgres:5432/ragopmaat

# Frontend configuratie
NEXT_PUBLIC_API_URL=http://localhost:8001

# Optioneel: Hugging Face API Key
HUGGINGFACE_API_KEY=
EOF
    
    print_success ".env bestand aangemaakt"
else
    print_info ".env bestand bestaat al"
    
    # Check of OpenAI API key is ingesteld
    if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=$" .env; then
        print_error "OpenAI API key is niet ingesteld in .env bestand"
        print_info "Bewerk .env en voeg je OpenAI API key toe"
        exit 1
    fi
fi

# Docker cleanup (optioneel)
print_header "Stap 3: Docker cleanup (optioneel)..."

read -p "Wil je bestaande containers/images opruimen? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Voer Docker cleanup uit..."
    docker-compose down -v 2>/dev/null || true
    docker system prune -af --volumes 2>/dev/null || true
    print_success "Docker cleanup voltooid"
fi

# Build en start applicatie
print_header "Stap 4: Build en start applicatie..."

# Pull latest images
print_info "Download Docker images..."
docker-compose pull

# Build en start
print_info "Build en start containers..."
docker-compose up -d --build

# Wacht tot containers draaien
print_info "Wacht tot containers volledig gestart zijn..."
sleep 30

# Check container status
print_info "Controleer container status..."
if ! docker-compose ps | grep -q "Up"; then
    print_error "Containers zijn niet correct gestart"
    print_info "Bekijk logs voor meer informatie:"
    docker-compose logs --tail=50
    exit 1
fi

print_success "Alle containers draaien"
echo

# Database setup
print_header "Stap 5: Database setup..."

# Wacht tot database klaar is
print_info "Wacht tot database klaar is..."
sleep 10

# Check database connectie
if docker-compose exec -T backend python -c "from db import get_db; next(get_db())" 2>/dev/null; then
    print_success "Database connectie succesvol"
else
    print_warning "Database connectie kon niet worden getest (kan nog opstarten)"
fi

# Admin gebruiker aanmaken
print_info "Maak admin gebruiker aan..."
if docker-compose exec -T backend python create_admin_user.py; then
    print_success "Admin gebruiker aangemaakt"
else
    print_warning "Admin gebruiker kon niet aangemaakt worden (mogelijk bestaat al)"
fi

# Finale status check
print_header "Stap 6: Finale status check..."

# Check backend
print_info "Test backend connectie..."
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    print_success "Backend is bereikbaar"
else
    print_warning "Backend is nog niet bereikbaar (kan nog opstarten)"
fi

# Check frontend
print_info "Test frontend connectie..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend is bereikbaar"
else
    print_warning "Frontend is nog niet bereikbaar (kan nog opstarten)"
fi

# Success bericht
echo -e "${GREEN}"
echo "=========================================="
echo "    Installatie Voltooid! 🎉"
echo "=========================================="
echo -e "${NC}"

print_success "RAG Op Maat is succesvol geïnstalleerd!"
echo
print_header "Toegang tot de applicatie:"
echo "  • Frontend: http://localhost:3001"
echo "  • Backend API: http://localhost:8001"
echo "  • API Docs: http://localhost:8001/docs"
echo
print_header "Admin login gegevens:"
echo "  • Email: admin@ragopmaat.nl"
echo "  • Wachtwoord: Admin123!"
echo
print_header "Nuttige commando's:"
echo "  • Logs bekijken: docker-compose logs -f"
echo "  • Services stoppen: docker-compose down"
echo "  • Services herstarten: docker-compose restart"
echo "  • Volledige cleanup: docker-compose down -v && docker system prune -af --volumes"
echo "  • Backup database: ./backup.sh"
echo "  • Restore database: ./restore.sh backup_file.sql"
echo
print_header "Features:"
echo "  • 14-dagen gratis trial voor nieuwe gebruikers"
echo "  • Basic (€11.95/maand): 50 documenten, 100 vragen/dag"
echo "  • Premium (€23.95/maand): Onbeperkt"
echo "  • White Label: Maatwerk voor bedrijven"
echo
print_warning "Vergeet niet om de SECRET_KEY in .env te wijzigen voor productie!"
print_warning "Backup je database regelmatig met: ./backup.sh"
echo
print_success "Veel plezier met RAG Op Maat! 🚀"
print_info "Voor support: info@ragopmaat.nl" 