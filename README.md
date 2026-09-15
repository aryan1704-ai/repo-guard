# RepoGuard

**AI-Powered GitHub Repository Security & Health Analyzer**

RepoGuard scans any public GitHub repository and produces a structured security and code-quality report. It combines deterministic scanners (static analysis, dependency vulnerability checks, secret detection, CI/CD workflow review, code health metrics) with a transparent scoring system, then uses Google Gemini to turn the raw findings into a clear, human-readable report — grounded strictly in what was actually detected.

**🔗 [Try the Live Demo — RepoGuard Dashboard](https://repoguard-frontend.onrender.com/dashboard.html)**

---

## Features

| Area | What it checks |
|---|---|
| 🛡 **Security (Static Analysis)** | Scans source code with Semgrep to detect risky patterns and common vulnerability classes. |
| 📦 **Dependencies** | Parses `package.json`, `requirements.txt`, `pyproject.toml`, and `pom.xml`, then checks each dependency against the [OSV.dev](https://osv.dev) vulnerability database. |
| 🔑 **Secrets** | Uses [Gitleaks](https://github.com/gitleaks/gitleaks) to detect potentially exposed API keys, tokens, and credentials. Secret *values* are never stored or displayed — only type, location, and severity. |
| ⚙ **CI/CD Security** | Analyzes GitHub Actions workflows for risks such as `pull_request_target` misuse, excessive `contents: write` permissions, unpinned actions, unsafe expression interpolation, and remote script execution (`curl \| bash`). |
| ⌘ **Code Health** | Measures repository size, language breakdown, test coverage indicators, README presence, dependency file presence, TODO/FIXME density, and oversized files. |
| ✦ **AI Report** | Sends only the scan's own findings to Gemini, which is explicitly instructed not to invent issues, and returns a structured report: Executive Summary, Overall Risk, Top Security Risks, Dependency Risks, Secret Summary, CI/CD Security, Code Health, and Recommended Actions. |

---

## How Scoring Works

Each category produces a score from 0–100, based on the severity mix of its findings:

```
penalty = (critical × 25) + (high × 15) + (medium × 7) + (low × 2)
score   = 100 - penalty   (clamped between 0 and 100)
```

The **Overall Score** is a weighted average:

| Category | Weight |
|---|---|
| Security | 35% |
| Dependencies | 20% |
| Secrets | 20% |
| CI/CD | 15% |
| Code Health | 10% |

Risk levels: `LOW` (90+), `MEDIUM` (75–89), `HIGH` (50–74), `CRITICAL` (<50).

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — REST API
- [SQLAlchemy](https://www.sqlalchemy.org/) + MySQL — persistence
- [GitPython](https://gitpython.readthedocs.io/) — shallow repository cloning
- [Semgrep](https://semgrep.dev/) — static analysis
- [Gitleaks](https://github.com/gitleaks/gitleaks) — secret detection
- [OSV API](https://osv.dev/) — dependency vulnerability lookups
- [Google Gemini API](https://ai.google.dev/) — AI-generated report synthesis
- `httpx` — async HTTP client for GitHub/OSV calls

**Frontend**
- Plain HTML / CSS / JavaScript (no build step, no framework)
- Deployed as a static site

**Deployment**
- Backend: Render Web Service
- Frontend: Render Static Site

---

## Project Structure

```
repo-guard/
├── backend/
│   └── app/
│       ├── api/            # FastAPI routers (repositories, scans, ai_report)
│       ├── core/           # Database engine & settings
│       ├── models/         # SQLAlchemy models
│       └── services/       # Scanners, scoring, AI integration
│       └── main.py         # FastAPI app entrypoint
└── frontend/
    ├── *.html              # Dashboard, scan, results, reports pages
    ├── css/
    └── js/                 # Per-page API calls to the backend
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- MySQL database
- [Semgrep](https://semgrep.dev/docs/getting-started/) and [Gitleaks](https://github.com/gitleaks/gitleaks#installing) installed and available on `PATH`
- A [Gemini API key](https://aistudio.google.com/apikey)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file (or set these as environment variables):

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql+pymysql://user:pass@host/dbname` |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `GEMINI_MODEL` | Gemini model name to use, e.g. `gemini-2.5-flash` |

Run the API:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`, with interactive docs at `/docs` and a health check at `/api/health`.

### Frontend Setup

The frontend is static — no build step required. Open `frontend/js/*.js` and set `API_URL` (or `API_BASE_URL` in `ai-report.js`) to your backend's URL, then serve the `frontend/` folder with any static file host (or open `dashboard.html` directly for local testing against a local backend).

---

## Core API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/repositories/?repository_url=...` | Register a GitHub repository for scanning |
| `POST` | `/api/scans/?repository_id=...` | Start a new scan |
| `GET` | `/api/scans/` | List all scans |
| `GET` | `/api/scans/{id}` | Get scan details and scores |
| `GET` | `/api/scans/{id}/status` | Poll scan progress |
| `GET` | `/api/scans/{id}/findings` | Static analysis findings |
| `GET` | `/api/scans/{id}/dependencies` | Dependency scan results |
| `GET` | `/api/scans/{id}/secrets` | Detected secrets (metadata only) |
| `GET` | `/api/scans/{id}/cicd` | CI/CD workflow findings |
| `GET` | `/api/scans/{id}/health` | Code health metrics |
| `GET` | `/api/scans/{id}/ai-report` | AI-generated narrative report |
| `GET` | `/api/health` | Backend + database health check |

---

## Security & Privacy Notes

- Repositories are cloned to a temporary directory and deleted immediately after scanning.
- Secret *values* are never stored, logged, or returned by the API — only their type, file, line number, and severity.
- No code from analyzed repositories is executed.
- Currently supports public GitHub repositories only.

---

## Roadmap Ideas

- [ ] Support private repositories via GitHub OAuth
- [ ] Support GitLab / Bitbucket
- [ ] PDF/exportable report generation
- [ ] Scheduled re-scans and diffing between scans
- [ ] Support additional dependency ecosystems (Go modules, Cargo, etc. beyond current parsing)

---

## Contributing

Issues and pull requests are welcome. If you're proposing a significant change, please open an issue first to discuss what you'd like to change.

---

## License

This project is licensed under the [MIT License](LICENSE).