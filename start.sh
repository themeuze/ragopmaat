#!/bin/bash

echo "🚀 Starting RAG op Maat..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
echo "📦 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if Ollama is running
echo "🤖 Checking Ollama status..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not responding. Please check the logs:"
    docker-compose logs ollama
    exit 1
fi

# Download Mistral model if not already present
echo "📥 Checking Mistral model..."
if ! docker exec rag-project-ollama-1 ollama list | grep -q "mistral"; then
    echo "📥 Downloading Mistral model (this may take a while)..."
    docker exec rag-project-ollama-1 ollama pull mistral
else
    echo "✅ Mistral model already available"
fi

# Check backend health
echo "🔍 Checking backend health..."
if curl -s http://localhost:8001/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding. Please check the logs:"
    docker-compose logs backend
fi

echo ""
echo "🎉 RAG op Maat is ready!"
echo ""
echo "📱 Frontend: http://localhost:3001"
echo "🔧 API Docs: http://localhost:8001/docs"
echo "🤖 Ollama: http://localhost:11434"
echo ""
echo "📋 Next steps:"
echo "1. Open http://localhost:3001"
echo "2. Register a new account"
echo "3. Upload some documents"
echo "4. Start asking questions!"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down" 