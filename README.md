<div align="center">

# RepoGuard — AI-Powered GitHub Repository Security & Code Health Analyzer

**Free, open-source security scanner for GitHub repositories.** Detect vulnerabilities, exposed secrets, insecure CI/CD workflows, and vulnerable dependencies — with AI-generated remediation reports powered by Google Gemini.

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Semgrep](https://img.shields.io/badge/Static%20Analysis-Semgrep-orange)](https://semgrep.dev/)
[![Gitleaks](https://img.shields.io/badge/Secret%20Detection-Gitleaks-red)](https://github.com/gitleaks/gitleaks)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

</div>

---

## What is RepoGuard?

**RepoGuard** is an AI-powered repository security and health scanner for GitHub. Point it at any public GitHub repository and it runs a full security audit — static code analysis, dependency vulnerability scanning, secret/credential leak detection, GitHub Actions (CI/CD) security review, and code quality metrics — then uses Google Gemini to turn the results into a clear, developer-friendly report.

If you're searching for a **GitHub repository vulnerability scanner**, an **automated code security audit tool**, an **open-source secret scanner**, or a way to **check GitHub Actions workflows for security risks**, RepoGuard covers all of it in a single scan.

---

## Key Features

- 🛡 **Static Application Security Testing (SAST)** — powered by [Semgrep](https://semgrep.dev/), detects insecure coding patterns and common vulnerability classes (OWASP-style issues).
- 📦 **Software Composition Analysis (SCA)** — cross-references your `package.json`, `requirements.txt`, `pyproject.toml`, and `pom.xml` dependencies against the [OSV.dev](https://osv.dev) vulnerability database.
- 🔑 **Secret & Credential Scanning** — uses [Gitleaks](https://github.com/gitleaks/gitleaks) to catch leaked API keys, tokens, and passwords before they become a breach. Secret values are never stored or exposed.
- ⚙ **GitHub Actions / CI/CD Security Review** — flags `pull_request_target` misuse, excessive write permissions, unpinned third-party actions, unsafe expression injection, and `curl | bash`-style remote code execution.
- ⌘ **Code Health & Maintainability Metrics** — README presence, test coverage indicators, dependency hygiene, TODO/FIXME density, oversized files, and language breakdown.
- ✦ **AI-Generated Security Report** — Google Gemini synthesizes every finding into an executive summary, risk breakdown, and prioritized remediation plan, strictly grounded in real scan data (no hallucinated vulnerabilities).
- 📊 **Transparent Weighted Scoring** — a single 0–100 Overall Score, broken down by category, so you can track repository security posture over time.

---

## Why Use RepoGuard?

Most GitHub security tools do only one job — a linter, a dependency checker, or a secret scanner — forcing teams to stitch together multiple tools and dashboards. RepoGuard combines the essential categories of repository security (code, dependencies, secrets, CI/CD, and code health) into one scan with one unified score, making it a practical **all-in-one GitHub security and DevSecOps tool** for developers, students, security researchers, and open-source maintainers who want a fast security baseline without an enterprise price tag.

---

## How Scoring Works

Each category is scored 0–100 based on finding severity:

```
penalty = (critical × 25) + (high × 15) + (medium × 7) + (low × 2)
score   = 100 - penalty
```

**Overall Score** is a weighted average:

| Category | Weight |
|---|---|
| Security (SAST) | 35% |
| Dependencies (SCA) | 20% |
| Secrets | 20% |
| CI/CD | 15% |
| Code Health | 10% |

**Risk levels:** `LOW` (90+) · `MEDIUM` (75–89) · `HIGH` (50–74) · `CRITICAL` (<50)

---

## Tech Stack

**Backend:** FastAPI · SQLAlchemy · MySQL · GitPython · Semgrep · Gitleaks · OSV API · Google Gemini API
**Frontend:** HTML5 · CSS3 · Vanilla JavaScript (no framework, no build step)
**Deployment:** Render (Web Service + Static Site)

---

## Project Structure

```
repo-guard/
├── backend/
│   └── app/
│       ├── api/            # FastAPI routers: repositories, scans, ai_report
│       ├── core/           # Database engine & settings
│       ├── models/         # SQLAlchemy models
│       └── services/       # Scanners, scoring engine, AI integration
│       └── main.py
└── frontend/
    ├── *.html
    ├── css/
    └── js/
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- MySQL database
- [Semgrep](https://semgrep.dev/docs/getting-started/) and [Gitleaks](https://github.com/gitleaks/gitleaks#installing) on your `PATH`
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Set environment variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | e.g. `mysql+pymysql://user:pass@host/dbname` |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_MODEL` | e.g. `gemini-2.5-flash` |

Run it:

```bash
uvicorn app.main:app --reload
```

API docs: `http://127.0.0.1:8000/docs` · Health check: `/api/health`

### Frontend

Static HTML/CSS/JS — no build step. Set `API_URL` in each file under `frontend/js/` to your backend URL, then serve `frontend/` from any static host (Render, Netlify, Vercel, GitHub Pages, etc.).

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/repositories/?repository_url=...` | Register a repository for scanning |
| `POST` | `/api/scans/?repository_id=...` | Start a new security scan |
| `GET` | `/api/scans/` | List all scans |
| `GET` | `/api/scans/{id}` | Scan details and scores |
| `GET` | `/api/scans/{id}/status` | Scan progress polling |
| `GET` | `/api/scans/{id}/findings` | Static analysis findings |
| `GET` | `/api/scans/{id}/dependencies` | Dependency vulnerability results |
| `GET` | `/api/scans/{id}/secrets` | Detected secrets (metadata only) |
| `GET` | `/api/scans/{id}/cicd` | CI/CD workflow findings |
| `GET` | `/api/scans/{id}/health` | Code health metrics |
| `GET` | `/api/scans/{id}/ai-report` | AI-generated security report |
| `GET` | `/api/health` | Backend & database health check |

---

## Security & Privacy

- Repositories are cloned to a temporary directory and deleted immediately after scanning — no code is retained.
- Secret **values** are never stored, logged, or returned by the API — only type, file, line number, and severity.
- Scanned code is never executed.
- Currently supports public GitHub repositories.

---

## Roadmap

- [ ] Private repository support via GitHub OAuth
- [ ] GitLab and Bitbucket support
- [ ] Exportable PDF security reports
- [ ] Scheduled re-scans with historical trend tracking
- [ ] Additional dependency ecosystems (Go modules, Cargo, etc.)

---

## Contributing

Contributions, issues, and feature requests are welcome — check the [issues page](../../issues) to get started. If you find RepoGuard useful, consider giving the repo a ⭐ — it helps others discover the project.

---

## Keywords

`github security scanner` · `repository vulnerability scanner` · `AI code security analysis` · `secret detection tool` · `dependency vulnerability checker` · `CI/CD security scanner` · `github actions security` · `open source SAST tool` · `code health analyzer` · `DevSecOps automation`

---

## License

*(Add your chosen license here — e.g. MIT, Apache 2.0. Search engines and GitHub both surface license info, so don't skip this.)*