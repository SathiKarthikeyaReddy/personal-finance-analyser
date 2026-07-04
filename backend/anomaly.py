import statistics
from typing import List, Dict, Tuple

# Number of standard deviations above the mean to flag an anomaly
ANOMALY_THRESHOLD = 2.0

# Minimum number of transactions required in a category to perform anomaly detection
COLD_START_THRESHOLD = 3

def detect_anomalies(transactions: List[Dict]) -> List[Dict]:
    """
    Detects anomalous transactions based on category spending.
    A transaction is flagged if its amount is > 2 standard deviations above the mean for that category.
    Handles the cold start edge case (fewer than 3 transactions).
    """
    # Group amounts by category
    category_amounts = {}
    for tx in transactions:
        cat = tx["category"]
        amt = float(tx["amount"])
        if cat not in category_amounts:
            category_amounts[cat] = []
        category_amounts[cat].append(amt)
        
    # Calculate mean and std_dev for each category
    category_stats = {}
    for cat, amounts in category_amounts.items():
        # Cold start guard: if fewer than 3 transactions, statistics are not meaningful
        if len(amounts) < COLD_START_THRESHOLD:
            continue
            
        mean = statistics.mean(amounts)
        std_dev = statistics.stdev(amounts)
        
        # If std_dev is 0, we can't flag anomalies accurately (all amounts are the same)
        if std_dev == 0:
            continue
            
        category_stats[cat] = {"mean": mean, "std_dev": std_dev}
        
    # Flag transactions
    for tx in transactions:
        cat = tx["category"]
        amt = float(tx["amount"])
        
        tx["is_anomaly"] = 0
        tx["anomaly_score"] = 0.0
        
        if cat in category_stats:
            mean = category_stats[cat]["mean"]
            std_dev = category_stats[cat]["std_dev"]
            
            if amt > mean:
                score = (amt - mean) / std_dev
                tx["anomaly_score"] = round(score, 2)
                
                if score > ANOMALY_THRESHOLD:
                    tx["is_anomaly"] = 1
                    
    return transactions
