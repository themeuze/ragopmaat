# 🚀 RAG Op Maat - Quick Start Guide

Snelle start gids voor RAG Op Maat in 5 minuten!

## 📋 Vereisten

- Docker en Docker Compose geïnstalleerd
- OpenAI API key
- Minimaal 4GB RAM

## ⚡ Snelle Start (5 minuten)

### 1. Clone Repository
```bash
git clone <repository-url>
cd ragopmaat
```

### 2. Environment Setup
```bash
# Maak .env bestand
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

### 3. Start Applicatie
```bash
# Automatische installatie
./install.sh

# Of handmatig
docker-compose up -d --build
```

### 4. Admin Gebruiker
```bash
docker-compose exec backend python create_admin_user.py
```

### 5. Open Applicatie
- **Frontend**: http://localhost:3001
- **Admin Login**: admin@ragopmaat.nl / Admin123!

## 🎯 Eerste Stappen

### 1. Log in als Admin
- Ga naar http://localhost:3001
- Log in met admin@ragopmaat.nl / Admin123!

### 2. Upload Documenten
- Ga naar de Dashboard
- Upload PDF, DOCX, TXT of Markdown bestanden
- Wacht tot verwerking voltooid is

### 3. Stel Vragen
- Gebruik de chat interface
- Stel vragen over je documenten
- Krijg AI-gegenereerde antwoorden met bronnen

### 4. Admin Dashboard
- Klik op de Admin tab
- Bekijk en beheer gebruikers
- Configureer abonnementen en trials

## 🔧 Nuttige Commando's

```bash
# Status bekijken
docker-compose ps

# Logs bekijken
docker-compose logs -f

# Services herstarten
docker-compose restart

# Volledige cleanup
docker-compose down -v
docker system prune -af --volumes

# Backup maken
./backup.sh

# Backup herstellen
./restore.sh backups/ragopmaat-backup-YYYYMMDD-HHMMSS.tar.gz
```

## 🆘 Troubleshooting

### Probleem: OpenAI API Key Error
```bash
# Controleer .env bestand
cat .env

# Voeg API key toe
echo "OPENAI_API_KEY=your_key_here" >> .env
```

### Probleem: Containers Starten Niet
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose up -d --build
```

### Probleem: Admin Login Werkt Niet
```bash
# Maak admin opnieuw aan
docker-compose exec backend python create_admin_user.py
```

### Probleem: Frontend Niet Bereikbaar
```bash
# Check poorten
netstat -tulpn | grep :3001

# Restart frontend
docker-compose restart frontend
```

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:8001/health

# Frontend status
curl http://localhost:3001
```

### Database Status
```bash
# Check database connectie
docker-compose exec postgres psql -U raguser -d ragdb -c "SELECT COUNT(*) FROM users;"
```

## 🔒 Security Checklist

- [ ] SECRET_KEY gewijzigd in .env
- [ ] OpenAI API key ingesteld
- [ ] Firewall geconfigureerd
- [ ] SSL certificaat geïnstalleerd (productie)
- [ ] Database backups geconfigureerd

## 📈 Volgende Stappen

1. **Gebruikers Uitnodigen**: Registreer nieuwe gebruikers
2. **Documenten Uploaden**: Voeg relevante documenten toe
3. **Abonnementen Configureren**: Stel prijzen en limieten in
4. **Monitoring Setup**: Configureer logging en alerts
5. **Backup Automatiseren**: Stel automatische backups in

## 🆘 Support

- **Documentatie**: Lees de volledige README.md
- **Issues**: Open een GitHub issue
- **Logs**: `docker-compose logs -f`

---

**Veel plezier met RAG Op Maat! 🚀** 