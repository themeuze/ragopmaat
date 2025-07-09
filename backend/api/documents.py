from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import shutil
from typing import List
from db import get_db
from models import User, Document
from dependencies import get_current_user
from rag.document_processor import DocumentProcessor
from rag.vectorstore import VectorStore

router = APIRouter()

class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    uploaded_at: str
    is_processed: bool
    chunk_count: int

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload een document"""
    # Check file type
    allowed_types = ['.pdf', '.docx', '.md', '.txt']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_extension} not supported. Allowed: {allowed_types}"
        )
    
    # Check user tier limits
    if current_user.tier == "free":
        doc_count = db.query(Document).filter(Document.user_id == current_user.id).count()
        if doc_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free tier limit reached (3 documents). Upgrade to upload more."
            )
    
    # Create documents directory if it doesn't exist
    os.makedirs("/app/documents", exist_ok=True)
    
    # Save file
    filename = f"{current_user.id}_{file.filename}"
    file_path = f"/app/documents/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Create document record
    db_document = Document(
        filename=filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file_extension[1:],  # Remove the dot
        user_id=current_user.id
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Process document in background (simplified for now)
    try:
        print(f"Starting document processing for {file_path}")
        processor = DocumentProcessor()
        vectorstore = VectorStore()
        
        # Process document
        chunks = processor.process_document(file_path, file_extension[1:])
        print(f"Document processing completed, got {len(chunks)} chunks")
        
        if chunks:
            # Add to vectorstore
            documents = [chunk['content'] for chunk in chunks]
            metadatas = [chunk['metadata'] for chunk in chunks]
            ids = [chunk['id'] for chunk in chunks]
            
            print(f"Adding {len(documents)} chunks to vectorstore")
            vectorstore.add_documents(documents, metadatas, ids)
            
            # Update document record
            db_document.is_processed = True
            db_document.chunk_count = len(chunks)
            db.commit()
            print(f"Document marked as processed with {len(chunks)} chunks")
        else:
            print("No chunks generated from document")
        
    except Exception as e:
        print(f"Error processing document: {e}")
        # Document is saved but not processed
    
    return DocumentResponse(
        id=db_document.id,
        filename=db_document.filename,
        original_filename=db_document.original_filename,
        file_size=db_document.file_size,
        file_type=db_document.file_type,
        uploaded_at=db_document.uploaded_at.isoformat(),
        is_processed=db_document.is_processed,
        chunk_count=db_document.chunk_count
    )

@router.get("/documents", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Haal alle documenten op van de gebruiker"""
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    
    return [
        DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            original_filename=doc.original_filename,
            file_size=doc.file_size,
            file_type=doc.file_type,
            uploaded_at=doc.uploaded_at.isoformat(),
            is_processed=doc.is_processed,
            chunk_count=doc.chunk_count
        )
        for doc in documents
    ]

@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verwijder een document"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"} 