# Git, GitHub & Pull Request Complete Workflow Guide
**NEXORA Labs • Project OhmSim**  
*Standard Operating Procedure for Branching, Code Reviews, Merging, and Production Releases (v1.0.0)*

---

## 📑 Table of Contents
1. [Git & Version Control Fundamentals](#1-git--version-control-fundamentals)
2. [The Two-Tier Branch Architecture](#2-the-two-tier-branch-architecture)
3. [Step-by-Step Feature Development Lifecycle](#3-step-by-step-feature-development-lifecycle)
4. [Anatomy of a High-Quality Pull Request (PR)](#4-anatomy-of-a-high-quality-pull-request-pr)
5. [Merging Strategies Compared](#5-merging-strategies-compared)
6. [Production Release & Promotion Workflow](#6-production-release--promotion-workflow)
7. [Emergency Playbook & Troubleshooting](#7-emergency-playbook--troubleshooting)
8. [Quick Reference Command Cheat Sheet](#8-quick-reference-command-cheat-sheet)

---

## 1. Git & Version Control Fundamentals

Git operates across four core layers:

```text
 ┌─────────────────┐      git add       ┌─────────────────┐      git commit      ┌─────────────────┐      git push       ┌──────────────────┐
 │  Working Tree   │ ─────────────────► │  Staging Area   │ ───────────────────► │   Local Repo    │ ──────────────────► │   Remote Repo    │
 │ (Files on Disk) │ ◄───────────────── │     (Index)     │ ◄─────────────────── │  (Local Commits)│ ◄────────────────── │ (GitHub Origin)  │
 └─────────────────┘      git restore   └─────────────────┘      git reset       └─────────────────┘      git pull       └──────────────────┘
```

| Area | Location | Purpose |
| :--- | :--- | :--- |
| **Working Tree** | Local Disk | Files being edited in your code editor. |
| **Staging Area** | Memory / Index | Prepared snapshot buffer before taking a permanent commit. |
| **Local Repo** | `.git/` folder | Local commit history stored on your PC. |
| **Remote Repo** | GitHub (`origin`) | Central cloud repository shared with your team and Vercel. |

---

## 2. The Two-Tier Branch Architecture

```text
 [ main ] ───────────────────────────────────────────────────────────────────► [ Production Deployment ]
    ▲
    │ (Official Release PR)
 [ development ] ───●───────────────────────────●────────────────────────────► [ Integration & QA ]
    │                ▲                           ▲
    │ (Branch out)   │ (Feature PR)              │ (Feature PR)
    ▼                │                           │
 [ feature/auth ] ───┘          [ feature/database-prisma ] ───┘
```

### Branch Classifications:

* 🔒 **`main` (Permanent - Production)**: Always deployable, stable, reflects the live version. **Direct commits forbidden.**
* 📌 **`development` (Permanent - Integration)**: Day-to-day meeting ground for all completed features. **Direct commits forbidden.**
* ⚡ **`feature/<work-name>` (Temporary)**: Dedicated to building a specific feature (e.g. `feature/database-prisma`). Merged via PR and deleted.
* 🐛 **`fix/<issue-name>` (Temporary)**: Dedicated to a specific bugfix. Merged via PR and deleted.
* 📝 **`docs/<topic>` (Temporary)**: Documentation updates. Merged via PR and deleted.

---

## 3. Step-by-Step Feature Development Lifecycle

Every task follows this exact sequence:

### Step 1: Make sure `development` is up to date
```powershell
git switch development
git pull --ff-only origin development
```

### Step 2: Create your new feature branch
```powershell
git switch -c feature/<work-name>
# Example: git switch -c feature/database-prisma
```

### Step 3: Implement & Validate Locally
Write your code, components, or APIs. Verify that everything builds cleanly:
```powershell
npm run lint
npm run build
```

### Step 4: Stage & Commit
Follow the conventional commit standard:
```powershell
git add .
git commit -m "feat: implement prisma schema with 12 core database models"
```

### Step 5: Push Branch to GitHub
```powershell
git push -u origin feature/<work-name>
```

### Step 6: Open Pull Request on GitHub
* Go to your repository on GitHub.
* Click **"Compare & pull request"**.
* **Base branch:** `development` *(Do NOT select `main`)*
* **Compare branch:** `feature/<work-name>`
* Add Title and Description using the template in Section 4.

### Step 7: Merge on GitHub
* Confirm checks pass.
* Select **"Squash and merge"** (or **"Create a merge commit"**).
* Click the purple **"Delete branch"** button on GitHub.

### Step 8: Sync & Clean Local Repository
```powershell
git switch development
git pull --ff-only origin development
git branch -d feature/<work-name>
```

---

## 4. Anatomy of a High-Quality Pull Request (PR)

### Standard PR Description Template:
```markdown
## 📌 Summary of Changes
Brief description of what problem this PR solves and what was built.

## 🛠️ Key Features / Additions
- Added X component / API route.
- Implemented Y validation schema.
- Configured Z database relation.

## 🧪 Verification & Testing Performed
- [x] Ran `npm run lint` (0 errors).
- [x] Ran `npm run build` (Build succeeded).
- [x] Tested responsive UI on Mobile & Desktop.

## 📷 Screenshots / Artifacts (if UI change)
[Attach screenshots or recordings here]
```

---

## 5. Merging Strategies Compared

| Strategy | How it Operates | Commit History Graph | When to Use in OhmSim |
| :--- | :--- | :--- | :--- |
| **Squash and merge** | Combines all branch commits into **1 clean commit** on target. | `dev: ●────────●` | **Features & Fixes into `development`** |
| **Create a merge commit** | Keeps all commits + adds a dedicated Merge commit. | `main: ●───────●`<br>`dev:   \●──●──/` | **Release PRs (`development` $\rightarrow$ `main`)** |
| **Rebase and merge** | Replays commits linearly on top of target branch. | `dev: ●──●──●──●` | When all branch commits were individually curated |

---

## 6. Production Release & Promotion Workflow

When features in `development` form a stable milestone ready for production:
1. **Quality Audit:** Ensure all tests and QA pass on `development`.
2. **Open Release PR:** Target `base: main` $\leftarrow$ `compare: development`.
3. **Merge via Merge Commit:** Generates the production build on Vercel.
4. **Git Semantic Tagging:**
   ```powershell
   git switch main
   git pull --ff-only origin main
   git tag -a v1.0.0 -m "Release v1.0.0 - Baseline Project Setup & Documentation"
   git push origin v1.0.0
   ```

---

## 7. Emergency Playbook & Troubleshooting

### Accidentally committed to `development` locally (unpushed):
```powershell
# 1. Create your feature branch (commits move with you)
git switch -c feature/my-feature

# 2. Reset development back to matching origin
git switch development
git reset --hard origin/development

# 3. Switch back to your feature branch safely
git switch feature/my-feature
```

### Discard unwanted local modifications:
```powershell
# Discard specific file:
git restore path/to/file.tsx

# Discard all modified files:
git restore .

# Unstage a file:
git restore --staged path/to/file.tsx
```

---

## 8. Quick Reference Command Cheat Sheet

| Action | PowerShell Command |
| :--- | :--- |
| **Check current status** | `git status` |
| **List local branches** | `git branch` |
| **List all branches (local + remote)** | `git branch -a` |
| **Switch branch** | `git switch <branch-name>` |
| **Create & switch to new branch** | `git switch -c feature/<work-name>` |
| **Fetch updates from GitHub** | `git fetch origin` |
| **Pull latest development** | `git pull --ff-only origin development` |
| **Stage all changes** | `git add .` |
| **Commit staged changes** | `git commit -m "feat: message"` |
| **Push branch to GitHub** | `git push -u origin feature/<work-name>` |
| **Delete merged local branch** | `git branch -d feature/<work-name>` |
| **View formatted commit log** | `git log --oneline --graph --decorate -n 15` |
