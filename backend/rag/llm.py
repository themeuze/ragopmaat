import json
from typing import Dict, Any, List, AsyncGenerator
import os
import httpx
import asyncio
import traceback
import time
import openai

class OllamaLLM:
    def __init__(self, model_name: str = "mistral", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
    
    async def generate_streaming(self, prompt: str, context: str = "") -> AsyncGenerator[str, None]:
        """Genereer een antwoord met streaming voor betere UX"""
        print(f"[LLM DEBUG] START generate_streaming()")
        try:
            # Bouw de prompt op
            if context:
                full_prompt = f"""Gebruik de volgende context om de vraag te beantwoorden:\n\nContext:\n{context}\n\nVraag: {prompt}\n\nAntwoord:"""
            else:
                full_prompt = prompt
            
            print(f"[LLM DEBUG] Streaming request aan Ollama: {self.base_url}/api/generate")
            
            # Kortere timeout voor streaming (2 minuten)
            timeout_config = httpx.Timeout(120.0, connect=30.0)
            async with httpx.AsyncClient(timeout=timeout_config) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": full_prompt,
                        "stream": True
                    }
                ) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.strip():
                                try:
                                    data = json.loads(line)
                                    if "response" in data:
                                        yield data["response"]
                                    if data.get("done", False):
                                        break
                                except json.JSONDecodeError:
                                    continue
                    else:
                        error_msg = f"Error: Kon geen verbinding maken met Ollama (status {response.status_code})"
                        yield error_msg
        except httpx.TimeoutException as e:
            print(f"[LLM DEBUG] Timeout Exception: {e}")
            yield "Error: Ollama duurde te lang om te antwoorden (meer dan 2 minuten). Probeer een kortere vraag."
        except httpx.ConnectError as e:
            print(f"[LLM DEBUG] Connection Error: {e}")
            yield "Error: Kon geen verbinding maken met Ollama. Controleer of Ollama draait."
        except Exception as e:
            print(f"[LLM DEBUG] Exception: {e}")
            traceback.print_exc()
            yield f"Error: Kon geen verbinding maken met Ollama: {str(e)}"
    
    async def generate(self, prompt: str, context: str = "") -> str:
        """Genereer een antwoord met context via Ollama (non-streaming fallback)"""
        print(f"[LLM DEBUG] START generate()")
        try:
            # Bouw de prompt op
            if context:
                full_prompt = (
                    "Je bent een ervaren woon- en verhuurconsulent. Beantwoord de onderstaande vraag zo volledig, duidelijk en professioneel mogelijk, uitsluitend op basis van de context uit de geüploade documenten.\n"
                    "Gebruik alleen informatie die daadwerkelijk in de context staat.\n"
                    "- Geef een helder, zelfstandig antwoord in normaal Nederlands.\n"
                    "- Schrijf als een mens, niet als een robot.\n"
                    "- Gebruik geen opsommingen, geen markdown, geen kopjes, geen verwijzingen naar 'bron 1' of 'bron 2'.\n"
                    "- Vat relevante informatie samen tot een lopend verhaal, zoals je dat aan een huurder of collega zou uitleggen.\n"
                    "- Als het antwoord niet in de context staat, zeg dan eerlijk: 'Op basis van de beschikbare documenten kan ik deze vraag niet beantwoorden.'\n\n"
                    f"Context:\n{context}\n\nVraag: {prompt}\n\nAntwoord:"
                )
            else:
                full_prompt = (
                    "Je bent een ervaren woon- en verhuurconsulent. Beantwoord de onderstaande vraag zo volledig, duidelijk en professioneel mogelijk.\n"
                    "Geef een helder, zelfstandig antwoord in normaal Nederlands.\n"
                    "Schrijf als een mens, niet als een robot.\n"
                    "Gebruik geen opsommingen, geen markdown, geen kopjes.\n"
                    "Als je het antwoord niet weet, zeg dat dan eerlijk.\n\n"
                    f"Vraag: {prompt}\n\nAntwoord:"
                )
            print(f"[LLM DEBUG] Request aan Ollama: {self.base_url}/api/generate")
            print(f"[LLM DEBUG] Payload: {{'model': '{self.model_name}', 'prompt': '{full_prompt[:200]}...', 'stream': False}}")
            
            # Verhoog timeout naar 300 seconden (5 minuten) voor complexe vragen
            timeout_config = httpx.Timeout(300.0, connect=30.0)
            async with httpx.AsyncClient(timeout=timeout_config) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": full_prompt,
                        "stream": False
                    }
                )
                print(f"[LLM DEBUG] Status code: {response.status_code}")
                print(f"[LLM DEBUG] Response text: {response.text[:500]}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"[LLM DEBUG] END generate() OK")
                    return result.get("response", "Geen antwoord ontvangen van de LLM.")
                else:
                    print(f"Ollama API error: {response.status_code} - {response.text}")
                    print(f"[LLM DEBUG] END generate() ERROR")
                    return f"Error: Kon geen verbinding maken met Ollama (status {response.status_code})"
        except httpx.TimeoutException as e:
            print(f"[LLM DEBUG] Timeout Exception: {e}")
            print(f"[LLM DEBUG] END generate() TIMEOUT")
            return "Error: Ollama duurde te lang om te antwoorden (meer dan 5 minuten). Probeer een kortere vraag of probeer het later opnieuw."
        except httpx.ConnectError as e:
            print(f"[LLM DEBUG] Connection Error: {e}")
            print(f"[LLM DEBUG] END generate() CONNECTION_ERROR")
            return "Error: Kon geen verbinding maken met Ollama. Controleer of Ollama draait."
        except Exception as e:
            print(f"[LLM DEBUG] Exception: {e}")
            traceback.print_exc()
            print(f"[LLM DEBUG] END generate() EXCEPTION")
            return f"Error: Kon geen verbinding maken met Ollama: {str(e)}"
    
    async def generate_with_sources(self, question: str, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        print(f"[LLM DEBUG] START generate_with_sources()")
        try:
            # Combineer alle bronnen
            context_parts = []
            for i, source in enumerate(sources, 1):
                context_parts.append(f"Bron {i}: {source['content']}")
            
            context = "\n\n".join(context_parts)
            print(f"[LLM DEBUG] generate_with_sources: vraag='{question}', aantal bronnen={len(sources)}")
            
            # Probeer eerst streaming, val terug op normale request
            try:
                # Start streaming response
                full_response = ""
                async for chunk in self.generate_streaming(question, context):
                    full_response += chunk
                    # Stop na 30 seconden als er nog geen antwoord is
                    if len(full_response) > 50 and not full_response.startswith("Error:"):
                        break
                
                if full_response and not full_response.startswith("Error:"):
                    answer = full_response
                else:
                    # Fallback naar normale request
                    answer = await self.generate(question, context)
            except Exception as e:
                print(f"[LLM DEBUG] Streaming failed, falling back: {e}")
                answer = await self.generate(question, context)
            
            # Format bronnen voor weergave
            formatted_sources = []
            for i, source in enumerate(sources, 1):
                formatted_sources.append({
                    "id": i,
                    "content": source['content'][:200] + "..." if len(source['content']) > 200 else source['content'],
                    "metadata": source.get('metadata', {}),
                    "relevance": 1 - source.get('distance', 0)  # Convert distance to relevance score
                })
            print(f"[LLM DEBUG] END generate_with_sources() OK")
            return {
                "answer": answer,
                "sources": formatted_sources,
                "source_count": len(sources)
            }
        except Exception as e:
            print(f"[LLM DEBUG] Exception in generate_with_sources: {e}")
            traceback.print_exc()
            print(f"[LLM DEBUG] END generate_with_sources() EXCEPTION")
            return {
                "answer": f"Error: Kon geen antwoord genereren: {str(e)}",
                "sources": [],
                "source_count": 0
            }
    
    async def close(self):
        """Sluit de HTTP client (niet meer nodig)"""
        pass

class FastMockLLM:
    """Snelle mock LLM voor ontwikkeling en testing"""
    def __init__(self, model_name: str = "mistral", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
    
    async def generate(self, prompt: str, context: str = "") -> str:
        """Genereer een snel mock antwoord"""
        await asyncio.sleep(0.5)  # Simuleer korte verwerkingstijd
        if context:
            return f"Gebaseerd op de context: {context[:100]}...\n\nAntwoord: Dit is een snel mock antwoord op je vraag: {prompt}"
        else:
            return f"Snel mock antwoord: {prompt}"
    
    async def generate_with_sources(self, question: str, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Genereer snel antwoord met bronnen (mock)"""
        await asyncio.sleep(0.5)  # Simuleer korte verwerkingstijd
        
        # Combineer alle bronnen
        context_parts = []
        for i, source in enumerate(sources, 1):
            context_parts.append(f"Bron {i}: {source['content']}")
        
        context = "\n\n".join(context_parts)
        
        # Genereer antwoord
        answer = await self.generate(question, context)
        
        # Format bronnen voor weergave
        formatted_sources = []
        for i, source in enumerate(sources, 1):
            formatted_sources.append({
                "id": i,
                "content": source['content'][:200] + "..." if len(source['content']) > 200 else source['content'],
                "metadata": source.get('metadata', {}),
                "relevance": 1 - source.get('distance', 0)  # Convert distance to relevance score
            })
        
        return {
            "answer": answer,
            "sources": formatted_sources,
            "source_count": len(sources)
        }
    
    async def close(self):
        """Sluit de HTTP client"""
        pass

class MockLLM:
    def __init__(self, model_name: str = "mistral", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
    
    async def generate(self, prompt: str, context: str = "") -> str:
        """Genereer een antwoord met context (mock)"""
        if context:
            return f"Gebaseerd op de context: {context[:100]}...\n\nAntwoord: Dit is een mock antwoord op je vraag: {prompt}"
        else:
            return f"Mock antwoord: {prompt}"
    
    async def generate_with_sources(self, question: str, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Genereer antwoord met bronnen (mock)"""
        # Combineer alle bronnen
        context_parts = []
        for i, source in enumerate(sources, 1):
            context_parts.append(f"Bron {i}: {source['content']}")
        
        context = "\n\n".join(context_parts)
        
        # Genereer antwoord
        answer = await self.generate(question, context)
        
        # Format bronnen voor weergave
        formatted_sources = []
        for i, source in enumerate(sources, 1):
            formatted_sources.append({
                "id": i,
                "content": source['content'][:200] + "..." if len(source['content']) > 200 else source['content'],
                "metadata": source.get('metadata', {}),
                "relevance": 1 - source.get('distance', 0)  # Convert distance to relevance score
            })
        
        return {
            "answer": answer,
            "sources": formatted_sources,
            "source_count": len(sources)
        }
    
    async def close(self):
        """Sluit de HTTP client"""
        pass

class OpenAILLM:
    def __init__(self, model_name: str = "gpt-3.5-turbo", api_key: str = None):
        self.model_name = model_name
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")

    async def generate_streaming(self, prompt: str, context: str = "") -> AsyncGenerator[str, None]:
        """Genereer een antwoord met streaming voor betere UX"""
        print(f"[LLM DEBUG] START generate_streaming() - OpenAI")
        try:
            # Bouw de prompt op
            if context:
                full_prompt = (
                    "Je bent een ervaren woon- en verhuurconsulent. Beantwoord de onderstaande vraag zo volledig, duidelijk en professioneel mogelijk, uitsluitend op basis van de context uit de geüploade documenten.\n"
                    "Gebruik alleen informatie die daadwerkelijk in de context staat.\n"
                    "- Geef een helder, zelfstandig antwoord in normaal Nederlands.\n"
                    "- Schrijf als een mens, niet als een robot.\n"
                    "- Gebruik geen opsommingen, geen markdown, geen kopjes, geen verwijzingen naar 'bron 1' of 'bron 2'.\n"
                    "- Vat relevante informatie samen tot een lopend verhaal, zoals je dat aan een huurder of collega zou uitleggen.\n"
                    "- Als het antwoord niet in de context staat, zeg dan eerlijk: 'Op basis van de beschikbare documenten kan ik deze vraag niet beantwoorden.'\n\n"
                    f"Context:\n{context}\n\nVraag: {prompt}\n\nAntwoord:"
                )
            else:
                full_prompt = (
                    "Je bent een ervaren woon- en verhuurconsulent. Beantwoord de onderstaande vraag zo volledig, duidelijk en professioneel mogelijk.\n"
                    "Geef een helder, zelfstandig antwoord in normaal Nederlands.\n"
                    "Schrijf als een mens, niet als een robot.\n"
                    "Gebruik geen opsommingen, geen markdown, geen kopjes.\n"
                    "Als je het antwoord niet weet, zeg dat dan eerlijk.\n\n"
                    f"Vraag: {prompt}\n\nAntwoord:"
                )
            
            print(f"[LLM DEBUG] OpenAI streaming request")
            
            # Voor OpenAI kunnen we geen echte streaming doen, dus we doen een normale request
            # en simuleren streaming door het antwoord in chunks te sturen
            answer = await self.generate(prompt, context)
            
            # Simuleer streaming door het antwoord in chunks te sturen
            chunk_size = 50
            for i in range(0, len(answer), chunk_size):
                chunk = answer[i:i + chunk_size]
                yield chunk
                await asyncio.sleep(0.1)  # Kleine pauze voor streaming effect
                
        except Exception as e:
            print(f"[LLM DEBUG] Exception in generate_streaming: {e}")
            traceback.print_exc()
            yield f"Error: Kon geen antwoord genereren: {str(e)}"

    async def generate(self, prompt: str, context: str = "") -> str:
        import asyncio
        import concurrent.futures
        print(f"[LLM DEBUG] START generate() - OpenAI")
        try:
            # Bouw de prompt op
            if context:
                full_prompt = (
                    "Je bent een ervaren woon- en verhuurconsulent. Beantwoord de onderstaande vraag zo volledig, duidelijk en professioneel mogelijk, uitsluitend op basis van de context uit de geüploade documenten.\n"
                    "Gebruik alleen informatie die daadwerkelijk in de context staat.\n"
                    "- Geef een helder, zelfstandig antwoord in normaal Nederlands.\n"
                    "- Schrijf als een mens, niet als een robot.\n"
                    "- Gebruik geen opsommingen, geen markdown, geen kopjes, geen verwijzingen naar 'bron 1' of 'bron 2'.\n"
                    "- Vat relevante informatie samen tot een lopend verhaal, zoals je dat aan een huurder of collega zou uitleggen.\n"
                    "- Als het antwoord niet in de context staat, zeg dan eerlijk: 'Op basis van de beschikbare documenten kan ik deze vraag niet beantwoorden.'\n\n"
                    f"Context:\n{context}\n\nVraag: {prompt}\n\nAntwoord:"
                )
            else:
                full_prompt = (
                    "Je bent een ervaren woon- en verhuurconsulent. Beantwoord de onderstaande vraag zo volledig, duidelijk en professioneel mogelijk.\n"
                    "Geef een helder, zelfstandig antwoord in normaal Nederlands.\n"
                    "Schrijf als een mens, niet als een robot.\n"
                    "Gebruik geen opsommingen, geen markdown, geen kopjes.\n"
                    "Als je het antwoord niet weet, zeg dat dan eerlijk.\n\n"
                    f"Vraag: {prompt}\n\nAntwoord:"
                )
            
            loop = asyncio.get_event_loop()
            def sync_openai():
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=self.api_key)
                    response = client.chat.completions.create(
                        model=self.model_name,
                        messages=[{"role": "user", "content": full_prompt}],
                        temperature=0.2,
                        max_tokens=1000,
                    )
                    return response.choices[0].message.content.strip()
                except Exception as e:
                    print(f"[LLM DEBUG] OpenAI API error: {e}")
                    raise e
            
            result = await loop.run_in_executor(concurrent.futures.ThreadPoolExecutor(), sync_openai)
            print(f"[LLM DEBUG] END generate() OK - OpenAI")
            return result
        except Exception as e:
            print(f"[LLM DEBUG] Exception in generate: {e}")
            traceback.print_exc()
            print(f"[LLM DEBUG] END generate() EXCEPTION - OpenAI")
            return f"Error: Kon geen antwoord genereren via OpenAI: {str(e)}"

    async def generate_with_sources(self, question, sources):
        print(f"[LLM DEBUG] START generate_with_sources() - OpenAI")
        try:
            context = "\n\n".join([s["content"] for s in sources])
            answer = await self.generate(question, context)
            formatted_sources = []
            for i, source in enumerate(sources, 1):
                formatted_sources.append({
                    "id": i,
                    "content": source['content'][:200] + "..." if len(source['content']) > 200 else source['content'],
                    "metadata": source.get('metadata', {}),
                    "relevance": 1 - source.get('distance', 0)
                })
            print(f"[LLM DEBUG] END generate_with_sources() OK - OpenAI")
            return {
                "answer": answer,
                "sources": formatted_sources,
                "source_count": len(sources)
            }
        except Exception as e:
            print(f"[LLM DEBUG] Exception in generate_with_sources: {e}")
            traceback.print_exc()
            print(f"[LLM DEBUG] END generate_with_sources() EXCEPTION - OpenAI")
            return {
                "answer": f"Error: Kon geen antwoord genereren: {str(e)}",
                "sources": [],
                "source_count": 0
            }

    async def close(self):
        pass

# Gebruik nu tijdelijk OpenAI LLM in plaats van Ollama
OllamaLLM = OpenAILLM
# OllamaLLM = OllamaLLM  # Terug naar originele Ollama
# OllamaLLM = FastMockLLM  # Mock uitzetten
# OllamaLLM = MockLLM 