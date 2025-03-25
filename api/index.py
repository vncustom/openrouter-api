from flask import Flask, request, jsonify
import requests
import re
import os
import time
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return """
    <html>
        <head>
            <title>OpenRouter API</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #333; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; }
                select, input, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
                button { background: #0070f3; color: white; border: none; padding: 10px 15px; cursor: pointer; margin-right: 10px; }
                .result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
                .progress-bar-container { width: 100%; background-color: #e0e0e0; border-radius: 4px; margin: 10px 0; }
                .progress-bar { height: 20px; background-color: #0070f3; border-radius: 4px; width: 0%; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <h1>OpenRouter AI Interface</h1>
            <div class="form-group">
                <label for="language">Language:</label>
                <select id="language">
                    <option value="ENG">English</option>
                    <option value="中文" selected>中文</option>
                    <option value="Việt Nam">Việt Nam</option>
                </select>
            </div>
            <div class="form-group">
                <label for="model">Model:</label>
                <select id="model">
                    <option value="deepseek/deepseek-r1:free" selected>deepseek/deepseek-r1:free</option>
                    <option value="deepseek/deepseek-chat-v3-0324:free">deepseek/deepseek-chat-v3-0324:free</option>
                    <option value="qwen/qwen2.5-vl-72b-instruct:free">qwen/qwen2.5-vl-72b-instruct:free</option>
                    <option value="deepseek/deepseek-chat:free">deepseek/deepseek-chat:free</option>
                    <option value="google/gemini-2.0-flash-lite-preview-02-05:free">google/gemini-2.0-flash-lite-preview-02-05:free</option>
                    <option value="google/gemini-2.0-flash-exp:free">google/gemini-2.0-flash-exp:free</option>
                    <option value="google/gemini-2.0-pro-exp-02-05:free">google/gemini-2.0-pro-exp-02-05:free</option>
                    <option value="google/gemini-2.0-flash-thinking-exp:free">google/gemini-2.0-flash-thinking-exp:free</option>
                    <option value="meta-llama/llama-3.3-70b-instruct:free">meta-llama/llama-3.3-70b-instruct:free</option>
                </select>
            </div>
            <div class="form-group">
                <label for="api_key">API Key:</label>
                <input type="password" id="api_key" placeholder="Enter your OpenRouter API key">
            </div>
            <div class="form-group">
                <label for="split_method">Split Method:</label>
                <select id="split_method">
                    <option value="chapter" selected>By Chapter (第X章/Chương X)</option>
                    <option value="chars">By Character Count</option>
                </select>
            </div>
            <div class="form-group">
                <label for="split_length">Characters/Words per Part:</label>
                <input type="number" id="split_length" value="1000">
            </div>
            <div class="form-group">
                <label for="prompt">Prompt:</label>
                <textarea id="prompt" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="additional_text">Additional Text:</label>
                <textarea id="additional_text" rows="8"></textarea>
            </div>
            <div>
                <button id="submit_button">Process Text</button>
                <button id="download_button" style="display: none;">Download Results</button>
            </div>
            
            <div id="progress" class="result" style="display: none;">
                <h3>Processing...</h3>
                <div id="progress_text"></div>
                <div class="progress-bar-container">
                    <div id="progress_bar" class="progress-bar"></div>
                </div>
                <div id="current_part_text"></div>
            </div>
            
            <div id="result" class="result" style="display: none;">
                <h3>Results:</h3>
                <div id="result_text"></div>
            </div>
            
            <script>
                // Global variables to store results
                let allResults = [];
                let allChapters = [];
                let timestamp = '';
                
                document.getElementById('language').addEventListener('change', function() {
                    const language = this.value;
                    const label = document.querySelector('label[for="split_length"]');
                    if (language === "ENG") {
                        label.textContent = "Words per Part:";
                    } else {
                        label.textContent = "Characters per Part:";
                    }
                });
                
                document.getElementById('submit_button').addEventListener('click', async function() {
                    const apiKey = document.getElementById('api_key').value;
                    const model = document.getElementById('model').value;
                    const language = document.getElementById('language').value;
                    const splitMethod = document.getElementById('split_method').value;
                    const splitLength = document.getElementById('split_length').value;
                    const prompt = document.getElementById('prompt').value;
                    const additionalText = document.getElementById('additional_text').value;
                    
                    if (!apiKey || !prompt || !additionalText) {
                        alert('Please fill in all required fields');
                        return;
                    }
                    
                    // Reset results
                    allResults = [];
                    allChapters = [];
                    timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    
                    document.getElementById('progress').style.display = 'block';
                    document.getElementById('result').style.display = 'none';
                    document.getElementById('download_button').style.display = 'none';
                    document.getElementById('progress_text').textContent = 'Splitting text...';
                    document.getElementById('progress_bar').style.width = '0%';
                    
                    try {
                        // First, split the text
                        const splitResponse = await fetch('/split', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                language: language,
                                split_method: splitMethod,
                                split_length: splitLength,
                                text: additionalText
                            })
                        });
                        
                        const splitData = await splitResponse.json();
                        
                        if (splitData.error) {
                            throw new Error(splitData.error);
                        }
                        
                        const chapters = splitData.chapters;
                        allChapters = chapters;
                        
                        document.getElementById('progress_text').textContent = 
                            `Text split into ${chapters.length} parts. Starting processing...`;
                        
                        // Process each chapter sequentially
                        for (let i = 0; i < chapters.length; i++) {
                            if (i > 0) {
                                // Wait between API calls to avoid rate limiting
                                document.getElementById('progress_text').textContent = 
                                    `Waiting before processing next part...`;
                                await new Promise(resolve => setTimeout(resolve, 45000));
                            }
                            
                            document.getElementById('progress_text').textContent = 
                                `Processing part ${i+1}/${chapters.length}`;
                            document.getElementById('progress_bar').style.width = 
                                `${(i / chapters.length) * 100}%`;
                            
                            // Show preview of current part being processed
                            document.getElementById('current_part_text').innerHTML = 
                                `<strong>Current part content:</strong><br><pre>${chapters[i].substring(0, 200)}...</pre>`;
                            
                            const processResponse = await fetch('/process_part', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    api_key: apiKey,
                                    model: model,
                                    prompt: prompt,
                                    chapter: chapters[i]
                                })
                            });
                            
                            const processData = await processResponse.json();
                            
                            if (processData.error) {
                                throw new Error(processData.error);
                            }
                            
                            allResults.push(processData.result);
                            
                            // Update the result area with the current result
                            document.getElementById('result').style.display = 'block';
                            document.getElementById('result_text').innerHTML = allResults.map((result, idx) => 
                                `<h4>Part ${idx+1}/${chapters.length}</h4><pre>${result}</pre>`
                            ).join('');
                        }
                        
                        // Complete
                        document.getElementById('progress_bar').style.width = '100%';
                        document.getElementById('progress_text').textContent = 
                            `Processing complete! Processed ${chapters.length} parts.`;
                        document.getElementById('download_button').style.display = 'inline-block';
                        
                    } catch (error) {
                        document.getElementById('progress_text').textContent = 'Error: ' + error.message;
                        document.getElementById('result').style.display = 'block';
                        document.getElementById('result_text').textContent = 'Error: ' + error.message;
                    }
                });
                
                document.getElementById('download_button').addEventListener('click', function() {
                    if (allResults.length === 0) {
                        alert('No results to download');
                        return;
                    }
                    
                    let content = '';
                    for (let i = 0; i < allResults.length; i++) {
                        content += `## Part ${i+1}\n`;
                        content += allResults[i] + '\n\n';
                    }
                    
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `openrouter_result_${timestamp}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            </script>
        </body>
    </html>
    """

