# Cursor Setup Guide

Migration from Claude Code to Cursor IDE with corporate account.

---

## Step 1: Clone & Open in Cursor

```bash
git clone <repo-url> performance-testing-poc
cd performance-testing-poc
cursor .
```

Cursor will auto-detect `.cursorrules` and load context.

---

## Step 2: Environment Setup

Create `.env` in project root:

```env
GROQ_API_KEY=gsk_<your-key-here>
TARGET_API_URL=http://localhost:3000
```

Get GROQ_API_KEY (free):
1. Visit https://console.groq.com
2. Sign up or log in
3. Create API key
4. Paste here

---

## Step 3: Dependencies

```bash
# Root
npm install

# Mock API
cd api
npm install
cd ..
```

Check Node version:
```bash
node --version  # Should be 18+
```

---

## Step 4: First Run

Terminal 1 (Mock API):
```bash
cd api
npm run dev
# Runs on http://localhost:3000
```

Terminal 2 (Test):
```bash
npm run example:simple
# Should see metrics in ~5 seconds
# Should see Groq analysis
```

If it works → project is ready.

---

## Step 5: Corporate Account Integration (Optional)

If your company uses custom Groq instance or different AI provider:

1. **Custom Groq endpoint**: Edit `src/parsers/result-parser.ts` → `callGroqAPI()` → change `api.groq.com` to your endpoint
2. **Different AI provider**: Add new function (e.g., `callCorporateAI()`), update provider fallback chain

---

## Cursor + Git Integration

Cursor integrates with git. To push updates back:

```bash
git add .
git commit -m "Add corporate account setup"
git push origin main
```

---

## Talk Presentation (June 27, 2026)

**Demo sequence** (20 min):
1. `npm run example:simple` — Show basic metrics (2 min)
2. `npm run example:chaos` — 4 scenarios comparison (8 min, leave running while you talk)
3. `npm run example:webpage` — Lighthouse results (5 min)

**Slides**: `docs/Performance-Testing-com-IA.pptx` (15 slides, all done)

**Fallback**: If internet dies, screenshots already captured in examples output.

---

## Quick Reference

| Task | Command |
|------|---------|
| Run simple test | `npm run example:simple` |
| Chaos engineering | `npm run example:chaos` |
| Lighthouse test | `npm run example:webpage` |
| Compare APIs | `npm run example:public` |
| Regenerate slides | `cd docs && node create-slides.js` |
| Kill mock API (port stuck) | `lsof -i :3000` (macOS/Linux) or `netstat -ano \| findstr :3000` (Windows) |

---

## Troubleshooting

**Q: "GROQ_API_KEY not found"**  
A: Check `.env` is in root. Verify you added the key. Restart terminal.

**Q: "Port 3000 already in use"**  
A: Kill previous API process: `npm run dev` on another PORT or kill the process.

**Q: "Chrome not found" (Lighthouse error)**  
A: Lighthouse requires Chrome installed. Install from google.com/chrome.

**Q: "Groq JSON parse error"**  
A: Normal — parser retries with sanitization. If persistent, check internet.

**Q: "Module not found" (TypeScript error)**  
A: Run `npm install` in both root and `api/` folders.

---

## Next Development Steps

After talk (post-June 27):

1. **CI/CD integration**: Add GitHub Actions workflow
   - Run tests on PR
   - Set performance thresholds
   - Block merge if P95 > 500ms

2. **OAuth support**:
   - Add Bearer token + refresh logic
   - Allow headers config in test generation

3. **HTML reports**:
   - Use pptxgenjs or custom template
   - Export formatted results + charts

4. **Test chaining**:
   - Pass response data from test A → test B
   - Extract IDs from payload, use in next request

---

**See IDP_CONTEXT.md for full project details.**
