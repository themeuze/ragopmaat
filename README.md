# RAG op Maat

Volledige RAG applicatie met FastAPI backend en Next.js frontend.

## Quick Start

1. **Start met Docker:**
```bash
docker-compose up -d
```

2. **Download Mistral model:**
```bash
docker exec -it rag-project-ollama-1 ollama pull mistral
```

3. **Open applicatie:**
- Frontend: http://localhost:3001
- API Docs: http://localhost:8001/docs

## Features

- Document upload (PDF, DOCX, MD, TXT)
- AI chat met bronnen
- User management
- Abonnementen (Free/Basic/Premium)
- Local LLM met Ollama

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, ChromaDB
- **Frontend**: Next.js, Tailwind CSS
- **AI**: Ollama (Mistral)
- **Database**: SQLite (productie: PostgreSQL)

## 🚀 Features

- **Document Upload**: Ondersteunt PDF, DOCX, MD en TXT bestanden
- **AI Chat**: Stel vragen over je documenten en krijg antwoorden met bronnen
- **Vector Database**: ChromaDB voor efficiënte document retrieval
- **User Management**: Registratie, login en abonnementen
- **Modern UI**: React frontend met Tailwind CSS
- **Local LLM**: Integratie met Ollama voor lokale AI verwerking

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Moderne Python web framework
- **SQLAlchemy** - Database ORM
- **ChromaDB** - Vector database
- **Ollama** - Lokale LLM (Mistral)
- **JWT** - Authenticatie

### Frontend
- **Next.js** - React framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📋 Vereisten

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optioneel)
- Ollama geïnstalleerd

## 🛠️ Setup

### Optie 1: Docker (Aanbevolen)

1. **Clone de repository**
```bash
git clone <repository-url>
cd rag-project
```

2. **Start met Docker Compose**
```bash
docker-compose up -d
```

3. **Download Mistral model**
```bash
docker exec -it rag-project-ollama-1 ollama pull mistral
```

4. **Open de applicatie**
- Frontend: http://localhost:3001
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

### Optie 2: Lokale Setup

1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Op Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Frontend Setup**
```bash
cd frontend
npm install
```

3. **Start Ollama**
```bash
ollama serve
ollama pull mistral
```

4. **Start Backend**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

5. **Start Frontend**
```bash
cd frontend
npm run dev
```

## 📁 Project Structuur

```
rag-project/
├── backend/
│   ├── api/           # API endpoints
│   ├── rag/           # RAG components
│   ├── models.py      # Database models
│   ├── auth.py        # Authentication
│   ├── db.py          # Database config
│   └── main.py        # FastAPI app
├── frontend/
│   ├── pages/         # Next.js pages
│   ├── components/    # React components
│   └── styles/        # CSS styles
├── data/              # ChromaDB data
└── docker-compose.yml # Docker setup
```

## 🔧 Configuratie

### Environment Variables

Kopieer `env.example` naar `.env` en pas aan:

```bash
# Backend
SECRET_KEY=your-super-secret-key
DATABASE_URL=sqlite:///./rag_app.db
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## 🎯 Gebruik

1. **Registreer een account** op http://localhost:3001
2. **Upload documenten** (PDF, DOCX, MD, TXT)
3. **Stel vragen** over je documenten
4. **Bekijk bronnen** en antwoorden

## 💰 Abonnementen

- **Free**: 3 documenten, 5 vragen/dag
- **Basic** (€5/maand): 100 documenten, 30 vragen/dag
- **Premium** (€20/maand): Onbeperkt gebruik

## 🔒 Beveiliging

- JWT authenticatie
- Password hashing met bcrypt
- Rate limiting
- Input validatie
- CORS configuratie

## 🚀 Deployment

### Productie Setup

1. **Pas environment variables aan**
2. **Gebruik PostgreSQL in plaats van SQLite**
3. **Configureer reverse proxy (nginx)**
4. **Setup SSL certificaten**
5. **Configureer monitoring**

### Docker Production

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## 🐛 Troubleshooting

### Ollama niet bereikbaar
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

### Database errors
```bash
# Reset database
rm backend/rag_app.db
# Restart backend
```

### Frontend build errors
```bash
# Clear cache
rm -rf frontend/.next
npm run build
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Registreer gebruiker
- `POST /api/auth/login` - Login gebruiker
- `GET /api/auth/me` - Huidige gebruiker

### Documents
- `POST /api/upload` - Upload document
- `GET /api/documents` - Lijst documenten
- `DELETE /api/documents/{id}` - Verwijder document

### Query
- `POST /api/query` - Stel vraag
- `GET /api/queries` - Query geschiedenis
- `GET /api/subscriptions` - Abonnement info

## 🤝 Bijdragen

1. Fork de repository
2. Maak een feature branch
3. Commit je wijzigingen
4. Push naar de branch
5. Open een Pull Request

## 📄 Licentie

MIT License - zie LICENSE bestand voor details.

## 🆘 Support

Voor vragen of problemen:
- Open een GitHub issue
- Neem contact op via email
- Bekijk de API documentatie op `/docs`

---

**Gebouwd met ❤️ voor de Nederlandse markt** 