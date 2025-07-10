# RAG op Maat

## Features
- FastAPI backend met PostgreSQL
- Next.js frontend
- JWT authenticatie, gebruikersrollen, abonnementen
- Document upload, bulk upload (admin)
- RAG Q&A met OpenAI/HuggingFace
- Admin dashboard met tabs: Overzicht, Gebruikers, Documenten, Bulk Upload

## Installatie

### 1. Vereisten
- Docker & Docker Compose
- `.env` bestand met juiste variabelen:
  - `DATABASE_URL=postgresql://user:password@postgres:5432/dbname`
  - `OPENAI_API_KEY=sk-...` (optioneel)
  - `HUGGINGFACE_API_KEY=hf_...` (optioneel)

### 2. Build & Start
```bash
docker-compose down
# (Pas eventueel .env aan)
docker-compose build --no-cache frontend
# Start eerst de database
docker-compose up -d postgres
# Wacht 10 seconden, dan:
docker-compose up -d backend frontend
```

### 3. Troubleshooting
- **Database errors:**
  - Zorg dat de service in `docker-compose.yml` exact `postgres` heet
  - Start eerst de database, dan de backend
  - Controleer je `DATABASE_URL` in `.env`
- **Frontend laadt oude code:**
  - Voer een build uit met `--no-cache`
  - Harde refresh in browser (Ctrl+Shift+R)
- **API keys:**
  - Voeg toe aan `.env` en herstart containers

### 4. Admin Dashboard
- Ga naar `/admin` als admin gebruiker
- Tabs: Overzicht, Gebruikers, Documenten, Bulk Upload
- Alleen admins zien bulk upload

### 5. Bulk Upload
- Alleen via admin dashboard
- Selecteer meerdere bestanden (PDF, DOCX, TXT, MD)
- Resultaten en statistieken na upload

---

## Scripts

### `install.sh`
```bash
#!/bin/bash
set -e
cp .env.example .env || true
docker-compose down
docker-compose build --no-cache frontend
# Start database eerst
docker-compose up -d postgres
sleep 10
docker-compose up -d backend frontend
```

### `rebuild.sh`
```bash
#!/bin/bash
set -e
docker-compose down
docker-compose build --no-cache frontend
# Start database eerst
docker-compose up -d postgres
sleep 10
docker-compose up -d backend frontend
```

---

## Veelvoorkomende Problemen
- **Login werkt niet:** Backend kan database niet vinden. Start database eerst, controleer `DATABASE_URL`.
- **Geen admin tabs:** Frontend build is niet up-to-date. Rebuild met `--no-cache` en refresh browser.
- **API key errors:** Voeg keys toe aan `.env` en herstart containers.