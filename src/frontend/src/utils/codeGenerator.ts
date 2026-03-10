import type { ProjectFile } from "@/backend";
import { Language } from "@/backend";

function extractTitle(prompt: string): string {
  const words = prompt.split(" ").slice(0, 5).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function generateCode(
  language: Language,
  prompt: string,
  preferences: string[],
): ProjectFile[] {
  const title = extractTitle(prompt);
  const prefNote =
    preferences.length > 0
      ? `<!-- AI Preferences applied: ${preferences.join("; ")} -->`
      : "";

  switch (language) {
    case Language.html_single:
      return [
        {
          filename: "index.html",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${prefNote}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #0a0a0a;
      color: #f0f0f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #c9a227;
      border-radius: 12px;
      padding: 2rem;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #c9a227;
      margin-bottom: 1rem;
    }
    p { color: #aaa; line-height: 1.6; margin-bottom: 1rem; }
    button {
      background: #c9a227;
      color: #0a0a0a;
      border: none;
      padding: 0.6rem 1.4rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.85; }
    #output {
      margin-top: 1rem;
      padding: 1rem;
      background: #111;
      border-radius: 8px;
      border: 1px solid #333;
      min-height: 60px;
      color: #c9a227;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>Generated from: "${prompt}"</p>
    <button onclick="handleClick()">Run Action</button>
    <div id="output">Output will appear here...</div>
  </div>
  <script>
    function handleClick() {
      const output = document.getElementById('output');
      output.textContent = 'Action executed at: ' + new Date().toLocaleTimeString();
    }
  </script>
</body>
</html>`,
        },
      ];

    case Language.html_css_js:
      return [
        {
          filename: "index.html",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${prefNote}
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>Generated from: "${prompt}"</p>
    <button id="actionBtn">Run Action</button>
    <div id="output">Output will appear here...</div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        },
        {
          filename: "style.css",
          content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, sans-serif;
  background: #0a0a0a;
  color: #f0f0f0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.container {
  max-width: 800px;
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #c9a227;
  border-radius: 12px;
  padding: 2rem;
}
h1 { font-size: 2rem; font-weight: 700; color: #c9a227; margin-bottom: 1rem; }
p { color: #aaa; line-height: 1.6; margin-bottom: 1rem; }
button {
  background: #c9a227;
  color: #0a0a0a;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
}
button:hover { opacity: 0.85; }
#output {
  margin-top: 1rem;
  padding: 1rem;
  background: #111;
  border-radius: 8px;
  border: 1px solid #333;
  min-height: 60px;
  color: #c9a227;
  font-family: monospace;
}`,
        },
        {
          filename: "script.js",
          content: `// ${title}\n// Generated from: "${prompt}"\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  const btn = document.getElementById('actionBtn');\n  const output = document.getElementById('output');\n\n  btn.addEventListener('click', () => {\n    output.textContent = 'Action executed at: ' + new Date().toLocaleTimeString();\n  });\n});`,
        },
      ];

    case Language.javascript:
      return [
        {
          filename: "main.js",
          content: `// ${title}
// Generated from: "${prompt}"
// ${prefNote}

/**
 * Main entry point
 */
function main() {
  console.log('${title} initialized');

  // TODO: Implement your logic here based on the prompt:
  // "${prompt}"

  const result = processData({
    name: '${title}',
    timestamp: new Date().toISOString(),
  });

  console.log('Result:', result);
  return result;
}

function processData(data) {
  // Process the data
  return {
    ...data,
    processed: true,
    version: '1.0.0',
  };
}

// Run
main();
`,
        },
      ];

    case Language.cpp:
      return [
        {
          filename: "main.cpp",
          content: `#include <iostream>
#include <string>
#include <vector>

// ${title}
// Generated from: "${prompt}"

class Project {
public:
    std::string name;
    std::string description;

    Project(const std::string& name, const std::string& desc)
        : name(name), description(desc) {}

    void run() {
        std::cout << "Running: " << name << std::endl;
        std::cout << "Description: " << description << std::endl;
        // TODO: Implement your logic here
    }
};

int main() {
    Project project("${title}", "${prompt}");
    project.run();

    std::cout << "\n--- Output ---" << std::endl;
    std::cout << "Project executed successfully." << std::endl;

    return 0;
}
`,
        },
      ];

    default:
      return [
        { filename: "index.html", content: "<!-- Generated content -->" },
      ];
  }
}

export function buildPreviewHtml(
  files: ProjectFile[],
  language: Language,
): string {
  if (language === Language.html_single) {
    return files[0]?.content ?? "";
  }
  if (language === Language.html_css_js) {
    const html = files.find((f) => f.filename === "index.html")?.content ?? "";
    const css = files.find((f) => f.filename === "style.css")?.content ?? "";
    const js = files.find((f) => f.filename === "script.js")?.content ?? "";
    return html
      .replace(/<link[^>]*style\.css[^>]*>/i, `<style>${css}</style>`)
      .replace(
        /<script[^>]*script\.js[^>]*><\/script>/i,
        `<script>${js}</script>`,
      );
  }
  return "";
}
