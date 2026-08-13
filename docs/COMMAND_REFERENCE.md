# OhmSim Terminal Command Reference

Run commands from the repository root:

\`\`\`powershell
Set-Location "C:\Users\Daniel\Documents\NEXORA\project-ohmsim"
\`\`\`

## Git workflow

Check the current branch and working tree:

\`\`\`powershell
git status
git branch --show-current
git log --oneline --decorate -8
\`\`\`

Update local branch information:

\`\`\`powershell
git fetch origin
git switch development
git pull --ff-only origin development
\`\`\`

Create a focused work branch:

\`\`\`powershell
git switch -c feature/<work-name>
\`\`\`

Review and save work:

\`\`\`powershell
git diff
git add .
git commit -m "feat: describe the completed change"
git push -u origin feature/<work-name>
\`\`\`

Open a pull request from:

\`\`\`text
feature/<work-name> → development
\`\`\`

After a pull request is merged:

\`\`\`powershell
git switch development
git pull --ff-only origin development
\`\`\`

List branches:

\`\`\`powershell
git branch
git branch -a
\`\`\`

An already-merged local branch can be removed with:

\`\`\`powershell
git branch -d feature/<work-name>
\`\`\`

Do not use \`git reset --hard\`, force-push, or delete \`main\`/\`development\` without explicit approval.

## npm and Next.js

Install dependencies after cloning or pulling dependency changes:

\`\`\`powershell
npm install
\`\`\`

Run the development server:

\`\`\`powershell
npm run dev
\`\`\`

Then open \`http://localhost:3000\`.

Validate code before a pull request:

\`\`\`powershell
npm run lint
npm run build
\`\`\`

Run the production build locally:

\`\`\`powershell
npm run start
\`\`\`

Add or remove a dependency from the repository root:

\`\`\`powershell
npm install <package-name>
npm uninstall <package-name>
\`\`\`

The current project scripts are defined in \`package.json\`. Do not install packages from the user home directory; always confirm the terminal is inside \`project-ohmsim\` first.

## Prisma commands (after Prisma is added)

These commands are future commands. They will work only after \`prisma\` and \`@prisma/client\` are added and \`prisma/schema.prisma\` exists.

\`\`\`powershell
npm install prisma @prisma/client
npx prisma init
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name <migration-name>
npx prisma migrate deploy
npx prisma studio
\`\`\`

Use \`migrate dev\` for local development and \`migrate deploy\` in deployment environments. \`npx prisma migrate reset\` is destructive and must only be used on an approved local database.

## Environment variables

Create local environment configuration from the safe example file:

\`\`\`powershell
Copy-Item .env.example .env.local
\`\`\`

Never commit \`.env.local\`, real passwords, API keys, database URLs, or cloud credentials. Update \`.env.example\` with variable names and non-secret example values only.

## Future test commands

Test scripts will be added as testing tools are selected. Typical commands may include:

\`\`\`powershell
npm test
npm run test:watch
npm run test:e2e
\`\`\`

Do not use commands that are not defined in \`package.json\`; add the script and dependency as part of the testing feature first.

## Useful PowerShell commands

\`\`\`powershell
Get-ChildItem -Force
Get-ChildItem -Recurse -Directory
Get-Content .env.example
Test-Path .\prisma\schema.prisma
\`\`\`

If a command appears to run in the wrong folder, use an explicit \`Set-Location -LiteralPath\` before running it.

## Recommended pre-PR checklist

\`\`\`powershell
git status
npm run lint
npm run build
git diff --stat
git add .
git commit -m "<conventional commit message>"
git push -u origin <branch-name>
\`\`\`

