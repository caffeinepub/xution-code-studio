import Layout from "@/components/Layout";
import UsernameSetup from "@/components/UsernameSetup";
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
import { Loader2 } from "lucide-react";
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
  const { actor, isFetching: actorFetching } = useActor();

  const {
    data: profile,
    isLoading: profileLoading,
    isFetching: profileFetching,
  } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();
  const seedUsers = useSeedDefaultUsers();

  const [page, setPage] = useState<Page>("dashboard");
  const [openProjectIds, setOpenProjectIds] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (isLoggedIn && !seeded && actor && !actorFetching) {
      setSeeded(true);
      seedUsers.mutate();
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

  if (!isLoggedIn) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (profileLoading || (!profile && profileFetching)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

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
