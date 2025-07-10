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
    tier_limits = current_user.get_tier_limits()
    doc_count = db.query(Document).filter(Document.user_id == current_user.id).count()
    
    if tier_limits["documents"] != float('inf') and doc_count >= tier_limits["documents"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Document limit reached ({tier_limits['documents']} documents). Upgrade to upload more."
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
    
    # Process document in background (asynchronous)
    try:
        print(f"Starting document processing for {file_path}")
        processor = DocumentProcessor()
        vectorstore = VectorStore()
        
        # Process document - new processor returns list of strings
        chunks = processor.process_document(file_path)
        print(f"Document processing completed, got {len(chunks)} chunks")
        
        if chunks:
            # Create metadata for each chunk
            metadatas = []
            for i, chunk in enumerate(chunks):
                metadata = {
                    'file_path': file_path,
                    'filename': filename,
                    'original_filename': file.filename,
                    'chunk': i + 1,
                    'user_id': current_user.id,
                    'upload_date': db_document.uploaded_at.isoformat()
                }
                metadatas.append(metadata)
            
            # Add to vectorstore
            print(f"Adding {len(chunks)} chunks to vectorstore")
            for i, chunk in enumerate(chunks):
                vectorstore.add_document(chunk, metadatas[i])
            
            # Update document record
            db_document.is_processed = True
            db_document.chunk_count = len(chunks)
            db.commit()
            print(f"Document marked as processed with {len(chunks)} chunks")
        else:
            print("No chunks generated from document")
            # Mark as processed even if no chunks (file was uploaded successfully)
            db_document.is_processed = True
            db_document.chunk_count = 0
            db.commit()
        
    except Exception as e:
        print(f"Error processing document: {e}")
        # Document is saved but not processed - mark as processed to avoid retry
        db_document.is_processed = True
        db_document.chunk_count = 0
        db.commit()
        print(f"Document marked as processed despite processing error")
    
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

@router.post("/bulk-upload")
async def bulk_upload_documents(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk upload documenten (alleen voor admins)"""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform bulk uploads"
        )
    
    # Check file types
    allowed_types = ['.pdf', '.docx', '.md', '.txt']
    results = []
    
    for file in files:
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_types:
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": f"Unsupported file type: {file_extension}"
            })
            continue
        
        try:
            # Create documents directory if it doesn't exist
            os.makedirs("/app/documents", exist_ok=True)
            
            # Save file
            filename = f"{current_user.id}_{file.filename}"
            file_path = f"/app/documents/{filename}"
            
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
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
            
            # Process document
            try:
                print(f"Processing bulk upload document: {file_path}")
                processor = DocumentProcessor()
                vectorstore = VectorStore()
                
                # Process document - new processor returns list of strings
                chunks = processor.process_document(file_path)
                print(f"Document processing completed, got {len(chunks)} chunks")
                
                if chunks:
                    # Create metadata for each chunk
                    metadatas = []
                    for i, chunk in enumerate(chunks):
                        metadata = {
                            'file_path': file_path,
                            'filename': filename,
                            'original_filename': file.filename,
                            'chunk': i + 1,
                            'user_id': current_user.id,
                            'upload_date': db_document.uploaded_at.isoformat()
                        }
                        metadatas.append(metadata)
                    
                    # Add to vectorstore
                    print(f"Adding {len(chunks)} chunks to vectorstore")
                    for i, chunk in enumerate(chunks):
                        vectorstore.add_document(chunk, metadatas[i])
                    
                    # Update document record
                    db_document.is_processed = True
                    db_document.chunk_count = len(chunks)
                    db.commit()
                    print(f"Document marked as processed with {len(chunks)} chunks")
                    
                    results.append({
                        "filename": file.filename,
                        "status": "success",
                        "message": f"Uploaded and processed successfully. Created {len(chunks)} chunks.",
                        "chunks": len(chunks)
                    })
                else:
                    print("No chunks generated from document")
                    db_document.is_processed = True
                    db_document.chunk_count = 0
                    db.commit()
                    
                    results.append({
                        "filename": file.filename,
                        "status": "warning",
                        "message": "Uploaded successfully but no text could be extracted.",
                        "chunks": 0
                    })
                
            except Exception as e:
                print(f"Error processing document: {e}")
                db_document.is_processed = True
                db_document.chunk_count = 0
                db.commit()
                
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": f"Uploaded but processing failed: {str(e)}",
                    "chunks": 0
                })
                
        except Exception as e:
            print(f"Error uploading document {file.filename}: {e}")
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": f"Upload failed: {str(e)}",
                "chunks": 0
            })
    
    # Calculate summary
    successful = len([r for r in results if r["status"] == "success"])
    warnings = len([r for r in results if r["status"] == "warning"])
    errors = len([r for r in results if r["status"] == "error"])
    total_chunks = sum([r.get("chunks", 0) for r in results if r["status"] == "success"])
    
    return {
        "message": f"Bulk upload completed. {successful} successful, {warnings} warnings, {errors} errors.",
        "summary": {
            "total_files": len(files),
            "successful": successful,
            "warnings": warnings,
            "errors": errors,
            "total_chunks": total_chunks
        },
        "results": results
    }

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
    """Verwijder een document en alle gerelateerde chunks"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        # Remove chunks from vectorstore
        vectorstore = VectorStore()
        vectorstore.remove_document_chunks(document.original_filename)
        print(f"Removed chunks for document: {document.original_filename}")
        
        # Delete file
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
            print(f"Deleted file: {document.file_path}")
        
        # Delete from database
        db.delete(document)
        db.commit()
        print(f"Deleted document record: {document.id}")
        
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting document: {e}")
        # Rollback database changes if vectorstore removal failed
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        ) 