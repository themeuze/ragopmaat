import json
from typing import List, Dict, Any
import os
import numpy as np
from sentence_transformers import SentenceTransformer

class EmbeddingVectorStore:
    def __init__(self, storage_path: str = "/app/data/vectorstore.json"):
        self.storage_path = storage_path
        self.documents = []
        self.metadatas = []
        self.ids = []
        self.embeddings = []
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self._load_data()
    
    def _load_data(self):
        """Laad data uit JSON bestand"""
        try:
            if os.path.exists(self.storage_path):
                print(f"Loading data from {self.storage_path}")
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.documents = data.get('documents', [])
                    self.metadatas = data.get('metadatas', [])
                    self.ids = data.get('ids', [])
                    self.embeddings = [np.array(e) for e in data.get('embeddings', [])]
                print(f"Loaded {len(self.documents)} documents")
            else:
                print(f"Storage file {self.storage_path} does not exist, starting fresh")
        except Exception as e:
            print(f"Error loading vectorstore data: {e}")
            self.documents = []
            self.metadatas = []
            self.ids = []
            self.embeddings = []
    
    def _save_data(self):
        """Sla data op in JSON bestand"""
        try:
            print(f"Saving {len(self.documents)} documents to {self.storage_path}")
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump({
                    'documents': self.documents,
                    'metadatas': self.metadatas,
                    'ids': self.ids,
                    'embeddings': [e.tolist() for e in self.embeddings]
                }, f, ensure_ascii=False, indent=2)
            print(f"Successfully saved data to {self.storage_path}")
        except Exception as e:
            print(f"Error saving vectorstore data: {e}")
    
    def add_documents(self, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        """Voeg documenten toe aan de vectorstore"""
        try:
            print(f"Adding {len(documents)} documents to vectorstore")
            new_embeddings = self.model.encode(documents)
            self.documents.extend(documents)
            self.metadatas.extend(metadatas)
            self.ids.extend(ids)
            self.embeddings.extend([np.array(e) for e in new_embeddings])
            self._save_data()
            return True
        except Exception as e:
            print(f"Error adding documents: {e}")
            return False
    
    def search(self, query: str, n_results: int = 5, document_filter: str = None) -> List[Dict[str, Any]]:
        """Zoek in de vectorstore met optionele document filtering"""
        try:
            print(f"Searching for: '{query}' in {len(self.documents)} documents")
            if document_filter:
                print(f"Filtering by document: {document_filter}")
            
            if not self.documents or not self.embeddings:
                return []
            
            query_emb = self.model.encode([query])[0]
            scores = [self._cosine_similarity(query_emb, emb) for emb in self.embeddings]
            
            # Create list of (index, score) tuples
            indexed_scores = list(enumerate(scores))
            
            # Filter by document if specified
            if document_filter:
                filtered_indices = []
                for idx, score in indexed_scores:
                    metadata = self.metadatas[idx] if idx < len(self.metadatas) else {}
                    file_path = metadata.get('file_path', '')
                    # Extract filename from file_path
                    filename = os.path.basename(file_path) if file_path else ''
                    if document_filter.lower() in filename.lower():
                        filtered_indices.append((idx, score))
                        print(f"Found matching document: {filename}")
                indexed_scores = filtered_indices
                print(f"Filtered to {len(filtered_indices)} documents")
            
            # Sort by score and take top n results
            indexed_scores.sort(key=lambda x: x[1], reverse=True)
            top_indices = [idx for idx, _ in indexed_scores[:n_results]]
            
            results = []
            for idx in top_indices:
                results.append({
                    'content': self.documents[idx],
                    'metadata': self.metadatas[idx] if idx < len(self.metadatas) else {},
                    'relevance': float(scores[idx])
                })
            
            print(f"Found {len(results)} results")
            return results
        except Exception as e:
            print(f"Error searching: {e}")
            return []
    
    def _cosine_similarity(self, a, b):
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    
    def delete_documents(self, ids: List[str]):
        """Verwijder documenten uit de vectorstore"""
        try:
            # Simple implementation - remove by index
            for doc_id in ids:
                if doc_id in self.ids:
                    idx = self.ids.index(doc_id)
                    del self.documents[idx]
                    del self.metadatas[idx]
                    del self.ids[idx]
                    del self.embeddings[idx]
            self._save_data()
            return True
        except Exception as e:
            print(f"Error deleting documents: {e}")
            return False

# Use persistent vectorstore
VectorStore = EmbeddingVectorStore 