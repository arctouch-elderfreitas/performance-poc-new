# 🚀 START HERE — Cursor Migration Guide

You're reading this because you cloned this project into Cursor with your corporate account. Here's where to go next.

---

## Context Files (Read in Order)

These files contain everything you need to understand the project:

### 1. **IDP_CONTEXT.md** (START HERE — 5 min read)
Complete project overview:
- What's built ✅
- What's pending ❌
- File structure
- How to run examples
- Groq setup instructions

**Read this first.** It's the full story.

### 2. **.cursorrules** (Auto-loaded by Cursor)
Cursor automatically reads this file and uses it as project context in the sidebar.
- Tech stack summary
- Quick task reference
- Known quirks
- Setup checklist

**Don't edit unless you want to change how Cursor interprets the project.**

### 3. **CURSOR_SETUP.md** (5 min — for migration)
Step-by-step setup for Cursor:
- Clone & open
- Environment setup (GROQ_API_KEY)
- Dependencies
- First run checklist
- Corporate account integration notes

**Follow this if you haven't run the project yet.**

### 4. **SESSION_LOG.md** (10 min — optional, for context)
Development timeline from day 1:
- What was built in each session
- Decisions made & why
- Challenges solved
- Current status

**Read this to understand how we got here.**

---

## Quick Start (2 min)

```bash
# 1. Create .env
cat > .env << 'EOF'
GROQ_API_KEY=gsk_<your-key-here>
TARGET_API_URL=http://localhost:3000
EOF

# 2. Get your key from https://console.groq.com (free, 5 min)

# 3. Install
npm install
cd api && npm install && cd ..

# 4. Terminal 1: Mock API
cd api && npm run dev

# 5. Terminal 2: Test
npm run example:simple
```

If you see metrics + Groq analysis → **everything works**.

---

## Project Map

```
📁 performance-testing-poc/
├── 📄 IDP_CONTEXT.md          👈 MAIN REFERENCE (read first)
├── 📄 CURSOR_SETUP.md         👈 Setup steps
├── 📄 SESSION_LOG.md          👈 How we built this
├── 📄 .cursorrules            👈 Auto-loaded by Cursor
├── 📄 README.md               👈 Features + examples reference
│
├── 📁 src/                     Core framework
│   ├── config/env.ts          Env vars
│   ├── engines/               Load testing + Lighthouse
│   ├── parsers/               AI analysis (Groq)
│   ├── generators/            Test generation
│   └── utils/                 Helpers
│
├── 📁 tests/examples/          6 working examples
│   ├── 01-simple-get.perf.ts
│   ├── 02-load-test.perf.ts
│   ├── 03-ai-generated-test.perf.ts
│   ├── 04-chaos-test.perf.ts       👈 Best demo
│   ├── 05-public-api-test.perf.ts
│   └── 06-webpage-test.perf.ts
│
├── 📁 api/                     Mock server (port 3000)
│   └── src/
│       ├── server.ts          Express + chaos middleware
│       ├── middleware/chaos.ts
│       ├── routes/control.ts
│       └── store/memory-store.ts
│
├── 📁 docs/                    Documentation
│   ├── NOTION_ARTICLE.md       Article for publication
│   ├── SLIDES_OUTLINE.md       Talk structure
│   ├── create-slides.js        PPTX generator
│   └── Performance-Testing-com-IA.pptx  👈 FINAL SLIDES
│
└── 📄 .env                     (Create this — add GROQ_API_KEY)
```

---

## Next Steps

### Immediate
- [ ] Create `.env` with GROQ_API_KEY
- [ ] `npm install` in root + `cd api && npm install`
- [ ] Run `npm run example:simple` to verify setup

### For June 27 Talk
- [ ] Review `docs/Performance-Testing-com-IA.pptx` (15 slides)
- [ ] Run `npm run example:chaos` to see live demo
- [ ] Practice: `npm run example:simple` → `npm run example:chaos` → `npm run example:webpage`
- [ ] Prepare fallback screenshots (save outputs if internet might fail)

### Post-Talk (v1.0)
- [ ] CI/CD integration (GitHub Actions)
- [ ] OAuth / dynamic auth
- [ ] HTML report export
- [ ] Test chaining

---

## Common Questions

**Q: Where do I find the slides for the talk?**  
A: `docs/Performance-Testing-com-IA.pptx` — 15 slides, all done.

**Q: How do I run the demo?**  
A: Terminal 1: `cd api && npm run dev`. Terminal 2: `npm run example:chaos`.

**Q: I changed something. How do I update slides?**  
A: Edit `docs/create-slides.js`, run `node create-slides.js` from docs/ folder.

**Q: Where's my GROQ_API_KEY?**  
A: Get free one at https://console.groq.com (5 min setup).

**Q: Can I run this with a different AI provider?**  
A: Yes — edit `src/parsers/result-parser.ts`, add new provider to fallback chain.

**Q: What if the mock API port 3000 is already taken?**  
A: Kill process on 3000 or change port in `api/src/server.ts`.

---

## Key Files to Modify

If you need to:

- **Change talk slides** → Edit `docs/create-slides.js`, run node command
- **Add test example** → Copy `tests/examples/01-*.perf.ts`, modify URL/config
- **Change AI analysis** → Edit `src/parsers/result-parser.ts` prompts
- **Control chaos behavior** → Edit `api/src/middleware/chaos.ts` or POST to `/control/config`
- **Update README** → Edit `README.md` (auto-synced when you commit)

---

## Cursor Pro Tips

1. **Open terminal split**: Terminal → New Terminal (run API + test side-by-side)
2. **Search project**: Cmd+Shift+F (find all refs to "Groq", "chaos", etc)
3. **AI assistant**: Use Cursor's built-in Claude to ask questions about code
4. **Git integration**: Cursor has built-in git UI, push directly from editor
5. **Define keyword shortcuts**: Add `.cursorrules` updates if you want custom behavior

---

## You're All Set

1. ✅ Read **IDP_CONTEXT.md**
2. ✅ Follow **CURSOR_SETUP.md**
3. ✅ Run first example
4. ✅ Explore the code

**Questions?** Check **IDP_CONTEXT.md** (full details), **SESSION_LOG.md** (how we built it), or look at working examples in `tests/examples/`.

---

**Cloned on**: 2026-04-16  
**Ready for**: Cursor IDE + corporate account  
**Talk date**: June 27, 2026
