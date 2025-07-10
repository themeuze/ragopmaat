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
- **Basic (€11.95/maand)**: 50 documenten, 100 vragen per dag
- **Premium (€23.95/maand)**: Onbeperkte documenten en vragen
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
- **Features**: Volledig maatwerk, Eigen branding, Dedicated support, Custom integraties, SLA garantie, On-site implementatie
- **Contact**: info@ragopmaat.nl

## 🎯 Trial Systeem

Alle nieuwe gebruikers krijgen automatisch 14 dagen premium functionaliteit:
- **Onbeperkte documenten** uploaden
- **Onbeperkte vragen** stellen
- **Premium AI modellen**
- **Geen verplichting** - automatisch stoppen na trial
- **Eenvoudig upgraden** of downgraden
- **Geen creditcard vereist**

## 🛠️ Technische Stack

### Backend
- **FastAPI**: Moderne Python web framework
- **PostgreSQL**: Robuuste database
- **SQLAlchemy**: ORM voor database management
- **JWT**: Token-gebaseerde authenticatie
- **OpenAI API**: AI Q&A functionaliteit
- **Sentence Transformers**: Document embedding
- **Pydantic**: Data validatie en serialisatie

### Frontend
- **Next.js 14**: React framework
- **Tailwind CSS**: Styling framework
- **Lucide React**: Icon library
- **JWT Decode**: Token verwerking
- **Axios**: HTTP client

### Infrastructure
- **Docker**: Containerisatie
- **Docker Compose**: Multi-container orchestration
- **PostgreSQL 15**: Database container
- **Nginx**: Reverse proxy (optioneel)

## 📋 Vereisten

- Docker en Docker Compose
- OpenAI API key
- Minimaal 4GB RAM
- 10GB vrije schijfruimte

## 🚀 Snelle Start

### 1. Clone Repository
```bash
git clone https://github.com/themeuze/ragopmaat.git
cd ragopmaat
```

### 2. Automatische Installatie
```bash
# Maak script uitvoerbaar
chmod +x install.sh

# Start installatie
./install.sh
```

### 3. Handmatige Installatie
```bash
# Environment setup
cp env.example .env
# Bewerk .env en voeg je OpenAI API key toe

# Start applicatie
docker-compose up -d --build

# Maak admin gebruiker
docker-compose exec backend python create_admin_user.py
```

### 4. Open Applicatie
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
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
- **Environment Variables**: Gevoelige data buiten code

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Registreer nieuwe gebruiker
- `POST /api/auth/login` - Login gebruiker
- `GET /api/auth/me` - Huidige gebruiker info

### Documents
- `POST /api/upload` - Upload document
- `GET /api/documents` - Lijst van documenten
- `DELETE /api/documents/{id}` - Verwijder document

### Queries
- `POST /api/query` - Stel vraag over documenten
- `GET /api/queries` - Query geschiedenis

### Admin (Admin only)
- `GET /api/admin/users` - Alle gebruikers
- `PUT /api/admin/users/{id}` - Update gebruiker
- `POST /api/admin/users/{id}/extend-trial` - Verleng trial

## 🚀 Deployment

### Productie Deployment
```bash
# Gebruik deploy script
./deploy.sh

# Of handmatig
docker-compose -f docker-compose.prod.yml up -d
```

### Backup & Restore
```bash
# Backup database
./backup.sh

# Restore database
./restore.sh backup_file.sql
```

## 📝 Scripts

- `install.sh` - Volledige installatie
- `deploy.sh` - Productie deployment
- `backup.sh` - Database backup
- `restore.sh` - Database restore
- `create_admin_user.py` - Admin gebruiker aanmaken

## 🤝 Bijdragen

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je wijzigingen (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is eigendom van RAG Op Maat. Alle rechten voorbehouden.

## 📞 Contact

- **Email**: info@ragopmaat.nl
- **Website**: https://ragopmaat.nl
- **GitHub**: https://github.com/themeuze/ragopmaat

## 🔄 Changelog

### v2.0.0 (Huidig)
- ✅ JWT Authentication systeem
- ✅ PostgreSQL database integratie
- ✅ Admin dashboard met gebruikersbeheer
- ✅ Abonnement systeem (Basic, Premium, White Label)
- ✅ 14-dagen trial systeem
- ✅ Zakelijke White Label styling
- ✅ Verbeterde security features
- ✅ Backup en restore functionaliteit

### v1.0.0
- ✅ Basis RAG functionaliteit
- ✅ Document upload en processing
- ✅ AI Q&A systeem
- ✅ Frontend interface