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
        # Gebruik het originele embedding model voor compatibiliteit
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
    
    def add_document(self, content: str, metadata: Dict[str, Any] = None) -> bool:
        """Voeg een enkele document chunk toe aan de vectorstore"""
        try:
            if not content or not content.strip():
                print("Empty content, skipping")
                return False
            
            # Generate embedding
            embedding = self.model.encode([content])[0]
            
            # Add to lists
            self.documents.append(content)
            self.embeddings.append(embedding)
            self.metadatas.append(metadata or {})
            self.ids.append(str(len(self.documents)))
            
            # Save to disk
            self._save_data()
            
            print(f"Added document chunk: {len(content)} characters")
            return True
            
        except Exception as e:
            print(f"Error adding document: {e}")
            return False
    
    def search(self, query: str, n_results: int = 10, document_filter: str = None) -> List[Dict[str, Any]]:
        """Zoek in de vectorstore met optionele document filtering en hybrid search"""
        try:
            print(f"Searching for: '{query}' in {len(self.documents)} documents")
            if document_filter:
                print(f"Filtering by document: {document_filter}")
            
            if not self.documents or not self.embeddings:
                return []
            
            # Hybrid search: combine semantic and keyword search
            semantic_results = self._semantic_search(query, n_results, document_filter)
            keyword_results = self._keyword_search(query, n_results, document_filter)
            
            # Combine and deduplicate results
            combined_results = self._combine_results(semantic_results, keyword_results, n_results)
            
            print(f"Found {len(combined_results)} results (semantic: {len(semantic_results)}, keyword: {len(keyword_results)})")
            return combined_results
        except Exception as e:
            print(f"Error searching: {e}")
            return []
    
    def _semantic_search(self, query: str, n_results: int, document_filter: str = None) -> List[Dict[str, Any]]:
        """Semantic search met embeddings"""
        try:
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
                    filename = metadata.get('filename', '')
                    # Check both file_path and filename
                    if (document_filter.lower() in file_path.lower() or 
                        document_filter.lower() in filename.lower()):
                        filtered_indices.append((idx, score))
                indexed_scores = filtered_indices
            
            # Sort by score and take top results
            indexed_scores.sort(key=lambda x: x[1], reverse=True)
            top_indices = [idx for idx, _ in indexed_scores[:n_results]]
            
            results = []
            for idx in top_indices:
                if scores[idx] > 0.1:  # Minimum similarity threshold
                    results.append({
                        'content': self.documents[idx],
                        'metadata': self.metadatas[idx] if idx < len(self.metadatas) else {},
                        'relevance': float(scores[idx]),
                        'search_type': 'semantic'
                    })
            
            return results
        except Exception as e:
            print(f"Error in semantic search: {e}")
            return []
    
    def _keyword_search(self, query: str, n_results: int, document_filter: str = None) -> List[Dict[str, Any]]:
        """Keyword search voor exacte termen"""
        try:
            # Normalize query
            query_terms = query.lower().split()
            
            results = []
            for idx, doc in enumerate(self.documents):
                # Check document filter
                if document_filter:
                    metadata = self.metadatas[idx] if idx < len(self.metadatas) else {}
                    file_path = metadata.get('file_path', '')
                    filename = metadata.get('filename', '')
                    if not (document_filter.lower() in file_path.lower() or 
                           document_filter.lower() in filename.lower()):
                        continue
                
                # Calculate keyword score
                doc_lower = doc.lower()
                score = 0
                for term in query_terms:
                    if term in doc_lower:
                        # Boost score for exact matches
                        score += 2
                        # Additional boost for multiple occurrences
                        score += doc_lower.count(term) * 0.5
                
                if score > 0:
                    results.append({
                        'content': doc,
                        'metadata': self.metadatas[idx] if idx < len(self.metadatas) else {},
                        'relevance': min(score / 10, 1.0),  # Normalize score
                        'search_type': 'keyword'
                    })
            
            # Sort by score and take top results
            results.sort(key=lambda x: x['relevance'], reverse=True)
            return results[:n_results]
        except Exception as e:
            print(f"Error in keyword search: {e}")
            return []
    
    def _combine_results(self, semantic_results: List[Dict], keyword_results: List[Dict], n_results: int) -> List[Dict[str, Any]]:
        """Combine semantic and keyword results with deduplication"""
        combined = {}
        
        # Add semantic results with higher weight
        for result in semantic_results:
            content = result['content']
            if content not in combined:
                combined[content] = result
                combined[content]['relevance'] *= 1.2  # Boost semantic results
        
        # Add keyword results
        for result in keyword_results:
            content = result['content']
            if content in combined:
                # If already exists, boost the relevance
                combined[content]['relevance'] = max(combined[content]['relevance'], result['relevance'] * 1.5)
            else:
                combined[content] = result
        
        # Convert back to list and sort
        final_results = list(combined.values())
        final_results.sort(key=lambda x: x['relevance'], reverse=True)
        
        return final_results[:n_results]
    
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

    def remove_document_chunks(self, document_filename: str) -> bool:
        """Verwijder alle chunks van een specifiek document uit de vectorstore"""
        try:
            if not self.documents:
                print("No documents in vectorstore to remove")
                return True
            
            # Find indices of chunks that belong to this document
            indices_to_remove = []
            for idx, metadata in enumerate(self.metadatas):
                if idx < len(self.metadatas):
                    file_path = metadata.get('file_path', '')
                    filename = metadata.get('filename', '')
                    original_filename = metadata.get('original_filename', '')
                    
                    # Check if this chunk belongs to the document we want to remove
                    if (document_filename.lower() in file_path.lower() or 
                        document_filename.lower() in filename.lower() or
                        document_filename.lower() in original_filename.lower()):
                        indices_to_remove.append(idx)
            
            if not indices_to_remove:
                print(f"No chunks found for document: {document_filename}")
                return True
            
            # Remove chunks in reverse order to maintain correct indices
            indices_to_remove.sort(reverse=True)
            
            for idx in indices_to_remove:
                if idx < len(self.documents):
                    del self.documents[idx]
                if idx < len(self.embeddings):
                    del self.embeddings[idx]
                if idx < len(self.metadatas):
                    del self.metadatas[idx]
                if idx < len(self.ids):
                    del self.ids[idx]
            
            print(f"Removed {len(indices_to_remove)} chunks for document: {document_filename}")
            
            # Save updated vectorstore
            self._save_data()
            
            return True
            
        except Exception as e:
            print(f"Error removing document chunks: {e}")
            return False

# Use persistent vectorstore
VectorStore = EmbeddingVectorStore 