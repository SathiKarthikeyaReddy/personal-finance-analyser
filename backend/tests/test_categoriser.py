import os
import pytest
from categoriser import rules_categoriser, get_category, ALLOWED_CATEGORIES

def test_rules_categoriser():
    assert rules_categoriser("UBER TRIP") == "Transport"
    assert rules_categoriser("MCDONALDS") == "Food and Dining"
    assert rules_categoriser("Netflix Subscription") == "Subscriptions"
    assert rules_categoriser("Random unknown merchant") == "Other"

def test_get_category_default_rules(monkeypatch):
    # Ensure CATEGORISER is not set to gemini
    monkeypatch.setenv("CATEGORISER", "rules")
    assert get_category("UBER TRIP") == "Transport"
