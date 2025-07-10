#!/usr/bin/env python3
"""
Script om alle bestaande documenten opnieuw te verwerken
"""
import os
import sys
from pathlib import Path

# Voeg de app directory toe aan het Python pad
sys.path.append('/app')

from rag.document_processor import DocumentProcessor
from rag.vectorstore import VectorStore
from db import SessionLocal
from models import Document

def reprocess_all_documents():
    """Verwerk alle documenten opnieuw"""
    db = SessionLocal()
    processor = DocumentProcessor()
    vectorstore = VectorStore()
    
    try:
        # Haal alle documenten op uit de database
        documents = db.query(Document).all()
        
        print(f"Gevonden {len(documents)} documenten om opnieuw te verwerken...")
        
        for doc in documents:
            if os.path.exists(doc.file_path):
                print(f"Verwerken van: {doc.original_filename}")
                
                try:
                    # Verwerk document
                    chunks = processor.process_document(doc.file_path)
                    
                    if chunks:
                        # Maak metadata voor elke chunk
                        metadatas = []
                        for i, chunk in enumerate(chunks):
                            metadata = {
                                'file_path': doc.file_path,
                                'filename': doc.filename,
                                'original_filename': doc.original_filename,
                                'chunk': i + 1,
                                'user_id': doc.user_id,
                                'upload_date': doc.uploaded_at.isoformat()
                            }
                            metadatas.append(metadata)
                        
                        # Voeg toe aan vectorstore
                        for i, chunk in enumerate(chunks):
                            vectorstore.add_document(chunk, metadatas[i])
                        
                        # Update document record
                        doc.is_processed = True
                        doc.chunk_count = len(chunks)
                        print(f"  ✓ {len(chunks)} chunks toegevoegd")
                    else:
                        print(f"  ⚠ Geen chunks gegenereerd")
                        doc.is_processed = True
                        doc.chunk_count = 0
                        
                except Exception as e:
                    print(f"  ✗ Fout bij verwerken: {e}")
                    doc.is_processed = True
                    doc.chunk_count = 0
            else:
                print(f"  ✗ Bestand niet gevonden: {doc.file_path}")
                doc.is_processed = True
                doc.chunk_count = 0
        
        # Commit alle wijzigingen
        db.commit()
        print("✓ Alle documenten opnieuw verwerkt!")
        
    except Exception as e:
        print(f"Fout: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reprocess_all_documents() 