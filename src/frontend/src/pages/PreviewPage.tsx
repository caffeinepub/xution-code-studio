import { Language } from "@/backend";
import { useProject } from "@/hooks/useQueries";
import { buildPreviewHtml } from "@/utils/codeGenerator";
import { ArrowLeft, Code, Loader2 } from "lucide-react";

interface PreviewPageProps {
  projectId: string;
}

export default function PreviewPage({ projectId }: PreviewPageProps) {
  const { data: project, isLoading, isError } = useProject(projectId);

  const mainAppUrl = window.location.href.split("#")[0];

  const canPreview =
    project?.language === Language.html_single ||
    project?.language === Language.html_css_js;

  const previewHtml =
    project && canPreview
      ? buildPreviewHtml(project.files, project.language)
      : "";

  return (
    <div
      className="w-screen h-screen flex flex-col"
      data-ocid="preview.page"
      style={{ background: "oklch(0 0 0)" }}
    >
      {/* Minimal top bar */}
      <div
        className="flex items-center gap-3 px-4 border-b flex-shrink-0"
        style={{
          height: "40px",
          background: "oklch(0 0 0)",
          borderColor: "oklch(0.65 0.14 85 / 0.5)",
        }}
      >
        <a
          href={mainAppUrl}
          className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
          style={{ color: "oklch(0.78 0.15 85)" }}
          data-ocid="preview.back_link"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Studio
        </a>
        <span
          className="text-xs opacity-40"
          style={{ color: "oklch(0.78 0.15 85)" }}
        >
          /
        </span>
        <span
          className="text-xs font-semibold truncate"
          style={{ color: "oklch(0.78 0.15 85)" }}
        >
          {project?.title ?? "Loading..."}
        </span>
        <div className="flex-1" />
        {project && (
          <span
            className="text-xs opacity-50"
            style={{ color: "oklch(0.78 0.15 85)" }}
          >
            {project.language === Language.html_single
              ? "HTML"
              : project.language === Language.html_css_js
                ? "HTML/CSS/JS"
                : project.language === Language.javascript
                  ? "JavaScript"
                  : "C++"}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: "oklch(0.78 0.15 85)" }}
              />
              <p className="text-sm" style={{ color: "oklch(0.55 0.08 85)" }}>
                Loading project...
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="text-sm"
              style={{ color: "oklch(0.55 0.08 85)" }}
              data-ocid="preview.error_state"
            >
              Failed to load project. Make sure you are logged in.
            </div>
          </div>
        )}

        {project && canPreview && (
          <iframe
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
            title={project.title}
          />
        )}

        {project && !canPreview && (
          <div className="w-full h-full overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div
                className="flex items-center gap-2 mb-4"
                style={{ color: "oklch(0.78 0.15 85)" }}
              >
                <Code className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  {project.title} — Source Code
                </span>
              </div>
              {project.files.map((f) => (
                <div key={f.filename} className="mb-6">
                  <div
                    className="text-xs font-mono mb-2 px-3 py-1 inline-block rounded"
                    style={{
                      color: "oklch(0.78 0.15 85)",
                      background: "oklch(0.08 0.02 85)",
                      border: "1px solid oklch(0.65 0.14 85 / 0.4)",
                    }}
                  >
                    {f.filename}
                  </div>
                  <pre
                    className="code-editor text-sm p-4 rounded overflow-x-auto whitespace-pre-wrap"
                    style={{ maxHeight: "600px" }}
                  >
                    {f.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
