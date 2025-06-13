import os
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

ALLOWED_ORIGINS = ["chrome-extension://ibphbngjmkcanmmfmfhcjkgiklgbfgee"]

app = Flask(__name__)
CORS(app)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)


@app.route("/api/endpoint", methods=["POST"])
def fact_check():
    data = request.json
    tweet_text = data.get("text") if data and isinstance(data, dict) else None
    tweet_url = data.get("imageUrl") if data and isinstance(data, dict) else None

    if not tweet_text:
        return jsonify({"error": "No text provided"}), 400

    if not tweet_url:
        return jsonify({"error": "No image provided"}), 400

    current_time = datetime.now()
    current_date = current_time.date()

    if tweet_url.strip() == "No Image":
        try:
            response = client.responses.create(
                model="gpt-4.1",
                input=[
                    {
                        "role": "system",
                        "content": f"""
                            Analyze the tweet as a political claim.
                            1. Search the web for the most recent information possible, as of {current_date}, and Identify the main claim or implication.
                            2. Fact-check the claim using the well-known, public knowledge that you found in the first step.
                            3. Classify it as one of the following:
                            - True
                            - False
                            - Opinion
                            - Unverifiable
                            4. Provide a concise explanation (1-2 sentences).
                            Respond in this format:
                            Claim: [summary of tweet]
                            Verdict: [True / False / Opinion / Unverifiable]
                            Reason: [brief explanation]
                            """,
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": tweet_text},
                        ],
                    },
                ],
            )

            fact_check_result = response.output_text.strip()

            if not fact_check_result:
                return jsonify({"error": "No response from OpenAI"}), 500

            return jsonify({"fact_check": fact_check_result}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        try:
            response = client.responses.create(
                model="gpt-4.1",
                input=[
                    {
                        "role": "system",
                        "content": """
                             Analyze the tweet and image together as one combined political claim.
                                1. Using the most up-to-date info, as of June 13, 2025, identify the main claim or implication.
                                2. Fact-check the claim using well-known, public knowledge.
                                3. Classify it as one of the following:
                                  - True
                                 - False
                                 - Opinion
                                 - Unverifiable
                                4. Provide a concise explanation (1-2 sentences).
                                Respond in this format:
                                Claim: [summary of combined tweet + image claim]
                                Verdict: [True / False / Opinion / Unverifiable]
                             Reason: [brief explanation]
                        """,
                    },
                    {
                        "role": "user",
                        "content": f"Tweet: {tweet_text}\nImage URL: {tweet_url}",
                    },
                ],
            )

            fact_check_result = response.output_text.strip()
            print(f"fact_check_result: {fact_check_result}")

            if not fact_check_result:
                return jsonify({"error": "No response from OpenAI"}), 500

            return jsonify({"fact_check": fact_check_result}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run()