@app.route('/split', methods=['POST'])
def split_text():
    try:
        data = request.json
        language = data.get('language')
        split_method = data.get('split_method')
        split_length = int(data.get('split_length', 1000))
        text = data.get('text')
        
        if not text:
            return jsonify({'error': 'No text provided'})
        
        # Split text based on method
        if split_method == 'chapter':
            chapters = split_by_chapter(text)
        else:
            chapters = split_by_chars(text, split_length, language)
        
        if not chapters:
            return jsonify({'error': 'Could not split text properly'})
        
        return jsonify({'chapters': chapters})
    
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/process_part', methods=['POST'])
def process_part():
    try:
        data = request.json
        api_key = data.get('api_key')
        model = data.get('model')
        prompt = data.get('prompt')
        chapter = data.get('chapter')
        
        if not api_key or not prompt or not chapter:
            return jsonify({'error': 'Missing required fields'})
        
        full_prompt = f"{prompt}\n{chapter}"
        
        # OpenRouter API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": request.headers.get('Origin', 'https://vercel.app')
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": full_prompt}
            ]
        }
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions", 
            headers=headers, 
            json=payload
        )
        
        if response.status_code != 200:
            return jsonify({'error': f"API Error: {response.text}"})
        
        result_text = response.json()['choices'][0]['message']['content']
        return jsonify({'result': result_text})
    
    except Exception as e:
        return jsonify({'error': str(e)})

