#!/bin/bash

# RAG Op Maat - Productie Deployment Script
# Dit script configureert de applicatie voor productie deployment

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
echo "    RAG Op Maat - Productie Deployment"
echo "=========================================="
echo -e "${NC}"

# Check of we in productie modus zijn
if [ "$1" != "--production" ]; then
    print_error "Dit script is voor productie deployment. Gebruik: ./deploy.sh --production"
    exit 1
fi

# Security checks
print_info "Voer security checks uit..."

# Check of SECRET_KEY is gewijzigd
if grep -q "your-secret-key-change-this" .env; then
    print_error "SECRET_KEY moet gewijzigd worden voor productie!"
    print_info "Wijzig SECRET_KEY in .env bestand"
    exit 1
fi

# Check of OpenAI API key is ingesteld
if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=$" .env; then
    print_error "OpenAI API key is niet ingesteld!"
    exit 1
fi

print_success "Security checks geslaagd"

# Backup bestaande data
print_info "Maak backup van bestaande data..."
if [ -d "data" ]; then
    tar -czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" data/
    print_success "Backup gemaakt"
fi

# Stop bestaande services
print_info "Stop bestaande services..."
docker-compose down

# Cleanup oude images
print_info "Cleanup oude Docker images..."
docker system prune -af --volumes

# Build en start met productie configuratie
print_info "Build en start productie services..."
docker-compose up -d --build

# Wacht tot services draaien
print_info "Wacht tot services volledig gestart zijn..."
sleep 45

# Health checks
print_info "Voer health checks uit..."

# Check backend
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    print_success "Backend health check geslaagd"
else
    print_error "Backend health check gefaald"
    docker-compose logs backend
    exit 1
fi

# Check frontend
if curl -s http://localhost:3001 > /dev/null; then
    print_success "Frontend is bereikbaar"
else
    print_warning "Frontend is nog niet bereikbaar (kan nog opstarten)"
fi

# Admin gebruiker aanmaken/controleren
print_info "Controleer admin gebruiker..."
if docker-compose exec -T backend python create_admin_user.py; then
    print_success "Admin gebruiker gecontroleerd/aangemaakt"
fi

# Security recommendations
echo -e "${YELLOW}"
echo "=========================================="
echo "    Security Aanbevelingen"
echo "=========================================="
echo -e "${NC}"

print_warning "Voor productie deployment, overweeg:"
echo "  • SSL certificaat installeren (Let's Encrypt)"
echo "  • Reverse proxy configureren (nginx)"
echo "  • Firewall regels instellen"
echo "  • Database backups automatiseren"
echo "  • Monitoring en logging setup"
echo "  • Rate limiting configureren"
echo "  • Environment variables in secrets management"

# Success bericht
echo -e "${GREEN}"
echo "=========================================="
echo "    Deployment Voltooid!"
echo "=========================================="
echo -e "${NC}"

print_success "RAG Op Maat is succesvol gedeployed!"
echo
print_info "Toegang tot de applicatie:"
echo "  • Frontend: http://your-server-ip:3001"
echo "  • Backend API: http://your-server-ip:8001"
echo "  • API Docs: http://your-server-ip:8001/docs"
echo
print_info "Admin login:"
echo "  • Email: admin@ragopmaat.nl"
echo "  • Wachtwoord: Admin123!"
echo
print_info "Monitoring commando's:"
echo "  • Status: docker-compose ps"
echo "  • Logs: docker-compose logs -f"
echo "  • Restart: docker-compose restart"
echo "  • Update: git pull && ./deploy.sh --production"
echo
print_warning "Vergeet niet om SSL te configureren voor HTTPS!"
echo
print_success "Productie deployment voltooid! 🚀" 