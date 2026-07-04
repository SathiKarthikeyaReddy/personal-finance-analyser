import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from anomaly import detect_anomalies

def test_anomaly_detection_normal():
    # 3 normal transactions, no anomalies
    transactions = [
        {"id": "1", "category": "Food", "amount": 10.0},
        {"id": "2", "category": "Food", "amount": 12.0},
        {"id": "3", "category": "Food", "amount": 11.0},
    ]
    
    result = detect_anomalies(transactions)
    for tx in result:
        assert tx["is_anomaly"] == 0

def test_anomaly_detection_with_anomaly():
    # 3 normal, 1 anomaly (> 2 std devs)
    # mean of [10, 10, 10] is 10, std_dev is 0. 
    # Wait, if std_dev is 0 it skips. Let's make it have variance.
    # [10, 12, 14, 50]. Mean = 21.5, std_dev = ~19.2
    # 50 - 21.5 = 28.5 / 19.2 = 1.48 (Not > 2)
    # Let's do [10, 10, 11, 10, 10, 100]
    # mean ~ 25, std_dev ~ 36. 100 is > 2 std_dev above mean
    
    transactions = [
        {"id": "1", "category": "Shopping", "amount": 10.0},
        {"id": "2", "category": "Shopping", "amount": 10.0},
        {"id": "3", "category": "Shopping", "amount": 11.0},
        {"id": "4", "category": "Shopping", "amount": 10.0},
        {"id": "5", "category": "Shopping", "amount": 10.0},
        {"id": "6", "category": "Shopping", "amount": 150.0}, # Anomaly
    ]
    
    result = detect_anomalies(transactions)
    anomaly_tx = next(tx for tx in result if tx["id"] == "6")
    assert anomaly_tx["is_anomaly"] == 1
    
    normal_tx = next(tx for tx in result if tx["id"] == "1")
    assert normal_tx["is_anomaly"] == 0

def test_anomaly_detection_cold_start():
    # Cold start edge case: fewer than 3 transactions
    transactions = [
        {"id": "1", "category": "Transport", "amount": 10.0},
        {"id": "2", "category": "Transport", "amount": 1000.0}, # Even though it's huge, cold start prevents it
    ]
    
    result = detect_anomalies(transactions)
    for tx in result:
        assert tx["is_anomaly"] == 0
