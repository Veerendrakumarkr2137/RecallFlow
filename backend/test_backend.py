import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from models import Customer, MemoryItem, Ticket, Conversation
from memory import (
    calculate_token_similarity,
    is_near_duplicate,
    extract_structured_categories
)
from analytics import analyze_sentiment
from rag_engine import chunk_text, tokenize_for_search

# In-memory SQLite with StaticPool so all connections share the same memory instance
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_home_and_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["project"] == "RecallFlow AI"
    assert data["tagline"] == "Remember Every Conversation. Resolve Every Problem."

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] in ["healthy", "degraded"]


def test_auth_workflow_and_isolation():
    # 1. Register customer
    cust_data = {
        "full_name": "Test Customer",
        "email": "customer_test@example.com",
        "password": "Password123!",
        "role": "customer",
        "company": "Acme Corp"
    }
    reg_res = client.post("/register", json=cust_data)
    assert reg_res.status_code == 201
    cust_id = reg_res.json()["id"]

    # 2. Login customer
    login_res = client.post("/login", json={"email": "customer_test@example.com", "password": "Password123!"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get profile
    me_res = client.get("/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "customer_test@example.com"
    assert me_res.json()["role"] == "customer"


def test_memory_intelligence_unit():
    # Test duplicate detection
    text1 = "I own a Dell Inspiron 15 laptop with 16GB RAM."
    text2 = "I own a Dell Inspiron 15 laptop with 16GB RAM."
    assert is_near_duplicate(text1, text2) is True

    # Test category extraction
    pref_stmt = "I previously preferred email support, but now I prefer phone support."
    extracted = extract_structured_categories(pref_stmt)
    assert len(extracted) > 0
    cat, fact, conf = extracted[0]
    assert cat == "Support Preferences"
    assert "phone" in fact.lower()


def test_sentiment_and_frustration_analysis():
    # Neutral statement
    neutral_res = analyze_sentiment("Can you tell me how to check my warranty status?")
    assert neutral_res["label"] in ["Neutral", "Positive"]
    assert neutral_res["is_frustrated"] is False

    # Highly frustrated statement
    frustrated_res = analyze_sentiment("I am so frustrated! This laptop is broken again and your advice is completely useless!")
    assert frustrated_res["is_frustrated"] is True
    assert frustrated_res["label"] == "Frustrated"
    assert frustrated_res["score"] < 0

    # Urgent statement
    urgent_res = analyze_sentiment("URGENT: Critical production outage, please respond ASAP!")
    assert urgent_res["is_urgent"] is True


def test_rag_chunking():
    sample_text = "Paragraph 1 about system installation.\n\nParagraph 2 about hardware requirements."
    chunks = chunk_text(sample_text, chunk_size=100)
    assert len(chunks) >= 1
    tokens = tokenize_for_search(sample_text)
    assert "installation" in tokens
    assert "hardware" in tokens


def test_support_ticket_creation():
    # Login as customer
    login_res = client.post("/login", json={"email": "customer_test@example.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    ticket_payload = {
        "title": "Hardware battery failure",
        "description": "The laptop battery drains within 25 minutes of unplugging.",
        "category": "Hardware",
        "priority": "High"
    }
    t_res = client.post("/tickets", json=ticket_payload, headers=headers)
    assert t_res.status_code == 201
    ticket_data = t_res.json()
    assert ticket_data["ticket_number"].startswith("RF-")
    assert ticket_data["status"] == "Open"

    # List tickets
    list_res = client.get("/tickets", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["tickets"]) >= 1
