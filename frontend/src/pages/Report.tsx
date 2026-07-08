import { useParams, Link } from "react-router-dom";
import { useStore, InterviewReport } from "../store/useStore";
import { ArrowLeft, Download, Target, Activity, Zap, ShieldCheck, UserFocus } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import html2pdf from "html2pdf.js";

export function Report() {
  const { id } = useParams();
  const report = useStore(state => state.reports.find(r => r.id === id));

  if (!report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
        <Link to="/dashboard" className="text-primary hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const chartData = [
    { subject: 'Technical', A: report.technicalScore, fullMark: 10 },
    { subject: 'Communication', A: report.communicationScore, fullMark: 10 },
    { subject: 'Confidence', A: report.confidenceScore, fullMark: 10 },
    { subject: 'Body Language', A: report.bodyLanguageScore, fullMark: 10 },
    { subject: 'Overall', A: report.overallScore, fullMark: 10 },
  ];

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin:       0.5,
      filename:     `InterviewAI_Report_${new Date(report.date).toLocaleDateString()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90">
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div id="report-content" className="bg-card border border-border rounded-xl shadow-sm p-8 space-y-8">
        
        {/* Header */}
        <div className="text-center border-b border-border pb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Interview Performance Report</h1>
          <p className="text-muted-foreground">Generated on {new Date(report.date).toLocaleString()}</p>
        </div>

        {/* Scores Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-primary"/> Final Scores</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center border border-border">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Overall</p>
                <p className="text-3xl font-bold text-primary">{report.overallScore}/10</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center border border-border">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Technical</p>
                <p className="text-3xl font-bold text-blue-500">{report.technicalScore}/10</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center border border-border">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Communication</p>
                <p className="text-3xl font-bold text-purple-500">{report.communicationScore}/10</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center border border-border">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
                <p className="text-3xl font-bold text-green-500">{report.confidenceScore}/10</p>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg flex items-center justify-between border border-border">
              <div className="flex items-center gap-2">
                <UserFocus className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-muted-foreground">Body Language (CV Analytics)</span>
              </div>
              <span className="text-2xl font-bold text-orange-500">{report.bodyLanguageScore}/10</span>
            </div>
          </div>

          <div className="h-[300px] w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar name="Candidate" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-600 flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> Key Strengths</h3>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-foreground p-3 bg-green-500/10 rounded-md border border-green-500/20">
                  <span className="text-green-600 font-bold">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-destructive flex items-center gap-2"><Activity className="w-5 h-5"/> Areas to Improve</h3>
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2 text-foreground p-3 bg-red-500/10 rounded-md border border-red-500/20">
                  <span className="text-red-500 font-bold">×</span> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border">
            <h3 className="text-xl font-bold text-blue-500 flex items-center gap-2 mb-4"><Zap className="w-5 h-5"/> Improvement Suggestions</h3>
            <ul className="space-y-2">
              {report.improvementSuggestions.map((s, i) => (
                <li key={i} className="flex gap-3 text-foreground p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <span className="text-blue-500 font-bold">{i+1}.</span> {s}
                </li>
              ))}
            </ul>
        </div>
      </div>
    </div>
  );
}
