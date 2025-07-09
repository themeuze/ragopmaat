import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post('http://localhost:11434/api/generate', json={
            'model': 'mistral',
            'prompt': 'Wat is streefhuurbeleid?',
            'stream': False
        })
        print('Status:', resp.status_code)
        print('Response:', resp.text[:500])

if __name__ == '__main__':
    asyncio.run(test()) 