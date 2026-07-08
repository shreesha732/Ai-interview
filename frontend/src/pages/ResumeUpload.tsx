import { useState } from "react";
import { UploadCloud, File, Trash2, CheckCircle2, Loader2, Briefcase, GraduationCap, Code, Award, Target } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";

interface ResumeData {
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
}

export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      setResumeData(null);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResumeData(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("resume", file);
      
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = await getToken();
      
      const response = await fetch(`${API_URL}/api/parse-resume`, { 
        method: "POST", 
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse resume");
      }

      const data: ResumeData = await response.json();
      setResumeData(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Resume Analysis</h1>
        <p className="text-muted-foreground">Upload your PDF resume. Our AI will analyze your skills and tailor interview questions for you.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        {!file ? (
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Drag and drop your PDF</h3>
            <p className="text-muted-foreground text-sm mb-6">or click to browse from your computer</p>
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              id="file-upload" 
              onChange={handleFileChange} 
            />
            <label 
              htmlFor="file-upload" 
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              Browse Files
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <File className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {!isUploading && !resumeData && (
                <button onClick={() => setFile(null)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              {resumeData && <CheckCircle2 className="w-6 h-6 text-green-500" />}
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                <p className="font-medium">Error: {error}</p>
              </div>
            )}

            {!resumeData ? (
              <button 
                onClick={handleUpload} 
                disabled={isUploading}
                className={cn(
                  "w-full py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition-all",
                  isUploading ? "bg-primary/70 text-primary-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Parsing Resume with AI...
                  </>
                ) : (
                  "Analyze Resume"
                )}
              </button>
            ) : (
              <div className="flex justify-between items-center">
                <h3 className="text-green-600 font-semibold flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5" /> Resume Parsed Successfully!
                </h3>
                <button onClick={() => { setFile(null); setResumeData(null); }} className="text-sm font-medium text-muted-foreground hover:text-foreground underline transition-colors">
                  Upload another resume
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {resumeData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Skills */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-purple-500"/> Core Skills</h3>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-500"/> Experience</h3>
            <ul className="space-y-3">
              {resumeData.experience.map((exp, i) => (
                <li key={i} className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {exp}
                </li>
              ))}
            </ul>
          </div>

          {/* Education */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-green-500"/> Education</h3>
            <ul className="space-y-3">
              {resumeData.education.map((edu, i) => (
                <li key={i} className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {edu}
                </li>
              ))}
            </ul>
          </div>

          {/* Projects & Certs */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-orange-500"/> Projects</h3>
              <ul className="space-y-3">
                {resumeData.projects.map((proj, i) => (
                  <li key={i} className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {proj}
                  </li>
                ))}
                {resumeData.projects.length === 0 && <li className="text-sm text-muted-foreground">No projects found.</li>}
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500"/> Certifications</h3>
              <ul className="space-y-3">
                {resumeData.certifications.map((cert, i) => (
                  <li key={i} className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {cert}
                  </li>
                ))}
                {resumeData.certifications.length === 0 && <li className="text-sm text-muted-foreground">No certifications found.</li>}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
