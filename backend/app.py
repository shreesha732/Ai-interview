import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import PyPDF2
from werkzeug.utils import secure_filename
from supabase import create_client, Client

load_dotenv()

app = Flask(__name__)
# Allow requests from our frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "InterviewAI Backend is running", "supabase_connected": supabase is not None}), 200

from pydantic import BaseModel, Field
from typing import List, Optional, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from prompts import EVALUATE_ANSWER_PROMPT, GENERATE_QUESTION_PROMPT

class ResumeData(BaseModel):
    skills: List[str] = Field(description="List of technical and soft skills extracted from the resume.")
    education: List[str] = Field(description="List of educational degrees, institutions, and years.")
    experience: List[str] = Field(description="List of work experiences including roles, companies, and brief descriptions.")
    projects: List[str] = Field(description="List of notable projects mentioned in the resume.")
    certifications: List[str] = Field(description="List of certifications or licenses.")

class EvaluationResult(BaseModel):
    overall_score: int = Field(description="Overall score between 1 and 10 based on the quality of the answer.")
    grammar_score: int = Field(description="Score between 1 and 10 for grammar.")
    clarity_score: int = Field(description="Score between 1 and 10 for clarity.")
    relevance_score: int = Field(description="Score between 1 and 10 for relevance to the question.")
    star_format_score: int = Field(description="Score between 1 and 10 for using the STAR format.")
    technical_accuracy_score: int = Field(description="Score between 1 and 10 for technical accuracy.")
    communication_quality_score: int = Field(description="Score between 1 and 10 for communication quality, incorporating speech analytics.")
    confidence_score: int = Field(description="Score between 1 and 10 for candidate's perceived confidence.")
    feedback: str = Field(description="Detailed, constructive feedback for the candidate.")
    strengths: List[str] = Field(description="Key strengths in the candidate's answer.")
    weaknesses: List[str] = Field(description="Areas of improvement in the candidate's answer.")

class NextQuestion(BaseModel):
    question: str = Field(description="The exact text of the next interview question to ask.")
    expected_difficulty: int = Field(description="The difficulty level of the generated question (1-10).")

import jwt

def get_user_id():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split('Bearer ')[1]
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get("sub")
    except Exception:
        return None

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing Clerk userId."}), 401

    if 'resume' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Extract text
            text = ""
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
            
            os.remove(filepath)
            
            if not text.strip():
                 return jsonify({"error": "Could not extract text from the PDF."}), 400

            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                return jsonify({"error": "Gemini API Key is missing."}), 500

            llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-2.0-flash", google_api_key=api_key)
            parser = PydanticOutputParser(pydantic_object=ResumeData)
            
            prompt = PromptTemplate(
                template="Extract the following information from the resume text.\n{format_instructions}\nResume Text:\n{resume_text}\n",
                input_variables=["resume_text"],
                partial_variables={"format_instructions": parser.get_format_instructions()},
            )
            
            chain = prompt | llm | parser
            parsed_resume = chain.invoke({"resume_text": text})
            
            data = parsed_resume.dict()
            
            if supabase:
                try:
                    supabase.table('resumes').insert({
                        "user_id": user_id,
                        "skills": data.get("skills", []),
                        "education": data.get("education", []),
                        "experience": data.get("experience", []),
                        "projects": data.get("projects", []),
                        "certifications": data.get("certifications", [])
                    }).execute()
                except Exception as db_err:
                    print(f"Failed to save resume to Supabase: {db_err}")

            return jsonify(data), 200
            
        except Exception as e:
            return jsonify({"error": f"Failed to process resume: {str(e)}"}), 500
            
    return jsonify({"error": "Invalid file type. Please upload a PDF."}), 400

@app.route('/api/resumes', methods=['GET'])
def get_resumes():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
        
    try:
        response = supabase.table('resumes').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/interview/evaluate-and-generate', methods=['POST'])
def evaluate_and_generate():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    interview_type = data.get('interview_type', 'Technical')
    resume_summary = data.get('resume_summary', 'No resume provided.')
    current_difficulty = data.get('current_difficulty', 5)
    history = data.get('history', []) 
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "Missing Gemini API Key in backend configuration."}), 500
        
    llm = ChatGoogleGenerativeAI(temperature=0.7, model="gemini-2.0-flash", google_api_key=api_key)
    
    evaluation = None
    next_difficulty = current_difficulty
    
    if history and history[-1].get('answer'):
        last_turn = history[-1]
        eval_parser = PydanticOutputParser(pydantic_object=EvaluationResult)
        
        eval_chain = EVALUATE_ANSWER_PROMPT | llm | eval_parser
        
        try:
            evaluation = eval_chain.invoke({
                "interview_type": interview_type,
                "question": last_turn.get('question', ''),
                "answer": last_turn.get('answer', ''),
                "speech_analytics": str(last_turn.get('speech_analytics', 'No speech analytics provided.')),
                "format_instructions": eval_parser.get_format_instructions()
            })
            
            if evaluation.overall_score >= 8:
                next_difficulty = min(10, current_difficulty + 1)
            elif evaluation.overall_score <= 4:
                next_difficulty = max(1, current_difficulty - 1)
        except Exception as e:
            print("Evaluation failed:", e)
            pass
            
    previous_questions = "\n".join([f"- {h['question']}" for h in history]) if history else "None"
    
    q_parser = PydanticOutputParser(pydantic_object=NextQuestion)
    q_prompt = GENERATE_QUESTION_PROMPT.partial(format_instructions=q_parser.get_format_instructions())
    
    q_chain = q_prompt | llm | q_parser
    
    try:
        next_q = q_chain.invoke({
            "interview_type": interview_type,
            "resume_summary": resume_summary,
            "difficulty": next_difficulty,
            "previous_questions": previous_questions
        })
        
        return jsonify({
            "evaluation": evaluation.dict() if evaluation else None,
            "next_question": next_q.question,
            "new_difficulty": next_q.expected_difficulty
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to generate next question: {str(e)}"}), 500

@app.route('/api/reports', methods=['POST'])
def save_report():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
        
    data = request.json
    try:
        payload = {
            "user_id": user_id,
            "mode": data.get("mode", "Technical"),
            "overall_score": data.get("overallScore", 0),
            "technical_score": data.get("technicalScore", 0),
            "communication_score": data.get("communicationScore", 0),
            "confidence_score": data.get("confidenceScore", 0),
            "body_language_score": data.get("bodyLanguageScore", 0),
            "strengths": data.get("strengths", []),
            "weaknesses": data.get("weaknesses", []),
            "improvement_suggestions": data.get("improvementSuggestions", []),
            "history": data.get("history", [])
        }
        response = supabase.table('interview_reports').insert(payload).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
        
    try:
        response = supabase.table('interview_reports').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report(report_id):
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
        
    try:
        response = supabase.table('interview_reports').select('*').eq('id', report_id).eq('user_id', user_id).execute()
        if not response.data:
            return jsonify({"error": "Report not found"}), 404
        return jsonify(response.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
