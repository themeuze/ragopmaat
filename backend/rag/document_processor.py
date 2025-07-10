import os
import uuid
from typing import List, Dict, Any
from PyPDF2 import PdfReader
from docx import Document
import markdown
import re
import traceback
from pdf2image import convert_from_path
import pytesseract

class DocumentProcessor:
    def __init__(self):
        self.supported_extensions = ['.pdf', '.docx', '.md', '.txt']
        self.chunk_size = 2000  # Verhoogd van 1000 naar 2000
        self.chunk_overlap = 200  # Overlap tussen chunks voor betere context
    
    def process_document(self, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """Verwerk een document en splits het in chunks"""
        print(f"[PROCESS DEBUG] file_path={file_path}, file_type={file_type}")
        try:
            if file_type == 'pdf':
                print("[PROCESS DEBUG] PDF processing selected")
                return self._process_pdf(file_path)
            elif file_type == 'docx':
                print("[PROCESS DEBUG] DOCX processing selected")
                return self._process_docx(file_path)
            elif file_type in ['md', 'txt']:
                print("[PROCESS DEBUG] Text/MD processing selected")
                return self._process_text(file_path)
            else:
                print(f"[PROCESS DEBUG] Unsupported file type: {file_type}")
                raise ValueError(f"Unsupported file type: {file_type}")
        except Exception as e:
            print(f"[PROCESS DEBUG] Error processing document {file_path}: {e}")
            return []
    
    def _process_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        """Verwerk PDF bestand, met OCR fallback"""
        chunks = []
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                print(f"[PDF DEBUG] {file_path}: {len(pdf_reader.pages)} pagina's gevonden")
                # OCR fallback: converteer alle pagina's naar images
                images = convert_from_path(file_path)
                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    if not text or not text.strip():
                        # OCR fallback
                        print(f"[PDF DEBUG] Pagina {page_num+1}: geen tekst gevonden, OCR wordt geprobeerd...")
                        ocr_text = pytesseract.image_to_string(images[page_num], lang='nld+eng')
                        print(f"[PDF DEBUG] Pagina {page_num+1} OCR: {repr(ocr_text)[:200]}")
                        text = ocr_text
                    else:
                        print(f"[PDF DEBUG] Pagina {page_num+1}: {repr(text)[:200]}")
                    if text and text.strip():
                        page_chunks = self._split_text_improved(text, max_length=self.chunk_size, overlap=self.chunk_overlap)
                        for chunk_num, chunk in enumerate(page_chunks):
                            chunks.append({
                                'id': f"{uuid.uuid4()}",
                                'content': chunk.strip(),
                                'metadata': {
                                    'page': page_num + 1,
                                    'chunk': chunk_num + 1,
                                    'file_type': 'pdf',
                                    'file_path': file_path,
                                    'filename': os.path.basename(file_path)
                                }
                            })
        except Exception as e:
            print(f"[PDF DEBUG] Error processing PDF {file_path}: {e}")
            traceback.print_exc()
        return chunks
    
    def _process_docx(self, file_path: str) -> List[Dict[str, Any]]:
        """Verwerk DOCX bestand"""
        chunks = []
        try:
            doc = Document(file_path)
            
            # Extract text from paragraphs
            text_parts = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)
            
            full_text = '\n\n'.join(text_parts)
            
            # Split into chunks with overlap
            text_chunks = self._split_text_improved(full_text, max_length=self.chunk_size, overlap=self.chunk_overlap)
            
            for chunk_num, chunk in enumerate(text_chunks):
                chunks.append({
                    'id': f"{uuid.uuid4()}",
                    'content': chunk.strip(),
                    'metadata': {
                        'chunk': chunk_num + 1,
                        'file_type': 'docx',
                        'file_path': file_path,
                        'filename': os.path.basename(file_path)
                    }
                })
        except Exception as e:
            print(f"Error processing DOCX {file_path}: {e}")
        
        return chunks
    
    def _process_text(self, file_path: str) -> List[Dict[str, Any]]:
        """Verwerk tekst bestand (MD, TXT)"""
        chunks = []
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                
                # Convert markdown to plain text if needed
                if file_path.endswith('.md'):
                    content = markdown.markdown(content)
                    # Remove HTML tags
                    content = re.sub(r'<[^>]+>', '', content)
                
                # Split into chunks with overlap
                text_chunks = self._split_text_improved(content, max_length=self.chunk_size, overlap=self.chunk_overlap)
                
                for chunk_num, chunk in enumerate(text_chunks):
                    chunks.append({
                        'id': f"{uuid.uuid4()}",
                        'content': chunk.strip(),
                        'metadata': {
                            'chunk': chunk_num + 1,
                            'file_type': 'text',
                            'file_path': file_path,
                            'filename': os.path.basename(file_path)
                        }
                    })
        except Exception as e:
            print(f"Error processing text file {file_path}: {e}")
        
        return chunks
    
    def _split_text_improved(self, text: str, max_length: int = 2000, overlap: int = 200) -> List[str]:
        """Verbeterde tekst splitting met overlap en semantische grenzen"""
        if len(text) <= max_length:
            return [text]
        
        # Clean up text
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        text = text.strip()
        
        chunks = []
        start = 0
        
        while start < len(text):
            # Determine end position
            end = start + max_length
            
            if end >= len(text):
                # Last chunk
                chunk = text[start:]
            else:
                # Try to find a good break point
                chunk = text[start:end]
                
                # Look for paragraph breaks first
                last_paragraph = chunk.rfind('\n\n')
                if last_paragraph > max_length * 0.7:  # If we find a paragraph break in the last 30%
                    chunk = text[start:start + last_paragraph]
                    end = start + last_paragraph
                else:
                    # Look for sentence breaks
                    last_sentence = chunk.rfind('. ')
                    if last_sentence > max_length * 0.6:  # If we find a sentence break in the last 40%
                        chunk = text[start:start + last_sentence + 1]
                        end = start + last_sentence + 1
                    else:
                        # Look for word breaks
                        last_space = chunk.rfind(' ')
                        if last_space > max_length * 0.5:  # If we find a space in the last 50%
                            chunk = text[start:start + last_space]
                            end = start + last_space
                        else:
                            # Force break at max_length
                            chunk = text[start:end]
            
            if chunk.strip():
                chunks.append(chunk.strip())
            
            # Move start position with overlap
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks
    
    def _split_text(self, text: str, max_length: int = 1000) -> List[str]:
        """Legacy tekst splitting (behouden voor backward compatibility)"""
        if len(text) <= max_length:
            return [text]
        
        chunks = []
        current_chunk = ""
        
        # Split by sentences first
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            if len(current_chunk) + len(sentence) + 1 <= max_length:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks 