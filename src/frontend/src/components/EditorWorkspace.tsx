import { Language } from "@/backend";
import type { ProjectFile } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  useAIPreferenceRules,
  useAddVersion,
  useProject,
  useProjectVersions,
  useRevertVersion,
  useUpdateProject,
} from "@/hooks/useQueries";
import { buildPreviewHtml, generateCode } from "@/utils/codeGenerator";
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  FileCode,
  History,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Terminal,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.html_single]: "HTML Single File",
  [Language.html_css_js]: "HTML / CSS / JS",
  [Language.javascript]: "JavaScript",
  [Language.cpp]: "C++",
};

interface EditorWorkspaceProps {
  projectId: string;
  isAdmin: boolean;
  onBackToProjects?: () => void;
}

interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: string;
  accepted: boolean;
}

export default function EditorWorkspace({
  projectId,
  isAdmin,
  onBackToProjects,
}: EditorWorkspaceProps) {
  const { data: project, isLoading } = useProject(projectId);
  const { data: versions = [] } = useProjectVersions(projectId);
  const { data: aiPrefs = [] } = useAIPreferenceRules();
  const updateProject = useUpdateProject();
  const addVersion = useAddVersion();
  const revertVersion = useRevertVersion();

  const [localFiles, setLocalFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState(0);
  const [language, setLanguage] = useState<Language>(Language.html_single);
  const [title, setTitle] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [proposedFiles, setProposedFiles] = useState<ProjectFile[] | null>(
    null,
  );
  const [showProposal, setShowProposal] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);

  const [showVersions, setShowVersions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (project) {
      setLocalFiles(project.files);
      setLanguage(project.language);
      setTitle(project.title);
      setIsGlobal(project.isGlobal);
      setActiveFile(0);
    }
  }, [project]);

  const previewHtml = useCallback(() => {
    if (
      language === Language.html_single ||
      language === Language.html_css_js
    ) {
      return buildPreviewHtml(localFiles, language);
    }
    return "";
  }, [localFiles, language]);

  const canPreview =
    language === Language.html_single || language === Language.html_css_js;

  const handleFileChange = (content: string) => {
    setLocalFiles((prev) =>
      prev.map((f, i) => (i === activeFile ? { ...f, content } : f)),
    );
  };

  const handleSave = async () => {
    if (!project) return;
    try {
      await updateProject.mutateAsync({
        projectId,
        title,
        language,
        files: localFiles,
        isGlobal,
      });
      toast.success("Project saved!");
    } catch {
      toast.error("Failed to save project");
    }
  };

  const handleAISubmit = () => {
    if (!aiPrompt.trim()) return;
    const generated = generateCode(language, aiPrompt, aiPrefs);
    setProposedFiles(generated);
    setShowProposal(true);
  };

  const handleAcceptProposal = async () => {
    if (!proposedFiles || !project) return;
    setLocalFiles(proposedFiles);
    setShowProposal(false);
    const p = aiPrompt;
    setPromptHistory((prev) => [
      {
        id: `${Date.now()}`,
        prompt: p,
        timestamp: new Date().toLocaleTimeString(),
        accepted: true,
      },
      ...prev,
    ]);
    setAiPrompt("");
    try {
      await Promise.all([
        addVersion.mutateAsync({ projectId, prompt: p, files: proposedFiles }),
        updateProject.mutateAsync({
          projectId,
          title,
          language,
          files: proposedFiles,
          isGlobal,
        }),
      ]);
      toast.success("Changes applied and saved!");
    } catch {
      toast.error("Failed to save to backend");
    }
    setProposedFiles(null);
  };

  const handleRejectProposal = () => {
    const p = aiPrompt;
    setPromptHistory((prev) => [
      {
        id: `${Date.now()}`,
        prompt: p,
        timestamp: new Date().toLocaleTimeString(),
        accepted: false,
      },
      ...prev,
    ]);
    setProposedFiles(null);
    setShowProposal(false);
    setAiPrompt("");
  };

  const handleRevert = async (versionId: string) => {
    try {
      await revertVersion.mutateAsync({ projectId, versionId });
      toast.success("Reverted to version!");
    } catch {
      toast.error("Failed to revert");
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        data-ocid="editor.loading_state"
      >
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Project not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card/50">
        {onBackToProjects && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBackToProjects}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground flex-shrink-0"
            data-ocid="editor.back_button"
          >
            <ArrowLeft className="w-3 h-3" />
            Projects
          </Button>
        )}
        <input
          className="bg-transparent text-sm font-semibold text-foreground border-b border-transparent hover:border-border focus:border-primary outline-none px-1 min-w-0 flex-1 max-w-[200px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project title"
        />
        <Select
          value={language}
          onValueChange={(v) => setLanguage(v as Language)}
        >
          <SelectTrigger
            className="w-44 h-7 text-xs"
            data-ocid="editor.language_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LANGUAGE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => setIsGlobal(e.target.checked)}
              className="accent-primary"
            />
            Global
          </label>
        )}
        <div className="flex-1" />
        {canPreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={`h-7 text-xs gap-1 ${showPreview ? "text-primary" : "text-muted-foreground"}`}
          >
            <Play className="w-3 h-3" />
            Preview
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowVersions(!showVersions)}
          className={`h-7 text-xs gap-1 ${showVersions ? "text-primary" : "text-muted-foreground"}`}
        >
          <History className="w-3 h-3" />
          History
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={updateProject.isPending}
          className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {updateProject.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File list */}
        <div
          className="w-44 border-r border-border/50 bg-sidebar flex flex-col"
          data-ocid="editor.file_list"
        >
          <div className="px-3 py-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Files
          </div>
          <div className="flex-1">
            {localFiles.map((f, i) => (
              <button
                type="button"
                key={f.filename}
                onClick={() => setActiveFile(i)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                  i === activeFile
                    ? "bg-primary/15 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <FileCode className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{f.filename}</span>
              </button>
            ))}
          </div>
          {language === Language.cpp && (
            <div className="p-2 border-t border-border/50">
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded p-2">
                <Terminal className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>C++ requires a local compiler to run</span>
              </div>
            </div>
          )}
        </div>

        {/* Code editor + preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <textarea
            className="code-editor flex-1 w-full p-4 text-sm leading-relaxed"
            value={localFiles[activeFile]?.content ?? ""}
            onChange={(e) => handleFileChange(e.target.value)}
            spellCheck={false}
            placeholder="// Start coding here..."
            data-ocid="editor.textarea"
          />
          {showPreview && canPreview && (
            <div
              className="h-64 border-t border-border/50"
              data-ocid="editor.preview_panel"
            >
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 border-b border-border/50">
                <ChevronRight className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Live Preview
                </span>
              </div>
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml()}
                sandbox="allow-scripts"
                className="w-full h-full bg-white"
                title="Live Preview"
              />
            </div>
          )}
        </div>

        {/* AI Panel */}
        <div className="w-72 border-l border-border/50 bg-card/30 flex flex-col">
          <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              AI Assistant
            </span>
          </div>

          {aiPrefs.length > 0 && (
            <div className="px-3 py-2 border-b border-border/30">
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                Active AI preferences:
              </p>
              <div className="flex flex-wrap gap-1">
                {aiPrefs.slice(0, 3).map((pref) => (
                  <Badge
                    key={pref}
                    variant="outline"
                    className="text-xs px-1.5 py-0 border-primary/30 text-primary/80"
                  >
                    {pref.length > 20 ? `${pref.slice(0, 20)}…` : pref}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-b border-border/30">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  handleAISubmit();
              }}
              placeholder="Describe what you see on screen and what you want to change..."
              className="min-h-[80px] text-xs bg-muted/30 border-border focus:border-primary resize-none"
              data-ocid="editor.ai_input"
            />
            <Button
              type="button"
              className="w-full mt-2 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
              onClick={handleAISubmit}
              disabled={!aiPrompt.trim()}
              data-ocid="editor.ai_submit_button"
            >
              <Send className="w-3 h-3" />
              Generate Code
            </Button>
            <p className="text-xs text-muted-foreground mt-1 text-center opacity-60">
              Tip: Describe visuals, not code terms
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <p className="px-3 py-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Prompt History
            </p>
            <ScrollArea className="h-40">
              {promptHistory.length === 0 ? (
                <p className="px-3 text-xs text-muted-foreground">
                  No prompts yet
                </p>
              ) : (
                <div className="space-y-1 px-2">
                  {promptHistory.map((h) => (
                    <div key={h.id} className="bg-muted/20 rounded p-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span
                          className={`text-xs font-medium ${
                            h.accepted ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {h.accepted ? "✓" : "✗"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {h.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-foreground line-clamp-2">
                        {h.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Version History sidebar */}
        {showVersions && (
          <div
            className="w-64 border-l border-border/50 bg-sidebar flex flex-col"
            data-ocid="editor.version_list"
          >
            <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs font-semibold">Version History</span>
              <button
                type="button"
                onClick={() => setShowVersions(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>
            <ScrollArea className="flex-1">
              {versions.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">
                  No versions yet
                </p>
              ) : (
                <div className="p-2 space-y-2">
                  {versions.map((v, i) => (
                    <div key={v.versionId} className="bg-muted/20 rounded p-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(
                          Number(v.createdAt) / 1_000_000,
                        ).toLocaleString()}
                      </p>
                      <p className="text-xs text-foreground line-clamp-2 mb-2">
                        {v.prompt || `Version ${i + 1}`}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevert(v.versionId)}
                        disabled={revertVersion.isPending}
                        className="h-6 text-xs text-primary hover:text-primary w-full justify-start gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Revert to this
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Proposal dialog */}
      <Dialog open={showProposal} onOpenChange={setShowProposal}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] flex flex-col"
          data-ocid="ai.confirm_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Proposed Changes
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Review the generated code before applying:
          </p>
          <ScrollArea className="flex-1 max-h-80">
            {proposedFiles?.map((f) => (
              <div key={f.filename} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className="w-3 h-3 text-primary" />
                  <span className="text-xs font-mono text-primary">
                    {f.filename}
                  </span>
                </div>
                <pre className="code-editor text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-48">
                  {f.content.slice(0, 1000)}
                  {f.content.length > 1000 ? "\n... (truncated)" : ""}
                </pre>
              </div>
            ))}
          </ScrollArea>
          <div className="flex justify-end mt-3">
            <Button
              type="button"
              onClick={handleAcceptProposal}
              disabled={addVersion.isPending || updateProject.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              data-ocid="ai.inline_accept_button"
            >
              {addVersion.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Applying...
                </>
              ) : (
                "Accept & Apply"
              )}
            </Button>
          </div>
          <Separator />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRejectProposal}
              className="border-border"
              data-ocid="ai.cancel_button"
            >
              Reject
            </Button>
            <Button
              type="button"
              onClick={handleAcceptProposal}
              disabled={addVersion.isPending || updateProject.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="ai.accept_button"
            >
              {addVersion.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...
                </>
              ) : (
                "Accept & Apply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
