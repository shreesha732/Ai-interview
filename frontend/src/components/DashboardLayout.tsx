import { UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Video, History, Settings } from "lucide-react";
import { cn } from "../lib/utils";

const sidebarLinks = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Resumes", href: "/dashboard/resumes", icon: FileText },
  { name: "Practice Interview", href: "/dashboard/interview", icon: Video },
  { name: "History & Reports", href: "/dashboard/history", icon: History },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="text-xl font-bold tracking-tight text-primary">InterviewAI</Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm font-medium text-foreground">My Account</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border md:hidden">
          <span className="font-bold">InterviewAI</span>
          <UserButton afterSignOutUrl="/" />
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
