import Layout from "@/components/Layout";
import UsernameSetup from "@/components/UsernameSetup";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useCallerProfile,
  useIsAdmin,
  useSeedDefaultUsers,
} from "@/hooks/useQueries";
import DashboardPage from "@/pages/DashboardPage";
import EditorPage from "@/pages/EditorPage";
import LoginPage from "@/pages/LoginPage";
import MembersPage from "@/pages/MembersPage";
import PreviewPage from "@/pages/PreviewPage";
import TrainingPage from "@/pages/TrainingPage";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

type Page = "dashboard" | "editor" | "members" | "training";

function getPreviewId(): string | null {
  const hash = window.location.hash;
  if (hash.startsWith("#/preview/")) {
    const id = hash.slice("#/preview/".length).trim();
    return id || null;
  }
  return null;
}

export default function App() {
  const previewId = getPreviewId();

  if (previewId) {
    return (
      <>
        <PreviewPage projectId={previewId} />
        <Toaster />
      </>
    );
  }

  return <MainApp />;
}

function MainApp() {
  const { identity, isInitializing } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const {
    actor,
    isFetching: actorFetching,
    isError: actorError,
    refetch: retryActor,
  } = useActor();

  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
    isError: profileError,
  } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();
  const seedUsers = useSeedDefaultUsers();

  const [page, setPage] = useState<Page>("dashboard");
  const [openProjectIds, setOpenProjectIds] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (isLoggedIn && !seeded && actor && !actorFetching) {
      setSeeded(true);
      seedUsers.mutate(undefined, { onError: () => {} });
    }
  }, [isLoggedIn, seeded, actor, actorFetching, seedUsers]);

  const handleOpenProject = (projectId: string) => {
    setOpenProjectIds((prev) =>
      prev.includes(projectId) ? prev : [...prev, projectId],
    );
    setPage("editor");
  };

  const handleCloseProject = (projectId: string) => {
    setOpenProjectIds((prev) => prev.filter((id) => id !== projectId));
  };

  const handleNavigate = (targetPage: Page) => {
    if ((targetPage === "members" || targetPage === "training") && !isAdmin)
      return;
    setPage(targetPage);
  };

  // Show loading only during initial auth check
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading Xution Code Studio...
          </p>
        </div>
      </div>
    );
  }

  // Show login page immediately without waiting for actor
  if (!isLoggedIn) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  // After login: show connecting screen while actor loads
  if (actorFetching && !actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Connecting to backend...
          </p>
        </div>
      </div>
    );
  }

  // Actor failed after all retries
  if (actorError && !actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <WifiOff className="w-10 h-10 text-primary" />
          <p className="text-primary font-semibold text-lg">
            Connection failed
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Could not reach the backend. Please check your connection and try
            again.
          </p>
          <Button
            data-ocid="backend.retry_button"
            onClick={() => retryActor()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show profile loading spinner only while actively fetching and no error yet
  if (profileLoading || (!profile && profileFetching && !profileError)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // No profile found (new user, error, or null response) → prompt setup
  if (!profile) {
    return (
      <>
        <UsernameSetup />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Layout currentPage={page} onNavigate={handleNavigate}>
        {page === "dashboard" && (
          <DashboardPage
            onOpenProject={handleOpenProject}
            onNavigate={(p) => handleNavigate(p)}
          />
        )}
        {page === "editor" && (
          <EditorPage
            openProjectIds={openProjectIds}
            onAddProject={() => setPage("dashboard")}
            onCloseProject={handleCloseProject}
            onBackToProjects={() => setPage("dashboard")}
          />
        )}
        {page === "members" && isAdmin && <MembersPage />}
        {page === "training" && isAdmin && <TrainingPage />}
      </Layout>
      <Toaster />
    </>
  );
}
