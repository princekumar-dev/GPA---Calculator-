<div align="center">

<img src="assets/images/campus.jpeg" alt="Campus" width="100%">

# MSEC Academics — GPA & CGPA Calculator

### Instant GPA/CGPA with a real Anna University course database — zero dependencies

![License](https://img.shields.io/badge/License-MIT-green)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-No_Build-yellow)
![Regulation](https://img.shields.io/badge/AU-Regulation_2024-blue)
![Courses](https://img.shields.io/badge/Course_DB-510_courses-ff69b4)
![Deploy](https://img.shields.io/badge/Deploy-Vercel_%7C_Any_Static_Host-black)

</div>

---

## 📖 Overview

**MSEC Academics** is a sleek, responsive GPA & CGPA dashboard built for students of
**Mohamed Sathak Engineering College** following **Anna University Regulation 2024**. Pick your
department and semester, and the app **pre-fills your actual course list with codes and credits** —
just enter grades and watch the GPA update live.

It supports both the **Anna University 10-point scale** and the **US 4.0 scale**, tracks your
CGPA across every saved semester, and keeps everything in your browser — no account, no server,
no data leaves your device.

## ✨ Features

### 🧮 GPA Calculator
- Pre-filled course table from the built-in course database (code, name, credits)
- Add/remove custom courses on the fly
- **Real-time GPA** as you type, with total credits and graded-course count

### 📈 CGPA Tracker
- Add each semester's GPA + credits to build your cumulative picture
- CGPA, total credits, **class/status badge** and semester history
- **Save & restore semesters** — state persists in `localStorage`

### 🎯 Setup & Presets
- Guided intro: department → semester → year → grading scale
- Preset-aware UI showing the current department/scale at all times

### 📊 Grade Insights
- Visual **grade distribution bars** for the current semester
- **Target GPA** helper to see what's needed
- **Grade-range reference modal** (O = 90+, A+ = 80–89, …) for quick lookup

### 💅 UX Polish
- Fully responsive, mobile-first layout
- Toast notifications, confirmation modals, smooth tab switching
- Custom error states and input validation (no NaN GPAs)

## 🎓 Grading Scales

| Scale | Map |
|---|---|
| **AU (Anna University, 10-point)** | O = 10 · A+ = 9 · A = 8 · B+ = 7 · B = 6 · C = 5 · U/SA/WD = 0 |
| **US (4.0 scale)** | A+/A = 4.0 · A− = 3.7 · B+ = 3.3 · B = 3.0 · B− = 2.7 · C+ = 2.3 · C = 2.0 · C− = 1.7 · D = 1.0 · F = 0.0 |

**GPA** = Σ(grade point × credits) ÷ Σ(credits) · **CGPA** = Σ(semester GPA × semester credits) ÷ Σ(semester credits)

## 🗄️ Course Database

[`courses_db.js`](courses_db.js) ships **510 courses** from the Anna University Regulation 2024
curriculum across **7 departments**, each with its official code and credit value:

| Dept | Department |
|---|---|
| CSE | Computer Science & Engineering |
| IT | Information Technology |
| ECE | Electronics & Communication Engineering |
| EEE | Electrical & Electronics Engineering |
| CIVIL | Civil Engineering |
| MECH | Mechanical Engineering |
| AIDS | Artificial Intelligence & Data Science |

## 🛠️ Tech Stack

- **HTML5 + CSS3 + vanilla JavaScript** — no frameworks, no build step, no `npm install`
- Custom stylesheet with utility-first classes; Google Fonts
- `localStorage` persistence (`msec_academics_state_v1`)
- Vercel config included (clean URLs + SPA rewrite)

## 🚀 Getting Started

```bash
git clone https://github.com/princekumar-dev/GPA---Calculator-.git
cd GPA---Calculator-
```

**Option 1 — just open it**

```
open index.html        # or double-click the file
```

**Option 2 — static server**

```bash
npx serve .            # or: python -m http.server
# open http://localhost:3000
```

**Option 3 — deploy**

Push to Vercel (the included [`vercel.json`](vercel.json) handles routing), Netlify, GitHub
Pages, or any static host.

## 📁 Project Structure

```
GPA---Calculator-/
├── index.html            # Single-page app markup (GPA + CGPA views)
├── styles.css            # Full design system (utility-first classes)
├── script.js             # App logic: state, GPA/CGPA math, UI, persistence
├── courses_db.js         # Anna University Reg-2024 course database (510 courses, 7 depts)
├── vercel.json           # Vercel routing (clean URLs + SPA rewrite)
├── assets/               # Favicons, PWA icon set, manifest, service worker
└── LICENSE               # MIT
```

## 🧪 How It Works

1. Choose department, semester, year and grading scale in the intro setup
2. The course table auto-fills from `courses_db.js` — enter a grade per course
3. GPA recalculates instantly; grade-distribution bars update as you go
4. Save the semester, then repeat — the CGPA tab builds your cumulative record
5. Everything is stored locally in your browser

## 🤝 Contributing

Issues and pull requests are welcome — especially additional departments, regulations, or scale presets.

## 📄 License

MIT © 2025 [princekumar-dev](https://github.com/princekumar-dev) — see [LICENSE](LICENSE).

## 👤 Author

**Prince Kumar** — [@princekumar-dev](https://github.com/princekumar-dev)

Built for the **MSEC** community — Chennai, Tamil Nadu, India.

---

<div align="center">
<sub><b>MSEC Academics</b> — know your GPA before the results do.</sub>
</div>
