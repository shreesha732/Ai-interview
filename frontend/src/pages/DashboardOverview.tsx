import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, BarChart3, FileText, ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { useAuth } from "@clerk/clerk-react";

export function DashboardOverview() {
  const { reports, fetchReports, isLoadingReports } = useStore();
  const { getToken } = useAuth();

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      if (token) fetchReports(token);
    };
    load();
  }, [fetchReports, getToken]);

  const avgScore = reports.length > 0 
    ? (reports.reduce((acc, r) => acc + r.overallScore, 0) / reports.length).toFixed(1)
    : "--";

  const recentReports = reports.slice(0, 3); // Top 3

  if (isLoadingReports) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Here is an overview of your interview preparation progress.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div whileHover={{ y: -4 }} className="p-6 bg-primary text-primary-foreground rounded-xl shadow-sm border border-primary/20 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Start New Interview</h3>
            <p className="text-primary-foreground/80 text-sm mb-4">Practice with adaptive AI tailored to your skills.</p>
          </div>
          <Link to="/dashboard/interview" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-background text-foreground rounded-lg font-medium hover:bg-background/90 transition-colors w-full shadow-sm">
            <Plus className="w-4 h-4" /> Start Now
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500"/> Resumes</h3>
            <p className="text-muted-foreground text-sm mb-4">Upload and parse your latest resume to customize questions.</p>
          </div>
          <Link to="/dashboard/resumes" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Manage Resumes <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-green-500"/> Average Score</h3>
            <div className="text-4xl font-bold text-foreground mt-4 mb-1">{avgScore}{reports.length > 0 && <span className="text-lg text-muted-foreground font-medium">/10</span>}</div>
            <p className="text-muted-foreground text-sm">{reports.length} interviews completed</p>
          </div>
          <Link to="/dashboard/history" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mt-4">
            View Analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Interviews</h2>
          {reports.length > 0 && (
            <Link to="/dashboard/history" className="text-sm font-medium text-primary hover:underline">View all</Link>
          )}
        </div>
        
        {reports.length === 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 text-center text-muted-foreground">
              No interviews completed yet. Start practicing!
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {recentReports.map(report => (
              <div key={report.id} className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                    {report.overallScore}
                  </div>
                  <div>
                    <h3 className="font-semibold">{report.mode} Interview</h3>
                    <p className="text-sm text-muted-foreground">{new Date(report.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <Link to={`/dashboard/report/${report.id}`} className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">
                  View Report <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
