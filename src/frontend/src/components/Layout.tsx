import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCallerProfile, useIsAdmin } from "@/hooks/useQueries";
import {
  Brain,
  ChevronDown,
  Code2,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

type Page = "dashboard" | "editor" | "members" | "training";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Layout({
  children,
  currentPage,
  onNavigate,
}: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal ? `${principal.slice(0, 8)}...` : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg gold-gradient">
              Xution Code Studio
            </span>
            {isAdmin && (
              <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">
                Class 6
              </Badge>
            )}
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={currentPage === "dashboard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onNavigate("dashboard")}
              data-ocid="nav.dashboard_link"
              className={
                currentPage === "dashboard"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              <LayoutDashboard className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <Button
              variant={currentPage === "editor" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onNavigate("editor")}
              data-ocid="nav.editor_link"
              className={
                currentPage === "editor"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              <Code2 className="w-4 h-4 mr-1" />
              Editor
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant={currentPage === "members" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate("members")}
                  data-ocid="nav.members_link"
                  className={
                    currentPage === "members"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <Users className="w-4 h-4 mr-1" />
                  Members
                </Button>
                <Button
                  variant={currentPage === "training" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate("training")}
                  data-ocid="nav.training_link"
                  className={
                    currentPage === "training"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  <Brain className="w-4 h-4 mr-1" />
                  AI Training
                </Button>
              </>
            )}
          </nav>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center text-primary text-xs font-bold">
                  {profile?.username?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="hidden md:inline text-sm">
                  {profile?.username ?? shortPrincipal}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                disabled
                className="text-xs text-muted-foreground"
              >
                {shortPrincipal}
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem
                    onClick={() => onNavigate("members")}
                    data-ocid="nav.members_link"
                  >
                    <Users className="w-4 h-4 mr-2" /> Members
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onNavigate("training")}
                    data-ocid="nav.training_link"
                  >
                    <Brain className="w-4 h-4 mr-2" /> AI Training
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={clear}
                className="text-destructive focus:text-destructive"
                data-ocid="auth.logout_button"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-3 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-primary">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
