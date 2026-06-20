# BioShield Flood Dashboard

BioShield is a prototype dashboard designed to forecast biological risks in flood-prone regions using weather data, synthetic river levels, and demographic vulnerability metrics.

## Tech Stack
- **Backend:** FastAPI, SQLite, SQLAlchemy, Alembic
- **Frontend:** Next.js 14 (App Router), TailwindCSS, Shadcn UI, Recharts

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
1. Open a terminal in the `backend` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and seed data:
   ```bash
   alembic upgrade head
   python -m app.seed.seed_districts
   ```
5. Run the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend
1. Open a new terminal in the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Access the dashboard at [http://localhost:3000](http://localhost:3000).

## Usage
- **Admin Panel:** Visit `/admin` to log in (username: `admin`, password: `admin`).
- **Subscription:** Visit `/subscribe` to register for mock alerts based on risk thresholds.
- **Ingestion Cycle:** You can trigger a manual ingestion cycle by running `python test_ingestion.py` in the backend folder.
