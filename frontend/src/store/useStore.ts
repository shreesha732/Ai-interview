import { create } from 'zustand';

export interface InterviewReport {
  id: string;
  date: string;
  mode: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  bodyLanguageScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  history: any[];
}

interface AppState {
  reports: InterviewReport[];
  resumes: any[];
  isLoadingReports: boolean;
  isLoadingResumes: boolean;
  error: string | null;
  
  fetchReports: (token: string) => Promise<void>;
  fetchResumes: (token: string) => Promise<void>;
  
  // Local state update for optimistic UI or direct push after backend success
  addReport: (report: InterviewReport) => void;
  addResume: (resume: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useStore = create<AppState>()((set) => ({
  reports: [],
  resumes: [],
  isLoadingReports: false,
  isLoadingResumes: false,
  error: null,
  
  addReport: (report) => set((state) => ({ reports: [report, ...state.reports] })),
  addResume: (resume) => set((state) => ({ resumes: [resume, ...state.resumes] })),
  
  fetchReports: async (token: string) => {
    set({ isLoadingReports: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      
      // Map DB snake_case fields to camelCase for the frontend if needed, 
      // but let's assume the frontend maps them properly or we adjust here.
      const mappedReports = data.map((d: any) => ({
        id: d.id,
        date: d.created_at,
        mode: d.mode,
        overallScore: d.overall_score,
        technicalScore: d.technical_score,
        communicationScore: d.communication_score,
        confidenceScore: d.confidence_score,
        bodyLanguageScore: d.body_language_score,
        strengths: d.strengths || [],
        weaknesses: d.weaknesses || [],
        improvementSuggestions: d.improvement_suggestions || [],
        history: d.history || []
      }));

      set({ reports: mappedReports, isLoadingReports: false });
    } catch (err: any) {
      set({ error: err.message, isLoadingReports: false });
    }
  },
  
  fetchResumes: async (token: string) => {
    set({ isLoadingResumes: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/resumes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch resumes');
      const data = await response.json();
      set({ resumes: data, isLoadingResumes: false });
    } catch (err: any) {
      set({ error: err.message, isLoadingResumes: false });
    }
  }
}));
