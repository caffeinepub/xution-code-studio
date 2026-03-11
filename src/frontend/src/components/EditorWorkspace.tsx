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
import { Input } from "@/components/ui/input";
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
import type { LocalProject } from "@/hooks/useLocalProjects";
import {
  useAIPreferenceRules,
  useAddVersion,
  useProject,
  useProjectVersions,
  useRevertVersion,
  useUpdateProject,
} from "@/hooks/useQueries";
import {
  type CustomTerm,
  type KnowledgeChunk,
  generateResponse,
} from "@/utils/aiEngine";
import { buildPreviewHtml, generateCode } from "@/utils/codeGenerator";
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Copy,
  FileCode,
  History,
  Loader2,
  Play,
  Rocket,
  RotateCcw,
  Send,
  Terminal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.html_single]: "HTML Single File",
  [Language.html_css_js]: "HTML / CSS / JS",
  [Language.javascript]: "JavaScript",
  [Language.cpp]: "C++",
};

interface LocalWorkspaceMode {
  project: LocalProject | null;
  versions: {
    versionId: string;
    prompt: string;
    files: ProjectFile[];
    createdAt: bigint;
  }[];
  isAdmin: boolean;
  onSave: (
    updates: Partial<
      Pick<LocalProject, "title" | "language" | "files" | "isGlobal">
    >,
  ) => void;
  onAddVersion: (prompt: string, files: ProjectFile[]) => void;
  onRevert: (versionId: string) => void;
}

interface EditorWorkspaceProps {
  projectId: string;
  isAdmin: boolean;
  onBackToProjects?: () => void;
  localMode?: LocalWorkspaceMode;
}

interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: string;
  accepted: boolean;
}

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  timestamp: number;
}

const AI_GREETING: ChatMessage = {
  id: "greeting",
  role: "ai",
  text: "I'm your project AI. Describe what you want visually — say things like 'add a chat area at the top', 'make the title golden and bold', 'theme this like a space dashboard', or use emotion/sense words. I'll understand and build it for you.",
  timestamp: Date.now(),
};

