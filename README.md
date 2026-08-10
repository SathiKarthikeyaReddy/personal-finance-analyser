# Personal Finance Analyser Dashboard

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=chartdotjs&logoColor=white)

**A data-dense personal finance dashboard that ingests bank CSVs, auto-categorises transactions, computes spending trends, and flags statistical anomalies in your financial behaviour.**

</div>

---

## Overview

The Personal Finance Analyser Dashboard provides clear, actionable financial intelligence by automatically classifying bank transactions, computing month-over-month spending trends, and flagging statistical anomalies. The categorisation engine is **pluggable** — swap between a zero-dependency rule-based engine (works offline with no API keys) and a powerful LLM-powered engine without changing any other code.

## Architecture

```text
+-------------------+        REST API (JSON)       +-------------------+
|                   |  POST /upload                |                   |
|   React Frontend  | ---------------------------> |  FastAPI Backend  |
|   (Vite, Recharts)|                              |  (pandas, stats)  |
|                   | <--------------------------- |                   |
+-------------------+  GET /transactions, /analytics +---------+---------+
                                                              |
                                                    SQLite (File)
                                                              v
                                                    +-------------------+
                                                    |  transactions.db  |
                                                    +-------------------+
```

## Features

- 📁 **CSV Drag-and-Drop** — Automatic field mapping for common bank export formats
- 🏷️ **Pluggable Categorisation** — Rule-based engine (zero dependencies) or LLM-powered via single interface swap
- 📈 **Month-over-Month Trends** — Interactive Recharts visualisations of spending by category over time
- 🔔 **Statistical Anomaly Detection** — Flags transactions deviating significantly from your personal baseline
- 💾 **Persistent SQLite Storage** — Transactions survive browser refresh and app restarts
- 🔑 **Zero API Keys Required** — Clone and run immediately with the built-in rule-based engine

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts |
| Backend | Python 3.10+, FastAPI, pandas |
| Database | SQLite (file-based) |
| AI (optional) | Google Gemini API |

## Running Locally

```bash
# 1. Clone and enter the repo
git clone https://github.com/SathiKarthikeyaReddy/personal-finance-analyser.git
cd personal-finance-analyser

# 2. Set up backend environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r backend/requirements.txt

# 3. Copy env file (add Gemini API key only if you want LLM categorisation)
cp .env.example .env

# 4. Start the FastAPI backend
cd backend && uvicorn main:app --reload

# 5. In a new terminal, start the React frontend
cd frontend && npm install && npm run dev

# 6. Open http://localhost:5173 and upload the provided sample_transactions.csv
```

## Design Decisions

The categorisation logic was designed as a **pluggable module** with a swappable interface to solve the problem of vendor lock-in and local development friction. By defining a single function contract `(description: str) -> str`, the system can switch between:

- A **deterministic, zero-dependency rule-based engine** — anyone can clone and run immediately
- A **powerful LLM-based engine** — just set `GEMINI_API_KEY` in `.env`

This pattern ensures the repository is always runnable by anyone, regardless of whether they have API credentials.

---

<div align="center">
Made with ❤️ by <a href="https://github.com/SathiKarthikeyaReddy">Sathi Karthikeya Reddy</a>
</div>
