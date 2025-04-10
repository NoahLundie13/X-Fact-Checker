from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)  

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")
)

@app.route('/api/endpoint', methods=['POST'])
def process_tweet():
    data = request.json
    tweet_text = data.get('text', '')
    
    if not tweet_text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        response = client.responses.create(
        model="gpt-4",
        instructions="You are going to fact check this tweet, as unbiasedly as possible. Be very concise, only state relevent facts. Because these are tweets, they are often not backed up claims, or don't see the full picute, so add context if possible. Do not share opinions. Also, state eiter True, False, or Opinion and give reasons for why and why not.",
        input = tweet_text
    )
        
        fact_check_result = response.output_text
        
        return jsonify({"fact_check": fact_check_result})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)




