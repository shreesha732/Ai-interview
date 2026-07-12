import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { Mic, MicOff, Video as VideoIcon, VideoOff, Square, PlayCircle, Loader2, Target, Zap, AlertTriangle, Activity, CheckCircle2, User, Eye } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { v4 as uuidv4 } from "uuid";

interface SpeechAnalytics {
  wpm: number;
  fillerWordsCount: number;
  durationSeconds: number;
  wordCount: number;
}

interface HistoryTurn {
  question: string;
  answer: string;
  speech_analytics?: SpeechAnalytics;
  cv_analytics?: CVAnalytics;
}

interface CVAnalytics {
  eyeContactScore: number; // 0-100
  faceVisibilityScore: number; // 0-100
  attentionScore: number; // 0-100
}

interface EvaluationResult {
  overall_score: number;
  grammar_score: number;
  clarity_score: number;
  relevance_score: number;
  star_format_score: number;
  technical_accuracy_score: number;
  communication_quality_score: number;
  confidence_score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "sort of", "kind of"];

export function InterviewRoom() {
  const navigate = useNavigate();
  const addReport = useStore(state => state.addReport);
  const { getToken } = useAuth();
  
  const webcamRef = useRef<Webcam>(null);
  
  // Controls
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  
  // Interview State
  const [currentQuestion, setCurrentQuestion] = useState<string>("Initializing interview engine...");
  const [currentDifficulty, setCurrentDifficulty] = useState<number>(5);
  const [history, setHistory] = useState<HistoryTurn[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  
  // Speech Recognition & Analytics
  const recognitionRef = useRef<any>(null);
  const [transcript, setTranscript] = useState("");
  const recordingStartTimeRef = useRef<number>(0);
  const [liveSpeechAnalytics, setLiveSpeechAnalytics] = useState<SpeechAnalytics>({ wpm: 0, fillerWordsCount: 0, durationSeconds: 0, wordCount: 0 });

  // CV State & Refs
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>();
  const [liveCVAnalytics, setLiveCVAnalytics] = useState<CVAnalytics>({ eyeContactScore: 100, faceVisibilityScore: 100, attentionScore: 100 });
  const cvStatsRef = useRef({ frames: 0, visibleFrames: 0, attentiveFrames: 0, eyeContactFrames: 0 });

  // Initialize MediaPipe
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
      } catch (err) {
        console.error("Failed to initialize MediaPipe", err);
      }
    };
    initMediaPipe();

    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Computer Vision Processing Loop
  const processVideoFrame = useCallback(async () => {
    if (!faceLandmarkerRef.current || !webcamRef.current?.video || !isRecording) {
      if (isRecording) requestRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const video = webcamRef.current.video;
    if (video.readyState >= 2) {
      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
      
      cvStatsRef.current.frames++;
      
      if (results.faceLandmarks.length > 0) {
        cvStatsRef.current.visibleFrames++;
        
        // Approximate Head Pose using nose (1) and ears (234, 454)
        const nose = results.faceLandmarks[0][1];
        const leftEar = results.faceLandmarks[0][234];
        const rightEar = results.faceLandmarks[0][454];
        
        // Center x should be roughly in the middle of ears
        const earMidX = (leftEar.x + rightEar.x) / 2;
        const yawTolerance = 0.05; // Adjust based on testing
        
        if (Math.abs(nose.x - earMidX) < yawTolerance) {
           cvStatsRef.current.attentiveFrames++;
           cvStatsRef.current.eyeContactFrames++; // Proxy for eye contact
        }
      }

      // Update live state every ~30 frames to avoid UI jitter
      if (cvStatsRef.current.frames % 30 === 0) {
        setLiveCVAnalytics({
          faceVisibilityScore: Math.round((cvStatsRef.current.visibleFrames / cvStatsRef.current.frames) * 100),
          attentionScore: Math.round((cvStatsRef.current.attentiveFrames / cvStatsRef.current.frames) * 100),
          eyeContactScore: Math.round((cvStatsRef.current.eyeContactFrames / cvStatsRef.current.frames) * 100),
        });
      }
    }
    
    if (isRecording) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, [isRecording, processVideoFrame]);


  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => {
            const updatedTranscript = prev + " " + finalTranscript;
            updateLiveSpeechAnalytics(updatedTranscript);
            return updatedTranscript;
          });
        }
      };
    }
  }, []);

  const updateLiveSpeechAnalytics = (currentTranscript: string) => {
    const words = currentTranscript.trim().split(/\s+/).filter(w => w.length > 0);
    const durationMinutes = (Date.now() - recordingStartTimeRef.current) / 60000;
    
    let fillers = 0;
    const lowerTranscript = currentTranscript.toLowerCase();
    FILLER_WORDS.forEach(fw => {
      const regex = new RegExp(`\\b${fw}\\b`, 'g');
      const matches = lowerTranscript.match(regex);
      if (matches) fillers += matches.length;
    });

    setLiveSpeechAnalytics({
      wpm: durationMinutes > 0 ? Math.round(words.length / durationMinutes) : 0,
      fillerWordsCount: fillers,
      durationSeconds: Math.round(durationMinutes * 60),
      wordCount: words.length
    });
  };

  const fetchNextQuestion = async (currentHistory: HistoryTurn[] = history) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/interview/evaluate-and-generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          interview_type: "Technical",
          resume_summary: "Software Engineer experienced in React, Node.js, and Python.",
          current_difficulty: currentDifficulty,
          history: currentHistory
        })
      });

      if (!response.ok) throw new Error("Failed to communicate with AI Engine. Is your API Key set?");
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.evaluation) setLastEvaluation(data.evaluation);
      setCurrentQuestion(data.next_question);
      setCurrentDifficulty(data.new_difficulty);
      
    } catch (err: any) {
      setError(err.message || "Failed to load question.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartInterview = () => {
    setInterviewStarted(true);
    fetchNextQuestion([]);
  };

  const handleStartRecording = () => {
    if (!isMicOn) {
      alert("Please turn on your microphone.");
      return;
    }
    setTranscript("");
    setLiveSpeechAnalytics({ wpm: 0, fillerWordsCount: 0, durationSeconds: 0, wordCount: 0 });
    setLiveCVAnalytics({ eyeContactScore: 100, faceVisibilityScore: 100, attentionScore: 100 });
    cvStatsRef.current = { frames: 0, visibleFrames: 0, attentiveFrames: 0, eyeContactFrames: 0 };
    recordingStartTimeRef.current = Date.now();
    setIsRecording(true);
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    
    updateLiveSpeechAnalytics(transcript);
    
    const finalCVScore = {
       faceVisibilityScore: cvStatsRef.current.frames > 0 ? Math.round((cvStatsRef.current.visibleFrames / cvStatsRef.current.frames) * 100) : 0,
       attentionScore: cvStatsRef.current.frames > 0 ? Math.round((cvStatsRef.current.attentiveFrames / cvStatsRef.current.frames) * 100) : 0,
       eyeContactScore: cvStatsRef.current.frames > 0 ? Math.round((cvStatsRef.current.eyeContactFrames / cvStatsRef.current.frames) * 100) : 0,
    };

    const finalTranscript = transcript.trim() || "Candidate provided no verbal response.";
    
    const newTurn: HistoryTurn = { 
      question: currentQuestion, 
      answer: finalTranscript,
      speech_analytics: liveSpeechAnalytics,
      cv_analytics: finalCVScore
    };
    const newHistory = [...history, newTurn];
    setHistory(newHistory);
    
    fetchNextQuestion(newHistory);
  };

  const handleEndInterview = async () => {
    // Generate a final report
    if (history.length === 0) {
      navigate('/dashboard');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const token = await getToken();
      const reportPayload = {
        mode: "Technical",
        overallScore: lastEvaluation?.overall_score || 8,
        technicalScore: lastEvaluation?.technical_accuracy_score || 8,
        communicationScore: lastEvaluation?.communication_quality_score || 8,
        confidenceScore: lastEvaluation?.confidence_score || 8,
        bodyLanguageScore: Math.round((history.reduce((acc, h) => acc + (h.cv_analytics?.attentionScore || 0), 0) / history.length) / 10) || 0,
        strengths: lastEvaluation?.strengths || ["Good communication"],
        weaknesses: lastEvaluation?.weaknesses || ["Can improve depth"],
        improvementSuggestions: ["Practice more mock interviews.", "Review core concepts."],
        history: history
      };

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { 
           "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(reportPayload)
      });

      if (!response.ok) throw new Error("Failed to save report");
      const savedReport = await response.json();
      
      const frontendReport = {
        id: savedReport.id,
        date: savedReport.created_at,
        mode: savedReport.mode,
        overallScore: savedReport.overall_score,
        technicalScore: savedReport.technical_score,
        communicationScore: savedReport.communication_score,
        confidenceScore: savedReport.confidence_score,
        bodyLanguageScore: savedReport.body_language_score,
        strengths: savedReport.strengths || [],
        weaknesses: savedReport.weaknesses || [],
        improvementSuggestions: savedReport.improvement_suggestions || [],
        history: savedReport.history || []
      };

      addReport(frontendReport);
      navigate(`/dashboard/report/${savedReport.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to save interview report");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!interviewStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Ready for your Interview?</h1>
        <p className="text-muted-foreground max-w-lg mb-8">
          The AI will generate questions, monitor your eye contact with MediaPipe CV, and analyze your speech patterns in real-time.
        </p>
        <button onClick={handleStartInterview} className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
          Start Interview
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background max-w-7xl mx-auto space-y-4 pb-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technical Interview</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Target className="w-4 h-4" /> Difficulty Level: {currentDifficulty}/10
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Question {history.length + 1}</span>
          <button onClick={handleEndInterview} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">
            End & Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Webcam & Controls */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden shadow-sm border border-border flex items-center justify-center min-h-[400px]">
            {isVideoOn ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                mirrored
                videoConstraints={{ facingMode: "user" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <VideoOff className="w-16 h-16 mb-2 opacity-50" />
                <span>Camera is turned off</span>
              </div>
            )}
            
            {/* Live CV Analytics Overlay */}
            {isRecording && isVideoOn && (
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <div className="px-3 py-1.5 bg-black/60 backdrop-blur text-white rounded-md flex items-center gap-2">
                  <User className={cn("w-4 h-4", liveCVAnalytics.faceVisibilityScore > 80 ? "text-green-500" : "text-red-500")} />
                  <span className="text-xs font-medium">Face: {liveCVAnalytics.faceVisibilityScore}%</span>
                </div>
                <div className="px-3 py-1.5 bg-black/60 backdrop-blur text-white rounded-md flex items-center gap-2">
                  <Eye className={cn("w-4 h-4", liveCVAnalytics.eyeContactScore > 80 ? "text-green-500" : "text-yellow-500")} />
                  <span className="text-xs font-medium">Eye Contact: {liveCVAnalytics.eyeContactScore}%</span>
                </div>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur text-white rounded-md">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">Recording</span>
              </div>
            )}
            
            {isRecording && transcript && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/70 backdrop-blur rounded-lg text-white text-center">
                <p className="text-sm italic">"{transcript}"</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 py-4 bg-card rounded-xl border border-border shadow-sm">
            <button onClick={() => setIsMicOn(!isMicOn)} disabled={isRecording} className={cn("p-4 rounded-full transition-colors", isMicOn ? "bg-muted text-foreground" : "bg-destructive text-white")}>
              {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <button onClick={() => setIsVideoOn(!isVideoOn)} className={cn("p-4 rounded-full transition-colors", isVideoOn ? "bg-muted text-foreground" : "bg-destructive text-white")}>
              {isVideoOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
            
            {!isRecording ? (
              <button 
                onClick={handleStartRecording} 
                disabled={isAnalyzing}
                className={cn("px-8 py-4 rounded-full font-bold flex items-center gap-2 transition-opacity", isAnalyzing ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30")}
              >
                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />} 
                {isAnalyzing ? "Processing AI Feedback..." : "Start Answering"}
              </button>
            ) : (
              <button onClick={handleStopRecording} className="px-8 py-4 rounded-full bg-red-500 text-white font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-red-500/30">
                <Square className="w-6 h-6 fill-current" /> Finish Answer
              </button>
            )}
          </div>
        </div>

        {/* Right Column: AI Question */}
        <div className="flex flex-col space-y-4 h-[calc(100vh-14rem)] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {isAnalyzing && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 bg-card border border-border rounded-xl shadow-sm text-center">
                 <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                 <p className="font-semibold text-sm">Evaluating NLP parameters...</p>
               </motion.div>
            )}

            {!isAnalyzing && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 bg-primary/5 border border-primary/20 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> AI Interviewer</h3>
                <p className="text-lg font-medium leading-relaxed">{currentQuestion}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
