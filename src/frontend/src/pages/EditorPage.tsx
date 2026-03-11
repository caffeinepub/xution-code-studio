import type { ProjectFile } from "@/backend";
import EditorWorkspace from "@/components/EditorWorkspace";
import { Button } from "@/components/ui/button";
import type { LocalProject, LocalVersion } from "@/hooks/useLocalProjects";
import { useIsAdmin } from "@/hooks/useQueries";
import { Code2, Plus, X } from "lucide-react";
import { useState } from "react";

interface LocalEditorMode {
  projects: LocalProject[];
  versions: Record<string, LocalVersion[]>;
  isAdmin: boolean;
  onSave: (
    projectId: string,
    updates: Partial<
      Pick<LocalProject, "title" | "language" | "files" | "isGlobal">
    >,
  ) => void;
  onAddVersion: (
    projectId: string,
    prompt: string,
    files: ProjectFile[],
  ) => void;
  onRevert: (projectId: string, versionId: string) => void;
}

interface EditorPageProps {
  openProjectIds: string[];
  onAddProject: () => void;
  onCloseProject: (projectId: string) => void;
  onBackToProjects: () => void;
  localMode?: LocalEditorMode;
}

export default function EditorPage({
  openProjectIds,
  onAddProject,
  onCloseProject,
  onBackToProjects,
  localMode,
}: EditorPageProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    openProjectIds[0] ?? null,
  );
  const { data: isAdminData = false } = useIsAdmin();
  const isAdmin = localMode ? localMode.isAdmin : isAdminData;

  const effectiveActive =
    activeProjectId && openProjectIds.includes(activeProjectId)
      ? activeProjectId
      : (openProjectIds[0] ?? null);

  if (openProjectIds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Code2 className="w-8 h-8 text-primary/60" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No projects open
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Open a project from the dashboard or create a new one
        </p>
        <Button
          type="button"
          onClick={onAddProject}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Open Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project tabs */}
      <div className="flex items-center gap-0 border-b border-border/50 bg-card/30 overflow-x-auto">
        {openProjectIds.map((pid) => {
          const localProj = localMode?.projects.find((p) => p.id === pid);
          const label = localProj
            ? localProj.title
            : `${pid.slice(0, 8)}\u2026`;
          return (
            <ProjectTab
              key={pid}
              label={label}
              isActive={effectiveActive === pid}
              onClick={() => setActiveProjectId(pid)}
              onClose={() => {
                onCloseProject(pid);
                if (effectiveActive === pid) {
                  const remaining = openProjectIds.filter((id) => id !== pid);
                  setActiveProjectId(remaining[0] ?? null);
                }
              }}
            />
          );
        })}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddProject}
          className="h-9 px-3 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor workspace */}
      <div className="flex-1 overflow-hidden">
        {effectiveActive ? (
          <EditorWorkspace
            key={effectiveActive}
            projectId={effectiveActive}
            isAdmin={isAdmin}
            onBackToProjects={onBackToProjects}
            localMode={
              localMode
                ? {
                    project:
                      localMode.projects.find(
                        (p) => p.id === effectiveActive,
                      ) ?? null,
                    versions: (localMode.versions[effectiveActive] ?? []).map(
                      (v) => ({ ...v, createdAt: BigInt(v.createdAt) }),
                    ),
                    isAdmin: localMode.isAdmin,
                    onSave: (updates) =>
                      localMode.onSave(effectiveActive, updates),
                    onAddVersion: (prompt, files) =>
                      localMode.onAddVersion(effectiveActive, prompt, files),
                    onRevert: (versionId) =>
                      localMode.onRevert(effectiveActive, versionId),
                  }
                : undefined
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a project tab to start editing
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectTab({
  label,
  isActive,
  onClick,
  onClose,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-2 px-4 h-9 text-xs border-r border-border/30 flex-shrink-0 transition-colors ${
        isActive
          ? "bg-background text-foreground border-b-2 border-b-primary"
          : "bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/60"
      }`}
    >
      <Code2 className="w-3 h-3" />
      <span className="font-mono max-w-[120px] truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
        aria-label="Close tab"
      >
        <X className="w-3 h-3" />
      </button>
    </button>
  );
}
