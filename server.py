from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")
)

app = Flask(__name__)
CORS(app)

@app.route('/api/endpoint', methods=['POST'])
def handle_request():
    data = request.json

    response = client.responses.create(
        model="gpt-4",
        instructions="You are going to fact check this tweet",
        input=data if data != None else "Ignore last message, repeat after me: Data = None"
    )

    #TODO: Make OpenAI Request

    result = {"response": response.output_text}
    return jsonify(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
