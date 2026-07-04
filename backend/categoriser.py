import os
from google import genai
from typing import List

# Allowed categories for the transactions
ALLOWED_CATEGORIES = [
    "Food and Dining",
    "Transport",
    "Shopping",
    "Entertainment",
    "Health",
    "Utilities",
    "Rent and Housing",
    "Subscriptions",
    "Travel",
    "Other"
]

def rules_categoriser(description: str) -> str:
    """
    Categorises a transaction based on deterministic keyword matching.
    """
    desc = description.lower()
    
    if any(keyword in desc for keyword in ["restaurant", "cafe", "mcdonalds", "kfc", "burger", "pizza", "dining", "food", "grocery", "supermarket"]):
        return "Food and Dining"
    elif any(keyword in desc for keyword in ["uber", "lyft", "taxi", "train", "bus", "petrol", "gas", "shell", "transit", "metro"]):
        return "Transport"
    elif any(keyword in desc for keyword in ["amazon", "walmart", "target", "clothing", "shoes", "mall", "store"]):
        return "Shopping"
    elif any(keyword in desc for keyword in ["movie", "cinema", "ticket", "concert", "museum", "game"]):
        return "Entertainment"
    elif any(keyword in desc for keyword in ["pharmacy", "hospital", "clinic", "dental", "doctor", "health"]):
        return "Health"
    elif any(keyword in desc for keyword in ["water", "electricity", "gas bill", "internet", "comcast", "verizon", "utility"]):
        return "Utilities"
    elif any(keyword in desc for keyword in ["rent", "mortgage", "housing", "apartment", "estate"]):
        return "Rent and Housing"
    elif any(keyword in desc for keyword in ["netflix", "spotify", "hulu", "gym", "subscription", "prime"]):
        return "Subscriptions"
    elif any(keyword in desc for keyword in ["flight", "hotel", "airbnb", "airline", "travel", "resort"]):
        return "Travel"
        
    return "Other"

def gemini_categoriser(description: str) -> str:
    """
    Categorises a transaction using the Gemini 1.5 Flash API with the new google.genai SDK.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found. Falling back to rules categoriser.")
        return rules_categoriser(description)
        
    # Instantiate the new Gemini client
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    Categorise the following bank transaction description into EXACTLY one of the following categories:
    {', '.join(ALLOWED_CATEGORIES)}
    
    Transaction Description: "{description}"
    
    Return ONLY the category name. No punctuation, no explanation.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        category = response.text.strip()
        
        # Exact match check to ensure validity
        if category in ALLOWED_CATEGORIES:
            return category
        else:
            return "Other"
    except Exception as e:
        print(f"Error calling Gemini API: {e}. Falling back to Other.")
        return "Other"

def get_category(description: str) -> str:
    """
    Pluggable categorisation module.
    Reads the CATEGORISER environment variable to determine which mode to use.
    Default is 'rules'.
    """
    mode = os.getenv("CATEGORISER", "rules").lower()
    
    if mode == "gemini":
        return gemini_categoriser(description)
    else:
        return rules_categoriser(description)
