# Xution Code Studio

## Current State
Full-stack AI code editor on ICP. Internet Identity auth. Role-based access: admin (Class 6) vs user. Black/gold theme already applied. Login uses only Internet Identity button. Training page has simple text-rule list. Editor has AI panel, code editor, live preview, version history. Proposal dialog for AI-generated code has Accept/Reject in the footer only. No back-to-dashboard button in editor. AI prompt is free-form with no page-context guidance.

## Requested Changes (Diff)

### Add
- Rename app to "Xution Code Studio" everywhere (page title, login screen, header, loading screen)
- Login page: secret password input field and QR code import/scan tab alongside the existing Internet Identity button. Only Class 6 can register (show info text: "Account creation is restricted to Class 6. Contact an admin to gain access.")
- QR code system: after login, Class 6 users can generate and export a unique QR code for any member profile. Members can import/export their own QR code. QR codes encode the user's principal + a secret salt. Scanning/importing a QR code auto-fills credentials on the login screen. Store QR secret per-user in localStorage keyed by principal.
- "Back to Projects" button in the editor toolbar that navigates to the dashboard
- "Accept & Apply" button ALSO displayed inline below the proposed code block in the AI proposal dialog (not just in the footer)
- Training page: add four learning mode tabs: Natural Language, Reinforcement Learning, Semi-Supervised Learning, Unsupervised Learning. Each tab has its own input UI that fits the learning style:
  - Natural Language: plain text description input (current behavior)
  - Reinforcement: thumbs up/down feedback on code examples with reward description
  - Semi-Supervised: labeled + unlabeled example pairs input
  - Unsupervised: raw pattern/example input with category clustering UI
- AI prompt UI in editor: change placeholder and helper text to encourage page-based descriptions ("Describe what you see on screen and what you want to change" instead of code terms). Add a hint: "Tip: Describe what you see visually, not code terms."

### Modify
- Login page title: AI Code Studio -> Xution Code Studio
- App loading text: Loading AI Code Studio -> Loading Xution Code Studio
- Layout/nav header: update branding to Xution Code Studio
- Deepen black theme: background should be near-pure black (oklch(0.06)), cards slightly elevated dark
- New Project button in dashboard: guard it so only admin (Class 6) can see it
- Dashboard header title: rename

### Remove
- Nothing removed

## Implementation Plan
1. Update index.html title to "Xution Code Studio"
2. Update LoginPage: rename, add tabs for Password / QR Code login modes, add registration restriction notice
3. Add QR code generation/import/export utility using `qrcode` and `jsqr` libraries
4. Add QR code management to MembersPage (export QR per member) and a profile panel (self-export)
5. Update EditorWorkspace: add Back button in toolbar, add inline Accept & Apply below proposal code
6. Update TrainingPage: add four-tab learning mode system
7. Update App.tsx loading text
8. Update Layout component header branding
9. Update index.css: deepen black background tokens
10. Guard New Project button to Class 6 only in DashboardPage (already guarded - verify)
11. Update AI panel placeholder text in EditorWorkspace
