import { motion } from "framer-motion";
import { SignInButton } from "@clerk/clerk-react";
import { ArrowRight, Bot, Target, Zap, LayoutDashboard, FileText } from "lucide-react";
import { Navbar } from "../components/Navbar";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Zap className="w-4 h-4" />
              <span>Next-Gen AI Interviews</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              Master your next interview with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">AI precision.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload your resume and practice with our adaptive AI. We analyze your voice, expressions, and technical accuracy in real-time to provide actionable feedback.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <div className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2">
                <SignInButton mode="modal">Start Practicing Free</SignInButton>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div >
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/50 px-6 border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Our platform uses state-of-the-art computer vision and natural language processing to simulate real interview conditions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="w-8 h-8 text-blue-500" />}
              title="Smart Resume Parsing"
              description="Upload your PDF and our LLM extracts your skills, experience, and tailors the interview questions specifically for you."
            />
            <FeatureCard 
              icon={<Bot className="w-8 h-8 text-purple-500" />}
              title="Adaptive AI Questions"
              description="Questions get harder or easier based on your previous answers, just like a real technical interview."
            />
            <FeatureCard 
              icon={<Target className="w-8 h-8 text-green-500" />}
              title="Real-time Analytics"
              description="MediaPipe tracks your eye contact and posture, while NLP evaluates your STAR format and speaking clarity."
            />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 text-center text-muted-foreground border-t border-border">
        <p>© 2026 InterviewAI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-all"
    >
      <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  )
}