export default function EditorWorkspace({
  projectId,
  isAdmin,
  onBackToProjects,
  localMode,
}: EditorWorkspaceProps) {
  const { data: backendProject, isLoading: backendLoading } = useProject(
    localMode ? null : projectId,
  );
  const { data: backendVersions = [] } = useProjectVersions(
    localMode ? null : projectId,
  );
  const { data: aiPrefs = [] } = useAIPreferenceRules();
  const updateProject = useUpdateProject();
  const addVersion = useAddVersion();
  const revertVersion = useRevertVersion();

  // Resolved project + versions (local or backend)
  const project = localMode ? localMode.project : backendProject;
  const versions = localMode ? localMode.versions : backendVersions;
  const isLoading = localMode ? false : backendLoading;

  const [localFiles, setLocalFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState(0);
  const [language, setLanguage] = useState<Language>(Language.html_single);
  const [title, setTitle] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [proposedFiles, setProposedFiles] = useState<ProjectFile[] | null>(
    null,
  );
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);

  // Conversational AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    AI_GREETING,
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  // Custom terms/knowledge loaded from aiPrefs (prefix-separated)
  const [customTerms] = useState<CustomTerm[]>([]);
  const [knowledge] = useState<KnowledgeChunk[]>([]);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [showVersions, setShowVersions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const scrollChatToBottom = useCallback(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, []);

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
    if (localMode) {
      localMode.onSave({ title, language, files: localFiles, isGlobal });
      const _saveUrl = `${window.location.origin}/#/preview/${projectId}`;
      toast.success("Project saved!", {
        description: _saveUrl,
        duration: 6000,
      });
      return;
    }
    try {
      await updateProject.mutateAsync({
        projectId,
        title,
        language,
        files: localFiles,
        isGlobal,
      });
      const _saveUrl = `${window.location.origin}/#/preview/${projectId}`;
      toast.success("Project saved!", {
        description: _saveUrl,
        duration: 6000,
      });
    } catch {
      toast.error("Failed to save project");
    }
  };

  const handleDeploy = () => setShowDeployModal(true);

  const handleCopyDeployUrl = () => {
    const url = `${window.location.origin}/#/preview/${projectId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleAISubmit = async () => {
    if (!aiPrompt.trim()) return;
    const userText = aiPrompt.trim();

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setTimeout(scrollChatToBottom, 50);

    // Start AI thinking
    setIsAiThinking(true);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    // Generate conversational response
    const { response } = generateResponse(
      userText,
      customTerms,
      knowledge,
      aiPrefs,
    );

    // Add AI response to chat
    const aiMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "ai",
      text: response,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, aiMsg]);
    setIsAiThinking(false);
    setTimeout(scrollChatToBottom, 50);

    // Also generate the code proposal
    const generated = generateCode(language, userText, aiPrefs);
    setProposedFiles(generated);
  };

  const handleAcceptProposal = async () => {
    if (!proposedFiles || !project) return;
    setLocalFiles(proposedFiles);
    setShowProposalDialog(false);
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
    if (localMode) {
      localMode.onAddVersion(p, proposedFiles);
      localMode.onSave({ files: proposedFiles, title, language, isGlobal });
      const _applyUrl = `${window.location.origin}/#/preview/${projectId}`;
      toast.success("Changes applied and saved!", {
        description: _applyUrl,
        duration: 6000,
      });
      setProposedFiles(null);
      return;
    }
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
      const _applyUrl = `${window.location.origin}/#/preview/${projectId}`;
      toast.success("Changes applied and saved!", {
        description: _applyUrl,
        duration: 6000,
      });
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
    // Add a rejection note to chat
    const rejectMsg: ChatMessage = {
      id: `r-${Date.now()}`,
      role: "ai",
      text: "No problem — the changes have been discarded. Tell me what you'd like differently and I'll try again.",
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, rejectMsg]);
    setTimeout(scrollChatToBottom, 50);
    setProposedFiles(null);
    setShowProposalDialog(false);
    setAiPrompt("");
  };

  const handleRevert = async (versionId: string) => {
    if (localMode) {
      localMode.onRevert(versionId);
      toast.success("Reverted to version!");
      return;
    }
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

  const isSaving = localMode ? false : updateProject.isPending;
  const isApplying = localMode
    ? false
    : addVersion.isPending || updateProject.isPending;
  const deployUrl = `${window.location.origin}/#/preview/${projectId}`;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card/50">
        {onBackToProjects && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToProjects}
            className="h-7 text-xs gap-1.5 border-primary text-primary hover:bg-primary hover:text-black flex-shrink-0"
            data-ocid="editor.back_button"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Projects
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDeploy}
          className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
          data-ocid="editor.deploy_button"
        >
          <Rocket className="w-3 h-3" /> Deploy
        </Button>
        {canPreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={`h-7 text-xs gap-1 ${showPreview ? "text-primary" : "text-muted-foreground"}`}
          >
            <Play className="w-3 h-3" /> Preview
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowVersions(!showVersions)}
          className={`h-7 text-xs gap-1 ${showVersions ? "text-primary" : "text-muted-foreground"}`}
        >
          <History className="w-3 h-3" /> History
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
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
                className="w-full h-full bg-background"
                title="Live Preview"
              />
            </div>
          )}
        </div>

        {/* AI Panel */}
        <div className="w-80 border-l border-border/50 bg-card/30 flex flex-col">
          <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              AI Assistant
            </span>
            {proposedFiles && (
              <span className="ml-auto text-xs text-primary font-medium animate-pulse">
                Review changes ↓
              </span>
            )}
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

          {/* Chat history */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0"
            data-ocid="editor.ai_chat"
          >
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "ai"
                      ? "bg-black/60 border-l-2 border-primary/50 text-foreground/90"
                      : "bg-primary/15 text-primary font-medium"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex justify-start">
                <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-black/60 border-l-2 border-primary/50 rounded-xl px-3 py-2 flex items-center gap-1">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                      style={{ animationDelay: `${j * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border/50 p-3 flex-shrink-0">
            {!proposedFiles ? (
              <>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      handleAISubmit();
                  }}
                  placeholder="Describe what you want to change visually…"
                  className="min-h-[72px] text-xs bg-muted/30 border-border focus:border-primary resize-none"
                  data-ocid="editor.ai_input"
                  disabled={isAiThinking}
                />
                <Button
                  type="button"
                  className="w-full mt-2 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                  onClick={handleAISubmit}
                  disabled={!aiPrompt.trim() || isAiThinking}
                  data-ocid="editor.ai_submit_button"
                >
                  {isAiThinking ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" /> Generate Code
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-2" data-ocid="ai.inline_proposal">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Proposed Changes
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProposalDialog(true)}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Full view
                  </button>
                </div>
                <div className="space-y-2">
                  {proposedFiles.map((f) => (
                    <div key={f.filename}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileCode className="w-3 h-3 text-primary" />
                        <span className="text-xs font-mono text-primary">
                          {f.filename}
                        </span>
                      </div>
                      <pre
                        className="code-editor text-xs p-2 rounded overflow-y-auto whitespace-pre-wrap"
                        style={{ maxHeight: "100px" }}
                      >
                        {f.content.slice(0, 500)}
                        {f.content.length > 500 ? "\n...(more)" : ""}
                      </pre>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  className="w-full h-9 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 mt-1"
                  onClick={handleAcceptProposal}
                  disabled={isApplying}
                  data-ocid="ai.inline_accept_button"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Applying...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Accept &amp; Apply
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-7 text-xs border-border gap-1"
                  onClick={handleRejectProposal}
                  data-ocid="ai.inline_reject_button"
                >
                  <X className="w-3 h-3" /> Reject
                </Button>
              </div>
            )}
          </div>

          {/* Prompt History */}
          <div className="border-t border-border/30 flex-shrink-0">
            <p className="px-3 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Prompt History
            </p>
            <ScrollArea className="h-28">
              {promptHistory.length === 0 ? (
                <p
                  className="px-3 text-xs text-muted-foreground"
                  data-ocid="editor.ai_history_empty_state"
                >
                  No prompts yet
                </p>
              ) : (
                <div className="space-y-1 px-2 pb-2">
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
                        <RotateCcw className="w-3 h-3" /> Revert to this
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Full Proposal dialog */}
      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] flex flex-col"
          data-ocid="ai.confirm_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" /> Proposed Changes
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
          <Button
            type="button"
            onClick={handleAcceptProposal}
            disabled={isApplying}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full mt-2"
            data-ocid="ai.dialog_accept_button"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Accept &amp; Apply
              </>
            )}
          </Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deploy Preview Modal */}
      <Dialog open={showDeployModal} onOpenChange={setShowDeployModal}>
        <DialogContent
          className="max-w-2xl flex flex-col gap-4"
          data-ocid="editor.deploy_modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" /> Deploy Preview
            </DialogTitle>
          </DialogHeader>
          {canPreview && (
            <div
              className="w-full rounded-md border border-border overflow-hidden"
              style={{ height: "400px" }}
            >
              <iframe
                srcDoc={previewHtml()}
                sandbox="allow-scripts"
                className="w-full h-full bg-white"
                title="Deploy Preview"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={deployUrl}
              className="flex-1 text-xs font-mono bg-muted/30 border-border"
              data-ocid="editor.deploy_url_input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyDeployUrl}
              className="gap-1.5 border-primary text-primary hover:bg-primary/10 flex-shrink-0"
              data-ocid="editor.copy_url_button"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </Button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeployModal(false)}
              className="border-border"
              data-ocid="editor.deploy_modal_close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
