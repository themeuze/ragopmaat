from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
from typing import List, Dict, Any, Optional
import asyncio
from db import get_db
from models import User, Query, Document
from dependencies import get_current_user
from rag.vectorstore import VectorStore
from rag.llm import OllamaLLM
from datetime import datetime

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    document_id: Optional[int] = None  # None = alle documenten, int = specifiek document

class SourceResponse(BaseModel):
    id: int
    content: str
    metadata: Dict[str, Any]
    relevance: float

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceResponse]
    source_count: int
    document_filter: Optional[str] = None
    processing_time: Optional[float] = None
    warning: Optional[str] = None

@router.post("/query", response_model=QueryResponse)
async def query_documents(
    query_request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stel een vraag over de geüploade documenten"""
    import time
    start_time = time.time()
    
    # Check user tier limits
    tier_limits = current_user.get_tier_limits()
    
    if tier_limits["queries_per_day"] != float('inf'):
        # Count queries from today
        today = datetime.utcnow().date()
        query_count = db.query(Query).filter(
            Query.user_id == current_user.id,
            Query.created_at >= today
        ).count()
        
        if query_count >= tier_limits["queries_per_day"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Daily query limit reached ({tier_limits['queries_per_day']} queries per day). Upgrade for more queries."
            )
    
    try:
        # Initialize RAG components
        vectorstore = VectorStore()
        llm = OllamaLLM()
        
        # Check if specific document is requested
        document_filter = None
        if query_request.document_id:
            # Verify document exists and belongs to user
            document = db.query(Document).filter(
                Document.id == query_request.document_id,
                Document.user_id == current_user.id
            ).first()
            
            if not document:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document not found or access denied"
                )
            
            document_filter = document.original_filename
        
        # Search for relevant documents
        sources = vectorstore.search(query_request.question, n_results=10, document_filter=document_filter)
        
        if not sources:
            if query_request.document_id:
                return QueryResponse(
                    answer=f"Ik heb geen relevante informatie gevonden in het document '{document_filter}'. Probeer een andere vraag of een ander document.",
                    sources=[],
                    source_count=0,
                    document_filter=document_filter,
                    processing_time=time.time() - start_time,
                    warning=None
                )
            else:
                return QueryResponse(
                    answer="Ik heb geen relevante informatie gevonden in je documenten. Probeer een andere vraag of upload meer documenten.",
                    sources=[],
                    source_count=0,
                    document_filter=document_filter,
                    processing_time=time.time() - start_time,
                    warning=None
                )
        
        # Generate answer with sources with timeout
        warning = None
        answer = None
        result = None
        try:
            result = await asyncio.wait_for(
                llm.generate_with_sources(query_request.question, sources),
                timeout=180.0
            )
            answer = result["answer"]
            print(f"[DEBUG] Ruwe LLM-antwoord: {answer}")
        except asyncio.TimeoutError:
            warning = "Het genereren van het antwoord duurde langer dan verwacht. Hier is een samenvatting van de gevonden bronnen."
            answer = ""  # Geen antwoord, alleen warning tonen
            print(f"[DEBUG] Timeout, geen antwoord.")
        except Exception as llm_error:
            warning = f"Er was een probleem met de AI-generatie: {str(llm_error)}. Hier is een samenvatting van de gevonden bronnen."
            answer = ""  # Geen antwoord, alleen warning tonen
            print(f"[DEBUG] Exception, geen antwoord.")
        
        processing_time = time.time() - start_time
        if processing_time > 60 and not warning:
            warning = f"Verwerking duurde {processing_time:.1f} seconden. Dit is normaal voor complexe vragen op lokale hardware."
        
        try:
            db_query = Query(
                user_id=current_user.id,
                question=query_request.question,
                answer=answer,
                sources=json.dumps(result["sources"]) if result and 'sources' in result else json.dumps([])
            )
            db.add(db_query)
            db.commit()
        except Exception as db_error:
            print(f"Warning: Could not save query to database: {db_error}")
        
        # Format sources for response, met deduplicatie
        seen = set()
        formatted_sources = []
        sources_to_format = result["sources"] if result and 'sources' in result else []
        for source in sources_to_format:
            # Maak een unieke hash op basis van content en metadata
            unique_key = (source["content"], str(source.get("metadata", {})))
            if unique_key in seen:
                continue
            seen.add(unique_key)
            formatted_sources.append(
                SourceResponse(
                    id=source["id"],
                    content=source["content"],
                    metadata=source["metadata"],
                    relevance=source["relevance"]
                )
            )
        print(f"[DEBUG] API-response: answer='{answer}', warning='{warning}', processing_time={processing_time}, sources={len(formatted_sources)} uniek")
        return QueryResponse(
            answer=answer,
            sources=formatted_sources,
            source_count=len(formatted_sources),
            document_filter=document_filter,
            processing_time=processing_time,
            warning=warning
        )
        
    except Exception as e:
        processing_time = time.time() - start_time
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing query: {str(e)}"
        )

@router.get("/queries", response_model=List[Dict[str, Any]])
def get_query_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Haal query geschiedenis op"""
    queries = db.query(Query).filter(Query.user_id == current_user.id).order_by(Query.created_at.desc()).limit(20).all()
    
    return [
        {
            "id": query.id,
            "question": query.question,
            "answer": query.answer,
            "sources": json.loads(query.sources) if query.sources else [],
            "timestamp": query.created_at.isoformat() if query.created_at else None
        }
        for query in queries
    ]

@router.delete("/queries/{query_id}")
def delete_query(
    query_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verwijder een specifieke query uit de geschiedenis"""
    query = db.query(Query).filter(
        Query.id == query_id,
        Query.user_id == current_user.id
    ).first()
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query not found or access denied"
        )
    
    db.delete(query)
    db.commit()
    
    return {"message": "Query successfully deleted"}

@router.delete("/queries")
def delete_all_queries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verwijder alle queries van de huidige gebruiker"""
    deleted_count = db.query(Query).filter(Query.user_id == current_user.id).delete()
    db.commit()
    
    return {"message": f"Successfully deleted {deleted_count} queries"}

@router.get("/subscriptions", response_model=Dict[str, Any])
def get_subscription_info():
    """Haal abonnement informatie op"""
    return {
        "tiers": [
            {
                "name": "Basic",
                "price": 11.95,
                "period": "per maand",
                "description": "Perfect om te beginnen",
                "uploads": 50,
                "queries_per_day": 100,
                "features": [
                    "50 documenten uploaden",
                    "100 vragen per dag", 
                    "Basis AI modellen",
                    "E-mail support",
                    "14 dagen gratis trial"
                ],
                "trial_days": 14,
                "trial_features": [
                    "Premium functionaliteit tijdens trial",
                    "Onbeperkte documenten",
                    "Onbeperkte vragen",
                    "Premium AI modellen"
                ]
            },
            {
                "name": "Premium",
                "price": 23.95,
                "period": "per maand", 
                "description": "Voor professionals",
                "uploads": "Onbeperkt",
                "queries_per_day": "Onbeperkt",
                "features": [
                    "Onbeperkte documenten",
                    "Onbeperkte vragen",
                    "Premium AI modellen",
                    "Prioriteit support",
                    "API toegang",
                    "Geavanceerde analytics",
                    "14 dagen gratis trial"
                ],
                "trial_days": 14,
                "trial_features": [
                    "Premium functionaliteit tijdens trial",
                    "Onbeperkte documenten", 
                    "Onbeperkte vragen",
                    "Premium AI modellen"
                ]
            },
            {
                "name": "White Label",
                "price": "Op aanvraag",
                "period": "maatwerk",
                "description": "Maatwerk oplossingen",
                "uploads": "Onbeperkt",
                "queries_per_day": "Onbeperkt", 
                "features": [
                    "Volledig maatwerk",
                    "Eigen branding",
                    "Dedicated support",
                    "Custom integraties",
                    "SLA garantie",
                    "On-site implementatie"
                ],
                "trial_days": 0,
                "trial_features": [],
                "contact_required": True
            }
        ],
        "trial_info": {
            "duration": 14,
            "description": "Beide abonnementen zijn de eerste 14 dagen volledig gratis met premium functionaliteit",
            "features": [
                "Premium functionaliteit tijdens trial",
                "Onbeperkte documenten uploaden",
                "Onbeperkte vragen stellen",
                "Premium AI modellen",
                "Geen verplichting"
            ]
        }
    } 