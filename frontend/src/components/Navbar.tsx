import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { BrainCircuit } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
          <BrainCircuit className="w-6 h-6 text-primary" />
          <span>InterviewAI</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <SignedOut>
            <div className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">
              <SignInButton mode="modal">Sign In</SignInButton>
            </div>
            <div className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity cursor-pointer">
              <SignInButton mode="modal">Get Started</SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
