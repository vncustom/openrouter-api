from http.server import BaseHTTPRequestHandler
import json
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        try:
            text = data.get('additionalText', '')
            split_method = data.get('splitMethod', 'chapter')
            language = data.get('language', '中文')
            split_length = data.get('splitLength', 1000)
            
            chapters = self.split_text(text, split_method, language, split_length)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'chapters': chapters
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
    
    def split_text(self, text, split_method, language, split_length):
        if split_method == 'chapter':
            # Combine both patterns: 第X章 and Chương + number
            chapter_patterns = [
                r'第\w+章',  # Pattern for 第X章
                r'Chương\s*\d+',  # Pattern for Chương + number
            ]

            # Find all chapter markers
            chapters = []
            for pattern in chapter_patterns:
                chapters.extend([(m.group(), m.start())
                               for m in re.finditer(pattern, text)])

            # Sort chapters by their position
            chapters.sort(key=lambda x: x[1])

            if not chapters:
                raise ValueError("No chapter format found (第X章 or Chương + number)")

            result = []
            # Process each chapter
            for i in range(len(chapters)):
                current_chapter, start_pos = chapters[i]

                # If it's the last chapter
                if i == len(chapters) - 1:
                    chapter_content = text[start_pos:]
                else:
                    # Get content until the start of the next chapter
                    next_chapter_pos = chapters[i + 1][1]
                    chapter_content = text[start_pos:next_chapter_pos]

                result.append(chapter_content.strip())

            return result
        
        elif split_method == 'count':
            if language == "中文":
                # Split by character count
                result = []
                current_chunk = []
                current_length = 0

                for line in text.split('\n'):
                    if current_length + len(line) > split_length and current_chunk:
                        result.append('\n'.join(current_chunk))
                        current_chunk = []
                        current_length = 0

                    current_chunk.append(line)
                    current_length += len(line) + 1  # +1 for newline

                if current_chunk:
                    result.append('\n'.join(current_chunk))

                return result

            elif language == "ENG":
                # Split by word count without breaking sentences
                return self.smart_split_by_words(text, split_length)

            else:
                # For other languages like Vietnamese
                # Split by character count like Chinese
                result = []
                current_chunk = []
                current_length = 0

                for line in text.split('\n'):
                    if current_length + len(line) > split_length and current_chunk:
                        result.append('\n'.join(current_chunk))
                        current_chunk = []
                        current_length = 0

                    current_chunk.append(line)
                    current_length += len(line) + 1  # +1 for newline

                if current_chunk:
                    result.append('\n'.join(current_chunk))

                return result
        else:
            raise ValueError("Invalid split method")
    
    def smart_split_by_words(self, text, max_words):
        """
        Splits text into chunks based on word count, ensuring no sentence is broken.
        """
        sentences = re.split(r'(?<=[.!?]) +', text)
        chunks = []
        current_chunk = ''
        current_word_count = 0

        for sentence in sentences:
            words_in_sentence = len(sentence.split())

            if words_in_sentence > max_words:
                words = sentence.split()
                for i in range(0, len(words), max_words):
                    sub_sentence = ' '.join(words[i:i+max_words])
                    if current_word_count + len(words[i:i+max_words]) > max_words:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sub_sentence
                        current_word_count = len(words[i:i+max_words])
                    else:
                        if current_chunk:
                            current_chunk += ' ' + sub_sentence
                        else:
                            current_chunk = sub_sentence
                        current_word_count += len(words[i:i+max_words])
            else:
                if current_word_count + words_in_sentence <= max_words:
                    if current_chunk:
                        current_chunk += ' ' + sentence
                    else:
                        current_chunk = sentence
                    current_word_count += words_in_sentence
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence
                    current_word_count = words_in_sentence

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