def split_by_chapter(text):
    # Combine both patterns: 第X章 and Chương + number
    chapter_patterns = [
        r'第\w+章',  # Pattern for 第X章
        r'Chương\s*\d+',  # Pattern for Chương + number
    ]

    # Find all chapter markers
    chapters = []
    for pattern in chapter_patterns:
        chapters.extend([(m.group(), m.start()) for m in re.finditer(pattern, text)])

    # Sort chapters by their position
    chapters.sort(key=lambda x: x[1])

    if not chapters:
        return [text]  # Return the whole text as one chapter if no chapters found

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

def split_by_chars(text, split_length, language):
    if language == "ENG":
        # Split by word count for English
        return split_by_words(text, split_length)
    else:
        # Split by character count for other languages
        result = []
        lines = text.split('\n')
        current_chunk = []
        current_length = 0

        for line in lines:
            # If adding this line would exceed the limit and we already have content
            if current_length + len(line) > split_length and current_chunk:
                result.append('\n'.join(current_chunk))
                current_chunk = []
                current_length = 0

            # If a single line is longer than the limit, we need to split it
            if len(line) > split_length:
                # If we have accumulated content, add it first
                if current_chunk:
                    result.append('\n'.join(current_chunk))
                    current_chunk = []
                    current_length = 0
                
                # Split the long line
                for i in range(0, len(line), split_length):
                    chunk = line[i:i+split_length]
                    result.append(chunk)
            else:
                current_chunk.append(line)
                current_length += len(line) + 1  # +1 for newline

        # Don't forget the last chunk
        if current_chunk:
            result.append('\n'.join(current_chunk))

        return result

def split_by_words(text, max_words):
    """
    Splits text into chunks based on word count, ensuring no sentence is broken.
    """
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = []
    current_chunk = []
    current_word_count = 0

    for sentence in sentences:
        words_in_sentence = len(sentence.split())

        if words_in_sentence > max_words:
            # If we have accumulated content, add it first
            if current_chunk:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
                current_word_count = 0
            
            # Split the long sentence
            words = sentence.split()
            for i in range(0, len(words), max_words):
                sub_sentence = ' '.join(words[i:i+max_words])
                chunks.append(sub_sentence)
        else:
            if current_word_count + words_in_sentence <= max_words:
                current_chunk.append(sentence)
                current_word_count += words_in_sentence
            else:
                chunks.append('\n'.join(current_chunk))
                current_chunk = [sentence]
                current_word_count = words_in_sentence

    if current_chunk:
        chunks.append('\n'.join(current_chunk))

    return chunks

