import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { LandingPage } from './pages/LandingPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardOverview } from './pages/DashboardOverview';
import { ResumeUpload } from './pages/ResumeUpload';
import { InterviewRoom } from './pages/InterviewRoom';
import { Report } from './pages/Report';
import { History } from './pages/History';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <>
            <SignedOut>
              <LandingPage />
            </SignedOut>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
          </>
        } />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <SignedIn>
            <DashboardLayout>
              <DashboardOverview />
            </DashboardLayout>
          </SignedIn>
        } />
        <Route path="/dashboard/resumes" element={
          <SignedIn>
            <DashboardLayout>
              <ResumeUpload />
            </DashboardLayout>
          </SignedIn>
        } />
        <Route path="/dashboard/interview" element={
          <SignedIn>
            <DashboardLayout>
              <InterviewRoom />
            </DashboardLayout>
          </SignedIn>
        } />
        <Route path="/dashboard/history" element={
          <SignedIn>
            <DashboardLayout>
              <History />
            </DashboardLayout>
          </SignedIn>
        } />
        <Route path="/dashboard/report/:id" element={
          <SignedIn>
            <DashboardLayout>
              <Report />
            </DashboardLayout>
          </SignedIn>
        } />
      </Routes>
    </Router>
  );
}

export default App;
