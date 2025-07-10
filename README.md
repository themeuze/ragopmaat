# RAG Op Maat - AI Document Q&A Platform

Een geavanceerd RAG (Retrieval-Augmented Generation) platform voor document Q&A met gebruikersbeheer, abonnementen en admin functionaliteiten.

## 🚀 Features

### Core Functionaliteiten
- **Document Upload & Processing**: PDF, DOCX, TXT, Markdown ondersteuning
- **AI Q&A**: OpenAI GPT-gebaseerde vraag-antwoord systeem
- **Document Embedding**: Geavanceerde document indexering met sentence-transformers
- **Real-time Chat**: Interactieve chat interface voor document vragen

### Gebruikersbeheer & Authenticatie
- **JWT Authentication**: Veilige token-gebaseerde authenticatie
- **User Roles**: Admin en gebruiker rollen
- **User Registration/Login**: Volledig authenticatie systeem
- **Password Hashing**: Bcrypt encryptie voor wachtwoorden

### Admin Dashboard
- **Gebruikersbeheer**: Bekijk, bewerk en beheer alle gebruikers
- **Subscription Management**: Abonnement niveaus (Basic, Premium, White Label)
- **Trial Systeem**: 14-dagen gratis trial voor nieuwe gebruikers
- **User Status**: Actief/inactief status beheer
- **Trial Extensie**: Mogelijkheid om trials te verlengen

### Abonnement Systeem
- **Basic (Gratis)**: 50 documenten, 100 vragen per dag
- **Premium (€20/maand)**: Onbeperkte documenten en vragen
- **White Label (Op aanvraag)**: Volledig maatwerk voor bedrijven
- **14-Dagen Trial**: Alle nieuwe gebruikers krijgen premium functionaliteit gratis

## 💰 Abonnementen

### Basic (€11.95/maand)
- **Prijs**: €11,95 per maand
- **Documenten**: 50 uploads
- **Vragen**: 100 per dag
- **Features**: Basis AI modellen, E-mail support
- **Trial**: 14 dagen premium functionaliteit

### Premium (€23.95/maand)
- **Prijs**: €23,95 per maand
- **Documenten**: Onbeperkt
- **Vragen**: Onbeperkt
- **Features**: Premium AI modellen, Prioriteit support, API toegang, Geavanceerde analytics
- **Trial**: 14 dagen premium functionaliteit

### White Label (Op aanvraag)
- **Prijs**: Maatwerk
- **Documenten**: Onbeperkt
- **Vragen**: Onbeperkt
- **Features**: Volledig maatwerk, Eigen branding, Dedicated support, Custom integraties, SLA garantie
- **Contact**: info@ragopmaat.nl

## 🎯 Trial Systeem

Alle nieuwe gebruikers krijgen automatisch 14 dagen premium functionaliteit:
- **Onbeperkte documenten** uploaden
- **Onbeperkte vragen** stellen
- **Premium AI modellen**
- **Geen verplichting** - automatisch stoppen na trial
- **Eenvoudig upgraden** of downgraden

## 🛠️ Technische Stack

### Backend
- **FastAPI**: Moderne Python web framework
- **PostgreSQL**: Robuuste database
- **SQLAlchemy**: ORM voor database management
- **JWT**: Token-gebaseerde authenticatie
- **OpenAI API**: AI Q&A functionaliteit
- **Sentence Transformers**: Document embedding

### Frontend
- **Next.js**: React framework
- **Tailwind CSS**: Styling framework
- **JWT Decode**: Token verwerking
- **Axios**: HTTP client

### Infrastructure
- **Docker**: Containerisatie
- **Docker Compose**: Multi-container orchestration
- **PostgreSQL**: Database container

## 📋 Vereisten

- Docker en Docker Compose
- OpenAI API key
- Minimaal 4GB RAM

## 🚀 Snelle Start

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

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    tier VARCHAR DEFAULT 'basic',  -- basic, premium, white_label
    role VARCHAR DEFAULT 'user',   -- user, admin
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    trial_start_date TIMESTAMP,
    trial_end_date TIMESTAMP,
    is_trial_active BOOLEAN DEFAULT FALSE
);
```

### Documents Table
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR NOT NULL,  -- pdf, docx, md, txt
    user_id INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_processed BOOLEAN DEFAULT FALSE,
    chunk_count INTEGER DEFAULT 0
);
```

### Queries Table
```sql
CREATE TABLE queries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    question TEXT NOT NULL,
    answer TEXT,
    sources TEXT,  -- JSON string van bronnen
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Features

- **JWT Authentication**: Veilige token-gebaseerde authenticatie
- **Password Hashing**: Bcrypt encryptie voor wachtwoorden
- **CORS Protection**: Cross-origin resource sharing beveiliging
- **Input Validation**: Pydantic modellen voor data validatie
- **SQL Injection Protection**: SQLAlchemy ORM bescherming

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Registreer nieuwe gebruiker
- `POST /api/auth/login` - Login gebruiker
- `GET /api/auth/me` - Huidige gebruiker info

### Documents
- `POST /api/upload` - Upload document
- `