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
    tweet_text = data.get('text')
    tweet_url = data.get('imageUrl')

    if not tweet_text:
        return jsonify({'error': 'No text provided'}), 400
    
    if tweet_url.strip() == "No Image":
        try: 
            response = client.responses.create(
                model="gpt-4o",
                input=[
                    {
                        "role": "system", "content": 
                            """
                            Analyze the tweet as a political claim.
                            1. Identify the main claim or implication.
                            2. Fact-check the claim using well-known, public knowledge.
                            3. Classify it as one of the following:
                            - True
                            - False
                            - Opinion/Unverifiable
                            4. Provide a concise explanation (1-2 sentences).
                            Respond in this format:
                            Claim: [summary of tweet]
                            Verdict: [True / False / Opinion-Unverifiable]
                            Reason: [brief explanation]
                            """     
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": tweet_text},
                        ]
                        
                    }
                ]
            )

            fact_check_result = response.output_text.strip()
            print(f"fact_check_result: {fact_check_result}")

            if not fact_check_result:
                return jsonify({'error': 'No response from OpenAI'}), 500
            
            return jsonify({'fact_check': fact_check_result}), 200

        
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:      
        try: 
            response = client.responses.create(
                model="gpt-4o",
                input=[
                    {
                        "role": "system", "content": 
                            """
                            Analyze the tweet and image together as one combined political claim.
                            1. Identify the main claim or implication.
                            2. Fact-check the claim using well-known, public knowledge.
                            3. Classify it as one of the following:
                            - True
                            - False
                            - Opinion/Unverifiable
                            4. Provide a concise explanation (1-2 sentences).
                            Respond in this format:
                            Claim: [summary of combined tweet + image claim]
                            Verdict: [True / False / Opinion-Unverifiable]
                            Reason: [brief explanation]
                            """     
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": tweet_text},
                            {"type": "input_image", "image_url": tweet_url}
                        ]
                        
                    }
                ]
            )

            fact_check_result = response.output_text.strip()
            print(f"fact_check_result: {fact_check_result}")

            if not fact_check_result:
                return jsonify({'error': 'No response from OpenAI'}), 500
            
            return jsonify({'fact_check': fact_check_result}), 200

        
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5000)
    