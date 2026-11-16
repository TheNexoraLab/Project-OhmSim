import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(edgePath)) {
  console.error(`Edge executable not found at: ${edgePath}`);
  process.exit(1);
}

const inputMdPath = process.argv[2];
const outputPdfPath = process.argv[3] || inputMdPath.replace(/\.md$/i, '.pdf');

if (!inputMdPath || !fs.existsSync(inputMdPath)) {
  console.error(`Input markdown file does not exist: ${inputMdPath}`);
  process.exit(1);
}

const mdContent = fs.readFileSync(inputMdPath, 'utf8');

// Parse markdown to HTML using npx marked or inline converter
const tmpHtmlPath = path.resolve(inputMdPath.replace(/\.md$/i, '.tmp.html'));

// Run npx -y marked
try {
  const htmlBody = execFileSync('npx.cmd', ['-y', 'marked', '--gfm'], {
    input: mdContent,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 10 * 1024 * 1024,
  });

  const titleMatch = mdContent.match(/^#\s+(.+)$/m);
  const docTitle = titleMatch ? titleMatch[1] : path.basename(inputMdPath, '.md');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e1e2e;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #11111b;
      font-weight: 700;
      page-break-after: avoid;
      break-after: avoid;
      margin-top: 1.3em;
      margin-bottom: 0.5em;
    }
    h1 {
      font-size: 20pt;
      border-bottom: 2px solid #313244;
      padding-bottom: 6px;
      margin-top: 0;
      color: #1e66f5;
    }
    h2 {
      font-size: 14pt;
      border-bottom: 1px solid #cdd6f4;
      padding-bottom: 4px;
      margin-top: 1.4em;
      color: #181825;
    }
    h3 {
      font-size: 11.5pt;
      margin-top: 1.2em;
      color: #313244;
    }
    p, ul, ol {
      margin-top: 0.4em;
      margin-bottom: 0.7em;
    }
    li {
      margin-bottom: 0.25em;
    }
    hr {
      border: 0;
      height: 1px;
      background: #bac2de;
      margin: 1.5em 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #cdd6f4;
      padding: 6px 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f2f4f8;
      font-weight: 700;
      color: #11111b;
    }
    tr:nth-child(even) td {
      background: #fafbfe;
    }
    code {
      font-family: Consolas, "Cascadia Code", SFMono-Regular, "Courier New", monospace;
      font-size: 8.5pt;
      background: #f1f2f6;
      color: #8839ef;
      padding: 1.5px 4.5px;
      border-radius: 4px;
      border: 1px solid #e6e8ee;
    }
    pre {
      background: #181825;
      color: #cdd6f4;
      padding: 10px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 8pt;
      line-height: 1.45;
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 0.8em 0;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: 0;
      font-size: inherit;
    }
    blockquote {
      border-left: 4px solid #1e66f5;
      background: #f4f7fe;
      margin: 0.8em 0;
      padding: 8px 14px;
      color: #313244;
      border-radius: 0 4px 4px 0;
    }
    blockquote p {
      margin: 0.3em 0;
    }
    a {
      color: #1e66f5;
      text-decoration: none;
    }
    .footer {
      margin-top: 2em;
      border-top: 1px solid #e6e8ee;
      padding-top: 8px;
      font-size: 8pt;
      color: #6c7086;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  ${htmlBody}
  <div class="footer">
    <span>NEXORA Labs • Project OhmSim</span>
    <span>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>
</body>
</html>`;

  fs.writeFileSync(tmpHtmlPath, fullHtml, 'utf8');

  console.log(`Generated HTML: ${tmpHtmlPath}`);

  const edgeArgs = [
    '--headless',
    '--disable-gpu',
    '--allow-file-access-from-files',
    '--run-all-compositor-stages-before-draw',
    `--print-to-pdf=${path.resolve(outputPdfPath)}`,
    tmpHtmlPath,
  ];

  console.log(`Converting to PDF via Microsoft Edge...`);
  execFileSync(edgePath, edgeArgs, { stdio: 'pipe' });

  // Clean up tmp HTML
  try {
    fs.unlinkSync(tmpHtmlPath);
  } catch {}

  const stats = fs.statSync(outputPdfPath);
  console.log(`✔ Successfully created PDF: ${outputPdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error(`Error generating PDF:`, err);
  process.exit(1);
}
