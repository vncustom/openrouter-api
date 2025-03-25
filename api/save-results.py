from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        try:
            results = data.get('results', [])
            
            if not results:
                raise ValueError("No results to save")
            
            # In a serverless environment, we can't save to the filesystem directly
            # Instead, we'll return the content that the client can save
            
            timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
            filename = f"openrouter_result_{timestamp}.txt"
            
            content = "\n\n".join(results)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                'content': content,
                'filename': filename,
                'timestamp': timestamp
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(str(e).encode())

