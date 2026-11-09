from database import engine, Base, SessionLocal
from models import (
    Customer,
    Conversation,
    ConversationMessage,
    MemoryItem,
    Ticket,
    TicketComment,
    KnowledgeDocument,
    KnowledgeChunk,
    AnalyticsEvent
)
from auth import hash_password
from rag_engine import index_document_in_db

# Create all database tables
Base.metadata.create_all(bind=engine)
print("RecallFlow AI tables created successfully!")

db = SessionLocal()

# Seed demo agent
agent = db.query(Customer).filter(Customer.email == "agent@recallflow.ai").first()
if not agent:
    agent = Customer(
        full_name="Sarah Connor (Lead Support Specialist)",
        email="agent@recallflow.ai",
        hashed_password=hash_password("AgentPass123!"),
        role="agent",
        company="RecallFlow Support Ops",
        phone="+1 (555) 019-2834",
        tier="Enterprise"
    )
    db.add(agent)
    db.commit()
    print("Demo support agent account created: agent@recallflow.ai / AgentPass123!")

# Seed sample customer
demo_customer = db.query(Customer).filter(Customer.email == "alex.mercer@example.com").first()
if not demo_customer:
    demo_customer = Customer(
        full_name="Alex Mercer",
        email="alex.mercer@example.com",
        hashed_password=hash_password("CustomerPass123!"),
        role="customer",
        company="Nexus Dynamics",
        phone="+1 (555) 392-8172",
        tier="Pro"
    )
    db.add(demo_customer)
    db.commit()
    print("Demo customer account created: alex.mercer@example.com / CustomerPass123!")

    # Seed structured memories for demo customer
    mems = [
        MemoryItem(
            customer_id=demo_customer.id,
            category="Device Information",
            content="Customer uses a Dell Inspiron 15 (7506 2-in-1, Core i7, 16GB RAM) running Windows 11 Pro.",
            confidence=0.98,
            source="customer_statement"
        ),
        MemoryItem(
            customer_id=demo_customer.id,
            category="Reported Issues",
            content="Rapid battery drainage observed under light workload; battery wear level estimated at 42%.",
            confidence=0.95,
            source="customer_statement"
        ),
        MemoryItem(
            customer_id=demo_customer.id,
            category="Support Preferences",
            content="Customer explicitly updated support preference from email to phone support.",
            confidence=0.99,
            source="customer_statement"
        ),
        MemoryItem(
            customer_id=demo_customer.id,
            category="Troubleshooting History",
            content="Adjusted Windows battery slider to Balanced and ran ePSA hardware diagnostics.",
            confidence=0.92,
            source="customer_statement"
        )
    ]
    for m in mems:
        db.add(m)
    db.commit()
    print("Sample structured memories seeded for Alex Mercer.")

# Seed initial knowledge base document
doc_count = db.query(KnowledgeDocument).count()
if doc_count == 0:
    guide = """# Hardware Diagnostic & Battery Support Guide

## Standard Troubleshooting Procedures
1. Run hardware diagnostics by rebooting and pressing F12 to enter the One-Time Boot Menu.
2. Select 'Diagnostics' to verify battery cell health and AC adapter wattage.
3. If primary battery wear exceeds 50%, warranty replacement is covered under Pro and Enterprise support tiers.
4. For software optimization, inspect Windows background battery usage in Settings -> System -> Power & Battery.
"""
    index_document_in_db(
        db=db,
        title="Hardware Diagnostic & Battery Support Guide",
        filename="hardware_diagnostics_guide.md",
        file_type="markdown",
        file_bytes=guide.encode("utf-8")
    )
    print("Initial Knowledge Base document seeded.")

db.close()
print("RecallFlow AI database initialization complete!")
