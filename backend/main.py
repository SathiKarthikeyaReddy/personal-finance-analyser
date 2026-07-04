from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import uuid
import os
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables (e.g., CATEGORISER, GEMINI_API_KEY)
load_dotenv()

from database import init_db, get_db_connection
from categoriser import get_category
from anomaly import detect_anomalies

app = FastAPI(title="Personal Finance Analyser Dashboard")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Accepts a CSV file, parses it, runs categorisation on each transaction, 
    runs anomaly detection, stores everything in SQLite, and returns a summary.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Ensure required columns exist
        required_cols = ['date', 'description', 'amount']
        for col in required_cols:
            if col not in df.columns.str.lower():
                raise HTTPException(status_code=400, detail=f"Missing required column: {col}")
                
        # Lowercase column names for consistency
        df.columns = df.columns.str.lower()
        
        transactions = []
        for index, row in df.iterrows():
            desc = str(row['description'])
            category = get_category(desc)
            
            tx = {
                "id": str(uuid.uuid4()),
                "date": str(row['date']),
                "description": desc,
                "amount": float(row['amount']),
                "category": category
            }
            transactions.append(tx)
            
        # Run anomaly detection on the entire dataset
        # Wait, if we append to existing data, anomaly detection should consider all data.
        # Let's fetch existing transactions first, append new ones, and run detection on all.
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM transactions")
        existing_rows = cursor.fetchall()
        existing_transactions = [dict(row) for row in existing_rows]
        
        all_transactions = existing_transactions + transactions
        
        # Detect anomalies across the combined dataset
        processed_transactions = detect_anomalies(all_transactions)
        
        # To avoid updating existing rows, let's just clear and insert all? 
        # The prompt says "stores everything in SQLite". If it's an additive upload, 
        # updating existing anomaly scores would be necessary because the mean changes.
        # For simplicity and correctness, we will clear and re-insert all, or just update.
        # Let's clear and re-insert for a clean slate, or just update the whole table.
        cursor.execute("DELETE FROM transactions")
        
        for tx in processed_transactions:
            cursor.execute('''
                INSERT INTO transactions (id, date, description, amount, category, is_anomaly, anomaly_score)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (tx['id'], tx['date'], tx['description'], tx['amount'], tx['category'], tx.get('is_anomaly', 0), tx.get('anomaly_score', 0.0)))
            
        conn.commit()
        
        # Calculate summary for response
        total_processed = len(transactions)
        categories_found = len(set(tx['category'] for tx in transactions))
        anomalies_flagged = sum(1 for tx in processed_transactions if tx.get('is_anomaly') == 1)
        
        return {
            "message": "Upload successful",
            "total_transactions_processed": total_processed,
            "categories_found": categories_found,
            "anomalies_flagged": anomalies_flagged
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals():
            conn.close()

@app.get("/transactions")
def get_transactions(category: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, is_anomaly: Optional[bool] = None):
    """
    Returns all stored transactions with optional filters.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM transactions WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    if is_anomaly is not None:
        query += " AND is_anomaly = ?"
        params.append(1 if is_anomaly else 0)
        
    query += " ORDER BY date DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@app.get("/analytics")
def get_analytics():
    """
    Returns aggregated data: total spend by category, month over month totals, top merchants, and flagged anomalies.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total spend by category
    cursor.execute("SELECT category, SUM(amount) as total FROM transactions GROUP BY category ORDER BY total DESC")
    spend_by_category = [{"category": row["category"], "total": row["total"]} for row in cursor.fetchall()]
    
    # Month over month totals (assuming date is YYYY-MM-DD)
    cursor.execute("SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM transactions GROUP BY month ORDER BY month")
    month_over_month = [{"month": row["month"], "total": row["total"]} for row in cursor.fetchall()]
    
    # Top merchants (approximated by description)
    cursor.execute("SELECT description as merchant, SUM(amount) as total FROM transactions GROUP BY description ORDER BY total DESC LIMIT 5")
    top_merchants = [{"merchant": row["merchant"], "total": row["total"]} for row in cursor.fetchall()]
    
    # Flagged anomalies
    cursor.execute("SELECT * FROM transactions WHERE is_anomaly = 1 ORDER BY date DESC")
    anomalies = [dict(row) for row in cursor.fetchall()]
    
    # Total transactions
    cursor.execute("SELECT COUNT(*) as count FROM transactions")
    total_transactions = cursor.fetchone()["count"]
    
    conn.close()
    
    return {
        "spend_by_category": spend_by_category,
        "month_over_month": month_over_month,
        "top_merchants": top_merchants,
        "anomalies": anomalies,
        "total_spend": sum(item["total"] for item in spend_by_category),
        "total_transactions": total_transactions
    }

@app.delete("/transactions")
def clear_transactions():
    """
    Clears all stored data so the user can start fresh.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions")
    conn.commit()
    conn.close()
    
    return {"message": "All transactions cleared."}
