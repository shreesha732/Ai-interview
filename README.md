# InterviewAI 🚀

InterviewAI is a state-of-the-art SaaS platform designed to simulate real-world technical and behavioral interviews using advanced AI. It analyzes a candidate's resume, generates adaptive questions, tracks eye contact/body language via MediaPipe, and evaluates verbal responses using NLP to provide a comprehensive performance report.

## 🌟 Features

- **Beautiful Modern UI**: Built with React, Vite, Tailwind CSS v4, and Framer Motion for a premium SaaS feel.
- **Secure Authentication**: Clerk integration for seamless and secure user login/signup.
- **Smart Resume Parsing**: Upload your PDF resume, and our LLM extracts your skills to tailor the interview.
- **Adaptive AI Interviews**: Questions dynamically scale in difficulty based on your previous answers.
- **Real-Time Webcam Analysis**: Client-side tracking of eye contact, posture, and attention using MediaPipe.
- **Voice Transcription**: Live audio transcription to evaluate speaking pace, filler words, and clarity.
- **NLP Evaluation Engine**: Instant feedback on grammar, relevance, technical accuracy, and STAR format adherence.
- **Comprehensive Analytics**: Dashboard with historical performance, average scores, and detailed PDF reports.

## 🏗 Architecture

- **Frontend**: React (TypeScript), Vite, Tailwind CSS v4, Zustand, Framer Motion, React-Webcam.
- **Backend**: Python, Flask, PyPDF2, LangChain, OpenAI/Gemini.
- **Database**: PostgreSQL (via Supabase), SQLAlchemy.
- **Auth**: Clerk.

## 🛠 Local Setup Instructions

### 1. Frontend Setup
```bash
cd frontend
npm install
# Create a .env file and add your Clerk Publishable Key:
# VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
npm run dev
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
# Run the Flask server
python app.py
```

## 🚀 Deployment Guide

### Frontend (Vercel)
1. Push the repository to GitHub.
2. Import the `frontend` directory into Vercel.
3. Set the Framework Preset to `Vite`.
4. Add the `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` environment variables.
5. Deploy.

### Backend (Render)
1. In Render, create a new Web Service.
2. Connect your GitHub repository.
3. Set the Root Directory to `backend`.
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `gunicorn app:app`
6. Add necessary Environment Variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_KEY`: Your Supabase Anon Key
   - `FRONTEND_URL`: URL of your deployed frontend (optional, for CORS)
7. Deploy.

## 📄 License
This project is licensed under the MIT License.
