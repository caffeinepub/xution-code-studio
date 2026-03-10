import { Language } from "@/backend";
import type { Project } from "@/backend";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useCallerProjects,
  useCreateProject,
  useDeleteProject,
  useGlobalProjects,
  useIsAdmin,
} from "@/hooks/useQueries";
import {
  Brain,
  Code2,
  FolderOpen,
  Globe,
  Loader2,
  Lock,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.html_single]: "HTML Single File",
  [Language.html_css_js]: "HTML / CSS / JS",
  [Language.javascript]: "JavaScript",
  [Language.cpp]: "C++",
};

const LANGUAGE_COLORS: Record<Language, string> = {
  [Language.html_single]: "text-orange-400",
  [Language.html_css_js]: "text-blue-400",
  [Language.javascript]: "text-yellow-400",
  [Language.cpp]: "text-green-400",
};

interface DashboardProps {
  onOpenProject: (projectId: string) => void;
  onNavigate: (page: "members" | "training") => void;
}

export default function DashboardPage({
  onOpenProject,
  onNavigate,
}: DashboardProps) {
  const { data: myProjects = [], isLoading: loadingMine } = useCallerProjects();
  const { data: globalProjects = [], isLoading: loadingGlobal } =
    useGlobalProjects();
  const { data: isAdmin } = useIsAdmin();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLang, setNewLang] = useState<Language>(Language.html_single);
  const [newIsGlobal, setNewIsGlobal] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const initialFiles =
      newLang === Language.html_single
        ? [
            {
              filename: "index.html",
              content:
                "<!DOCTYPE html>\n<html>\n<head><title>New Project</title></head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>",
            },
          ]
        : newLang === Language.html_css_js
          ? [
              {
                filename: "index.html",
                content:
                  '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World</h1>\n  <script src="script.js"></script>\n</body>\n</html>',
              },
              {
                filename: "style.css",
                content: "body { font-family: sans-serif; }",
              },
              { filename: "script.js", content: "console.log('Hello World');" },
            ]
          : newLang === Language.javascript
            ? [
                {
                  filename: "main.js",
                  content: "// Your code here\nconsole.log('Hello World');",
                },
              ]
            : [
                {
                  filename: "main.cpp",
                  content:
                    '#include <iostream>\n\nint main() {\n  std::cout << "Hello World" << std::endl;\n  return 0;\n}',
                },
              ];

    try {
      const id = await createProject.mutateAsync({
        title: newTitle.trim(),
        language: newLang,
        files: initialFiles,
        isGlobal: isAdmin ? newIsGlobal : false,
      });
      toast.success("Project created!");
      setShowCreate(false);
      setNewTitle("");
      setNewLang(Language.html_single);
      setNewIsGlobal(false);
      onOpenProject(id);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const allProjects = [
    ...myProjects,
    ...globalProjects.filter((g) => !myProjects.find((m) => m.id === g.id)),
  ];

  const renderProject = (project: Project, index: number) => (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onOpenProject(project.id)}
      className="group bg-card border border-border hover:border-primary/50 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-gold"
      data-ocid={`project.item.${index + 1}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Code2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-center gap-1">
          {project.isGlobal ? (
            <Badge
              variant="outline"
              className="text-xs border-primary/30 text-primary/80 gap-1"
            >
              <Globe className="w-2.5 h-2.5" />
              Global
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs border-border/50 text-muted-foreground gap-1"
            >
              <Lock className="w-2.5 h-2.5" />
              Private
            </Badge>
          )}
          {(isAdmin || myProjects.find((m) => m.id === project.id)) && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => handleDelete(project.id, e)}
              disabled={deleteProject.isPending}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-sm text-foreground mb-1 truncate">
        {project.title}
      </h3>
      <p className={`text-xs font-mono ${LANGUAGE_COLORS[project.language]}`}>
        {LANGUAGE_LABELS[project.language]}
      </p>
    </motion.div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your projects and workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("members")}
                className="border-border text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Users className="w-4 h-4" /> Members
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("training")}
                className="border-border text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Brain className="w-4 h-4" /> AI Training
              </Button>
            </>
          )}
          {isAdmin && (
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              data-ocid="project.new_button"
            >
              <Plus className="w-4 h-4" /> New Project
            </Button>
          )}
        </div>
      </div>

      {/* Projects grid */}
      {loadingMine || loadingGlobal ? (
        <div
          className="flex items-center justify-center py-20"
          data-ocid="project.loading_state"
        >
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : allProjects.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/50 rounded-2xl"
          data-ocid="project.empty_state"
        >
          <FolderOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No projects yet
          </h3>
          {isAdmin ? (
            <>
              <p className="text-muted-foreground text-sm mb-6">
                Create your first project to get started
              </p>
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              You can use projects shared with you. Contact a Class 6 member for
              access.
            </p>
          )}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          data-ocid="project.list"
        >
          {allProjects.map((p, i) => renderProject(p, i))}
        </div>
      )}

      {/* Create project dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="My Awesome Project"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={newLang}
                onValueChange={(v) => setNewLang(v as Language)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between">
                <Label>Make Global</Label>
                <Switch
                  checked={newIsGlobal}
                  onCheckedChange={setNewIsGlobal}
                  data-ocid="project.global_switch"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || createProject.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
