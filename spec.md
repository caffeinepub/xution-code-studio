# Xution Code Studio

## Current State
- Full-stack app with Motoko backend and React frontend
- Black/gold theme with OKLCH CSS variables defined in `:root`
- Class 6 role system (Unity, Syndelious pre-seeded), login via password or QR code
- EditorWorkspace with code editor, AI assistant, preview pane, and version history
- Member management and AI training pages (Class 6 only)
- Logo upload/save for Class 6
- Menu has Back to Projects, Member Management, AI Training, Sign Out

## Requested Changes (Diff)

### Add
- `dark` class to `<html>` element in `index.html` so Tailwind dark mode CSS variables apply globally
- **Project Preview Page**: a full-screen preview mode that renders the project output (iframe for HTML projects, output for others) on a dedicated route `#/preview/:projectId`
- **Deploy Link**: Class 6 can generate a shareable HTTPS preview link (using the app's own URL + hash route); copy-to-clipboard with toast confirmation
- Deploy button visible in EditorWorkspace toolbar

### Modify
- `index.html`: add `class="dark"` to `<html>` tag to fix white background
- `EditorWorkspace.tsx` line 379: change `bg-white` preview iframe container to `bg-background` (keeps iframe content white inside, outer chrome stays black)
- EditorWorkspace: ensure Accept & Apply button appears inline directly below the AI-suggested code block, not just in a modal
- EditorWorkspace: AI prompt placeholder text should be visual-first (describe what you see, not code terms)

### Remove
- Nothing removed

## Implementation Plan
1. Add `class="dark"` to `<html>` in `index.html`
2. Fix `bg-white` on iframe wrapper in EditorWorkspace to `bg-black` or `bg-background`
3. Add `PreviewPage` component that renders the project output full-screen via iframe (for HTML projects) or code display (for others)
4. Add routing: App.tsx checks `window.location.hash` for `#/preview/:id`; if matched, renders PreviewPage without Layout
5. Add Deploy button in EditorWorkspace that generates and copies the preview URL (`${window.location.origin}/#/preview/${projectId}`)
6. Add inline Accept & Apply button below suggested code in AI chat area
