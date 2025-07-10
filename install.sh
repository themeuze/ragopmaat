#!/bin/bash

# RAG Op Maat - Installatie Script
# Dit script installeert en configureert de volledige RAG Op Maat applicatie

set -e  # Stop bij errors

# Kleuren voor output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Header
echo -e "${BLUE}"
echo "=========================================="
echo "    RAG Op Maat - Installatie Script"
echo "=========================================="
echo -e "${NC}"

# Check vereisten
print_info "Controleer vereisten..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is niet geïnstalleerd. Installeer Docker eerst."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is niet geïnstalleerd. Installeer Docker Compose eerst."
    exit 1
fi

# Check Docker daemon
if ! docker info &> /dev/null; then
    print_error "Docker daemon draait niet. Start Docker eerst."
    exit 1
fi

print_success "Alle vereisten zijn aanwezig"

# Environment file setup
print_info "Setup environment bestand..."

if [ ! -f .env ]; then
    print_warning ".env bestand niet gevonden. Maak een nieuw bestand aan..."
    
    # Vraag om OpenAI API key
    echo -n "Voer je OpenAI API key in: "
    read -s OPENAI_API_KEY
    echo
    
    if [ -z "$OPENAI_API_KEY" ]; then
        print_error "OpenAI API key is verplicht!"
        exit 1
    fi
    
    # Maak .env bestand
    cat > .env << EOF
# OpenAI API Key (verplicht)
OPENAI_API_KEY=$OPENAI_API_KEY

# Optioneel: Aangepaste configuratie
SECRET_KEY=your-secret-key-change-this-in-production
EOF
    
    print_success ".env bestand aangemaakt"
else
    print_info ".env bestand bestaat al"
fi

# Check of OpenAI API key is ingesteld
if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=$" .env; then
    print_error "OpenAI API key is niet ingesteld in .env bestand"
    exit 1
fi

# Docker cleanup (optioneel)
print_info "Docker cleanup uitvoeren..."
read -p "Wil je bestaande containers/images opruimen? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Voer Docker cleanup uit..."
    docker-compose down -v 2>/dev/null || true
    docker system prune -af --volumes 2>/dev/null || true
    print_success "Docker cleanup voltooid"
fi

# Build en start applicatie
print_info "Start applicatie build en deployment..."

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
    docker-compose logs
    exit 1
fi

print_success "Alle containers draaien"

# Admin gebruiker aanmaken
print_info "Maak admin gebruiker aan..."
if docker-compose exec -T backend python create_admin_user.py; then
    print_success "Admin gebruiker aangemaakt"
else
    print_warning "Admin gebruiker kon niet aangemaakt worden (mogelijk bestaat al)"
fi

# Finale status check
print_info "Voer finale status check uit..."

# Check backend
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    print_success "Backend is bereikbaar"
else
    print_warning "Backend is nog niet bereikbaar (kan nog opstarten)"
fi

# Check frontend
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend is bereikbaar"
else
    print_warning "Frontend is nog niet bereikbaar (kan nog opstarten)"
fi

# Success bericht
echo -e "${GREEN}"
echo "=========================================="
echo "    Installatie Voltooid!"
echo "=========================================="
echo -e "${NC}"

print_success "RAG Op Maat is succesvol geïnstalleerd!"
echo
print_info "Toegang tot de applicatie:"
echo "  • Frontend: http://localhost:3001"
echo "  • Backend API: http://localhost:8001"
echo "  • API Docs: http://localhost:8001/docs"
echo
print_info "Admin login gegevens:"
echo "  • Email: admin@ragopmaat.nl"
echo "  • Wachtwoord: Admin123!"
echo
print_info "Nuttige commando's:"
echo "  • Logs bekijken: docker-compose logs -f"
echo "  • Services stoppen: docker-compose down"
echo "  • Services herstarten: docker-compose restart"
echo "  • Volledige cleanup: docker-compose down -v && docker system prune -af --volumes"
echo
print_warning "Vergeet niet om de SECRET_KEY in .env te wijzigen voor productie!"
echo
print_success "Veel plezier met RAG Op Maat! 🚀" 