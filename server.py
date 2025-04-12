from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)

@app.route('/api/endpoint', methods=['POST'])
def fact_check():
    data = request.json
    tweet_text = data.get('text', '')

    if not tweet_text:
        return jsonify({'error': 'No text provided'}), 400
    

    try: 
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": f"Fact check the following tweet: {tweet_text}"}
            ],
            max_tokens=200,
            n=1,
            stop=None,
            temperature=0.7
        )

        fact_check_result = response.choices[0].message.content.strip()

        if not fact_check_result:
            return jsonify({'error': 'No response from OpenAI'}), 500
        
        return jsonify({'fact_check': fact_check_result}), 200

    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5000)
    