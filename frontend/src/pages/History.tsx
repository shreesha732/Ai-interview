import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useAuth } from "@clerk/clerk-react";
import { Calendar, Target, Activity, FileText, ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function History() {
  const { reports, fetchReports, isLoadingReports } = useStore();
  const { getToken } = useAuth();

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      if (token) fetchReports(token);
    };
    load();
  }, [fetchReports, getToken]);

  if (isLoadingReports) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare data for the trend chart
  const trendData = [...reports].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString(),
    score: r.overallScore
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Interview History & Analytics</h1>
        <p className="text-muted-foreground">Track your progress, review past reports, and identify areas for improvement.</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">No Interviews Yet</h2>
          <p className="text-muted-foreground mb-6">Complete your first practice interview to unlock powerful analytics.</p>
          <Link to="/dashboard/interview" className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition-opacity">
            Start Practicing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Performance Trends Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Overall Performance Trend
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Stats */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Interviews</h3>
              <p className="text-4xl font-bold">{reports.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Average Score</h3>
              <p className="text-4xl font-bold text-primary">
                {(reports.reduce((acc, r) => acc + r.overallScore, 0) / reports.length).toFixed(1)}/10
              </p>
            </div>
          </div>

          {/* History List */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Past Reports
            </h2>
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-border">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 sm:p-6 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center text-primary font-bold">
                        {report.overallScore}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{report.mode} Interview</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase">Tech</p>
                        <p className="font-semibold text-blue-500">{report.technicalScore}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase">Comm</p>
                        <p className="font-semibold text-purple-500">{report.communicationScore}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase">Body</p>
                        <p className="font-semibold text-orange-500">{report.bodyLanguageScore}</p>
                      </div>
                      <Link 
                        to={`/dashboard/report/${report.id}`} 
                        className="ml-auto sm:ml-4 flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
                      >
                        View Report <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
