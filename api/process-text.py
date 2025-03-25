from http.server import BaseHTTPRequestHandler
import json
import requests
import time
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        try:
            api_key = data.get('apiKey', '')
            model = data.get('model', 'deepseek/deepseek-r1:free')
            prompt = data.get('prompt', '')
            chapter = data.get('chapter', '')
            part_number = data.get('partNumber', 1)
            total_parts = data.get('totalParts', 1)
            
            if not api_key:
                raise ValueError("API Key is required")
            
            if not prompt:
                raise ValueError("Prompt is required")
            
            if not chapter:
                raise ValueError("Chapter content is required")
            
            # Process with OpenRouter API
            result = self.process_with_openrouter(api_key, model, prompt, chapter)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'result': result,
                'partNumber': part_number,
                'totalParts': total_parts,
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(str(e).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def process_with_openrouter(self, api_key, model, prompt, chapter):
        base_url = "https://openrouter.ai/api/v1"
        
        full_prompt = f"{prompt}\n{chapter}"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vercel.app",  # Replace with your app's URL when deployed
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": full_prompt}
            ]
        }
        
        response = requests.post(
            f"{base_url}/chat/completions", 
            headers=headers, 
            json=payload
        )
        
        if response.status_code != 200:
            raise ValueError(f"API Error: {response.text}")
        
        result_text = response.json()['choices'][0]['message']['content']
        return result_text

