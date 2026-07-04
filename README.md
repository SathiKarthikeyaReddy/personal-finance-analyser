# Personal Finance Analyser Dashboard

## 1. Overview
The Personal Finance Analyser Dashboard is a data-dense web application that ingests bank transaction CSVs and leverages a pluggable categorisation engine to identify spending patterns. It provides clear, actionable financial intelligence by automatically classifying transactions, computing month-over-month trends, and flagging statistical anomalies in spending behaviour.

## 2. Screenshot
![Placeholder for Dashboard Screenshot](Replace this image with a real screenshot of the dashboard before publishing)

## 3. How to Run Locally
The project ships with a file-based SQLite database and a rule-based categoriser by default, requiring zero paid dependencies or external API keys to start.

```bash
# 1. Clone the repository and navigate into it
git clone <repository_url> && cd personal-finance-analyser

# 2. Set up the backend environment and install dependencies
python -m venv venv && .\venv\Scripts\activate && pip install -r backend/requirements.txt

# 3. Start the FastAPI backend
cd backend && uvicorn main:app --reload

# 4. In a new terminal, install frontend dependencies
cd frontend && npm install

# 5. Start the React frontend
npm run dev
```

## 4. Architecture Overview
The application consists of a React frontend built with Vite, a Python FastAPI backend, and a file-based SQLite database. The frontend communicates with the backend via REST API calls. The backend handles CSV parsing, routes transactions through a pluggable categorisation module, and computes statistical anomalies before persisting the data to SQLite. 

```text
+-------------------+        REST API (JSON)       +-------------------+
|                   |  POST /upload                |                   |
|   React Frontend  | ---------------------------> |  FastAPI Backend  |
|   (Vite, Recharts)|                              |  (Pandas, Stat)   |
|                   | <--------------------------- |                   |
+-------------------+  GET /transactions, /analytics+---------+---------+
                                                              |
                                                              | SQLite (File)
                                                              v
                                                    +-------------------+
                                                    |  transactions.db  |
                                                    +-------------------+
```

## 5. Design Decisions

The categorisation logic was designed as a pluggable module with a swappable interface to solve the problem of vendor lock-in and local development friction. By defining a single function contract `(description: str) -> str`, the system can easily switch between a deterministic, zero-dependency rule-based engine and a powerful LLM-based engine. The rule-based engine ensures anyone can clone and run the repository immediately without configuring API keys. To enable the advanced LLM mode, a user simply sets the `CATEGORISER=gemini` and `GEMINI_API_KEY=<key>` environment variables, and the system dynamically routes descriptions to the Gemini 1.5 Flash API with a strictly engineered prompt.

The anomaly detection approach utilises a z-score method, computing the mean and standard deviation of transaction amounts per category. A threshold of two standard deviations was chosen because, in a normal distribution, it captures the top ~2.5% of extreme values, effectively filtering out minor fluctuations while highlighting genuinely unusual spend (e.g., a $2500 Apple Store purchase in a category where the mean is $100). A cold start guard is explicitly implemented to prevent flagging anomalies when a category has fewer than three transactions; without a sufficient sample size, standard deviation is statistically meaningless and would lead to high false-positive rates.

SQLite was selected as the database because it is lightweight, file-based, and perfectly suited for a single-user portfolio dashboard where ease of setup is paramount. It allows the entire state of the application to be shipped within the repository, requiring zero infrastructure provisioning for reviewers. However, SQLite is limited by its handling of concurrent writes and lack of robust access controls. In a production system operating at scale with thousands of concurrent users, this would be replaced with a managed PostgreSQL instance for its superior concurrency control, JSONB support for unstructured metadata, and horizontal scalability.

The UI design philosophy deliberately avoids trendy aesthetic flourishes like glassmorphism, heavy drop shadows, or gradient blobs. Instead, it targets a "Linear" or "Notion" aesthetic: clean, sharp, and highly typography-first. In a financial intelligence application, information density and readability must be prioritised over visual flair. Dark mode and a high-contrast monochromatic color palette (with minimal accent colors for anomalies) reduce cognitive load and ensure the user's attention is drawn directly to the data patterns and flagged transactions rather than the interface itself.

## 6. Relevance to Target Roles

**Business Analytics Analyst (Citi):** This project demonstrates a core competency in gathering raw, unstructured data (CSVs) and translating it into actionable business intelligence. The anomaly detection logic showcases a practical application of statistical analysis (z-scores, standard deviation) to identify risks or outliers. The dashboard design proves an ability to conduct exploratory data analysis and present complex datasets in a digestible, executive-ready format.

**Software Engineer (Ramp):** The architecture mirrors Ramp's core product surface: ingesting financial data, applying intelligence (LLMs) to categorize it, and presenting a data-dense, fast UI. The pluggable categorisation module demonstrates an understanding of scalable software design patterns. Explicitly handling edge cases (like the cold start problem in anomaly detection) and prioritizing a functional, dense UI over decorative fluff reflects the rigorous product engineering mindset required at Ramp.

## 7. Future Improvements
- **OAuth Integration:** Add Google/GitHub SSO to support multiple users with isolated transaction data.
- **PostgreSQL Migration:** Transition from SQLite to PostgreSQL for better scalability and concurrent request handling.
- **Multi-Currency Support:** Integrate an FX API to normalize transactions occurring in different currencies to a base currency.
- **Scheduled Alerts:** Implement a background worker (e.g., Celery) to send email notifications when severe anomalies are detected.
- **PDF Export:** Allow users to download a cleanly formatted monthly PDF report of their spending trends.
