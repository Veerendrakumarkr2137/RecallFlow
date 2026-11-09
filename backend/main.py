from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import logging
from typing import List, Optional
from uuid import uuid4

from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    UploadFile,
    File,
    Form,
    Body,
    status,
    Query
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc, func
from starlette.concurrency import run_in_threadpool

from database import engine, Base, get_db
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
from schemas import (
    RegisterRequest,
    LoginRequest,
    CustomerResponse,
    CustomerUpdateRequest,
    TokenResponse,
    CreateConversationRequest,
    ChatRequest,
    ConversationResponse,
    MessageResponse,
    MemoryItemCreate,
    MemoryItemUpdate,
    MemoryItemResponse,
    MemoryInsightsResponse,
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    TicketCommentCreate,
    TicketCommentResponse,
    KnowledgeDocResponse,
    KnowledgeSearchResult,
    EscalationRequest,
    EscalationResponse,
    AnalyticsOverviewResponse
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)
from memory import (
    initialize_memory_client,
    close_memory_client,
    process_and_retain_memory,
    retrieve_relevant_memories,
    update_memory_record,
    delete_memory_record,
    is_hindsight_configured
)
from ai_agent import generate_reply
from rag_engine import (
    index_document_in_db,
    search_knowledge_base
)
from analytics import (
    analyze_sentiment,
    record_analytics_event,
    get_analytics_overview
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("recallflow")

# Ensure database tables exist
Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# DEFAULT SEEDING HELPERS
# --------------------------------------------------

def seed_initial_knowledge_and_demo_users(db: Session):
    """Seed initial sample knowledge documentation and demo accounts if DB is empty."""
    try:
        # Check if default agent exists
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

        # Check if knowledge docs exist
        doc_count = db.query(KnowledgeDocument).count()
        if doc_count == 0:
            sample_doc_content = """# RecallFlow Hardware Support Manual & Troubleshooting Standard

## 1. Laptop Battery Calibration & Drainage Procedures
Rapid battery discharge on high-performance laptops (e.g. Dell Inspiron 15, Lenovo ThinkPad X1) is commonly caused by out-of-spec power management drivers, aggressive background synchronization, or battery cell degradation.

### Diagnostic Steps:
1. Restart system and tap F12 (or Fn+F12) to access Hardware Diagnostics. Run the Primary Battery Life Cycle test.
2. If battery health is reported below 50% of original milliamp-hour (mAh) capacity, hardware replacement is required.
3. In Windows 11/10: Navigate to Settings -> System -> Power & Battery -> Battery Usage to inspect application background draw.
4. Disable startup applications using Task Manager (Ctrl + Shift + Esc -> Startup apps).

## 2. Support Contact & Escalation Policies
Customers who prefer phone or asynchronous Slack communication may configure their contact profile directly.
Tier 1 AI resolution handles up to 80% of common queries. Any hardware replacements or warranty claims exceeding $100 require Level 2 Agent Escalation.
"""
            index_document_in_db(
                db=db,
                title="Hardware Support & Battery Diagnostics Standard",
                filename="hardware_support_guide.md",
                file_type="markdown",
                file_bytes=sample_doc_content.encode("utf-8")
            )
            logger.info("Default knowledge base guide successfully seeded.")
    except Exception as e:
        logger.warning(f"Error during default seeding: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_memory_client()
    # Run seeding
    db = next(get_db())
    seed_initial_knowledge_and_demo_users(db)
    db.close()
    try:
        yield
    finally:
        await close_memory_client()


app = FastAPI(
    title="RecallFlow AI",
    description="Enterprise AI Customer Support Platform with Persistent Memory Intelligence",
    version="2.0.0",
    lifespan=lifespan
)

# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production-ready permissive for dev & custom ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

security = HTTPBearer(auto_error=False)


# --------------------------------------------------
# AUTHENTICATION DEPENDENCIES
# --------------------------------------------------

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Customer:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided"
        )
    token = credentials.credentials
    payload = verify_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token"
        )

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identity payload"
        )

    user = db.query(Customer).filter(Customer.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists"
        )
    return user


def require_agent_or_admin(current_user: Customer = Depends(get_current_user)) -> Customer:
    if current_user.role not in ["agent", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent or administrator privileges required"
        )
    return current_user


# --------------------------------------------------
# SYSTEM & HEALTH ENDPOINTS
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "project": "RecallFlow AI",
        "tagline": "Remember Every Conversation. Resolve Every Problem.",
        "status": "operational",
        "version": "2.0.0",
        "hindsight_enabled": is_hindsight_configured()
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.query(Customer).count()
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "hindsight_configured": is_hindsight_configured(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# --------------------------------------------------
# AUTHENTICATION & PROFILE
# --------------------------------------------------

@app.post("/register", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    email = str(request.email).strip().lower()
    full_name = request.full_name.strip()

    if len(full_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 2 characters long"
        )

    existing = db.query(Customer).filter(Customer.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    assigned_role = "agent" if request.role == "agent" else "customer"

    customer = Customer(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(request.password),
        role=assigned_role,
        company=request.company,
        phone=request.phone,
        tier="Enterprise" if assigned_role == "agent" else "Standard"
    )
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
        record_analytics_event(db, "customer_registered", customer_id=customer.id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )
    return customer


@app.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = str(request.email).strip().lower()
    user = db.query(Customer).filter(Customer.email == email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    record_analytics_event(db, "user_login", customer_id=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": user
    }


@app.get("/me", response_model=CustomerResponse)
def get_profile(current_user: Customer = Depends(get_current_user)):
    return current_user


@app.put("/me", response_model=CustomerResponse)
def update_profile(
    request: CustomerUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    if request.full_name is not None and len(request.full_name.strip()) >= 2:
        current_user.full_name = request.full_name.strip()
    if request.company is not None:
        current_user.company = request.company.strip()
    if request.phone is not None:
        current_user.phone = request.phone.strip()
    if request.tier is not None:
        current_user.tier = request.tier

    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return current_user


# --------------------------------------------------
# CUSTOMER 360 MANAGEMENT (PHASE 4)
# --------------------------------------------------

@app.get("/customers")
def list_customers(
    search: Optional[str] = None,
    tier: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(require_agent_or_admin)
):
    query = db.query(Customer).filter(Customer.role == "customer")
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Customer.full_name.ilike(s)) | (Customer.email.ilike(s)) | (Customer.company.ilike(s)))
    if tier:
        query = query.filter(Customer.tier == tier)

    customers = query.order_by(desc(Customer.created_at)).limit(limit).all()

    results = []
    for c in customers:
        conv_count = db.query(Conversation).filter(Conversation.customer_id == c.id).count()
        ticket_count = db.query(Ticket).filter(Ticket.customer_id == c.id).count()
        memory_count = db.query(MemoryItem).filter(MemoryItem.customer_id == c.id, MemoryItem.is_active == True).count()
        last_conv = db.query(Conversation).filter(Conversation.customer_id == c.id).order_by(desc(Conversation.updated_at)).first()

        results.append({
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "company": c.company or "Independent",
            "phone": c.phone or "Not provided",
            "tier": c.tier,
            "status": c.status,
            "conversation_count": conv_count,
            "ticket_count": ticket_count,
            "memory_count": memory_count,
            "last_interaction": last_conv.updated_at.isoformat() if last_conv and last_conv.updated_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    return {"customers": results, "total": len(results)}


@app.get("/customers/{customer_id}")
def get_customer_360(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(require_agent_or_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    conversations = db.query(Conversation).filter(
        Conversation.customer_id == customer_id
    ).order_by(desc(Conversation.updated_at)).all()

    memories = db.query(MemoryItem).filter(
        MemoryItem.customer_id == customer_id
    ).order_by(desc(MemoryItem.created_at)).all()

    tickets = db.query(Ticket).filter(
        Ticket.customer_id == customer_id
    ).order_by(desc(Ticket.created_at)).all()

    # Build chronological timeline
    timeline = []
    for c in conversations:
        timeline.append({
            "type": "conversation",
            "title": f"Conversation: {c.title}",
            "sentiment": c.sentiment_label,
            "date": c.updated_at.isoformat() if c.updated_at else c.created_at.isoformat(),
            "id": c.id
        })
    for t in tickets:
        timeline.append({
            "type": "ticket",
            "title": f"Ticket #{t.ticket_number}: {t.title}",
            "status": t.status,
            "priority": t.priority,
            "date": t.created_at.isoformat() if t.created_at else None,
            "id": t.id
        })
    for m in memories:
        timeline.append({
            "type": "memory",
            "title": f"Memory ({m.category}): {m.content[:60]}...",
            "confidence": m.confidence,
            "date": m.created_at.isoformat() if m.created_at else None,
            "id": m.id
        })

    timeline.sort(key=lambda x: x.get("date") or "", reverse=True)

    return {
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "company": customer.company,
            "phone": customer.phone,
            "tier": customer.tier,
            "created_at": customer.created_at.isoformat() if customer.created_at else None
        },
        "conversations": [{"id": c.id, "title": c.title, "sentiment": c.sentiment_label, "updated_at": c.updated_at.isoformat()} for c in conversations],
        "memories": [
            {
                "id": m.id,
                "category": m.category,
                "content": m.content,
                "confidence": m.confidence,
                "is_active": m.is_active,
                "is_outdated": m.is_outdated,
                "source": m.source
            } for m in memories
        ],
        "tickets": [
            {
                "id": t.id,
                "ticket_number": t.ticket_number,
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "created_at": t.created_at.isoformat()
            } for t in tickets
        ],
        "timeline": timeline[:25]
    }


# --------------------------------------------------
# CONVERSATIONS & CHAT (PHASE 3, 6, 7, 8)
# --------------------------------------------------

@app.post("/conversations", status_code=status.HTTP_201_CREATED)
def create_conversation(
    request: CreateConversationRequest = CreateConversationRequest(),
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    conv_id = str(uuid4())
    conv = Conversation(
        id=conv_id,
        customer_id=current_user.id,
        title=request.title.strip() or "New conversation"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    record_analytics_event(db, "conversation_started", customer_id=current_user.id)
    return {
        "id": conv.id,
        "title": conv.title,
        "sentiment_label": conv.sentiment_label,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat()
    }


@app.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    conversations = db.query(Conversation).filter(
        Conversation.customer_id == current_user.id
    ).order_by(desc(Conversation.updated_at)).all()

    return {
        "conversations": [
            {
                "id": c.id,
                "title": c.title,
                "sentiment_label": c.sentiment_label,
                "sentiment_score": c.sentiment_score,
                "is_escalated": c.is_escalated,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None
            }
            for c in conversations
        ]
    }


@app.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Authorize: user must own conversation or be agent/admin
    if conv.customer_id != current_user.id and current_user.role not in ["agent", "admin"]:
        raise HTTPException(status_code=403, detail="Access forbidden")

    messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).order_by(ConversationMessage.created_at.asc(), ConversationMessage.id.asc()).all()

    return {
        "conversation_id": conversation_id,
        "title": conv.title,
        "sentiment_label": conv.sentiment_label,
        "is_escalated": conv.is_escalated,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "sentiment_score": m.sentiment_score,
                "memories_used": m.memories_used,
                "knowledge_sources": json.loads(m.knowledge_sources) if m.knowledge_sources else [],
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ]
    }


@app.post("/chat")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    message = request.message.strip()
    conversation_id = request.conversation_id

    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.customer_id != current_user.id and current_user.role not in ["agent", "admin"]:
        raise HTTPException(status_code=403, detail="Access forbidden")

    # 1. Analyze customer sentiment, frustration and urgency
    sentiment_data = analyze_sentiment(message)
    conv.sentiment_label = sentiment_data["label"]
    conv.sentiment_score = sentiment_data["score"]

    # 2. Retrieve relevant long-term customer memories (hybrid Hindsight + SQLite)
    retrieved_memories = await retrieve_relevant_memories(
        db=db,
        customer_id=current_user.id,
        query=message,
        limit=6
    )

    # 3. Retrieve relevant verified Company Knowledge Base chunks (RAG)
    knowledge_chunks = search_knowledge_base(db=db, query=message, top_k=2)

    # 4. Fetch recent conversation history
    recent_msgs = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).order_by(desc(ConversationMessage.id)).limit(8).all()
    recent_msgs.reverse()
    conv_history_texts = [f"{m.role}: {m.content}" for m in recent_msgs]

    # 5. Save user message to database
    user_record = ConversationMessage(
        customer_id=current_user.id,
        conversation_id=conversation_id,
        role="user",
        content=message,
        sentiment_score=sentiment_data["score"]
    )
    db.add(user_record)
    if conv.title == "New conversation":
        conv.title = message[:50] + ("..." if len(message) > 50 else "")
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    # 6. Generate AI response (Groq with fallback)
    reply = await run_in_threadpool(
        generate_reply,
        message,
        retrieved_memories,
        knowledge_chunks,
        conv_history_texts
    )

    # 7. Check if AI recommends escalation or customer showed frustration
    offer_escalation = sentiment_data["is_frustrated"] or sentiment_data["is_urgent"]

    # 8. Save assistant reply to database
    sources_metadata = [
        {"document_title": k["document_title"], "chunk_index": k["chunk_index"]}
        for k in knowledge_chunks
    ]
    assistant_record = ConversationMessage(
        customer_id=current_user.id,
        conversation_id=conversation_id,
        role="assistant",
        content=reply,
        memories_used=len(retrieved_memories),
        knowledge_sources=json.dumps(sources_metadata) if sources_metadata else None
    )
    db.add(assistant_record)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    # 9. Extract and retain structured memory asynchronously / in background
    try:
        await process_and_retain_memory(
            db=db,
            customer_id=current_user.id,
            message=message,
            source="customer_statement"
        )
    except Exception as e:
        logger.warning(f"Memory extraction error: {e}")

    # 10. Record telemetry
    record_analytics_event(
        db=db,
        event_type="chat_interaction",
        customer_id=current_user.id,
        sentiment=sentiment_data["label"],
        sentiment_score=sentiment_data["score"],
        response_time_ms=450
    )

    return {
        "conversation_id": conversation_id,
        "reply": reply,
        "sentiment": sentiment_data,
        "memories_used": len(retrieved_memories),
        "memories": retrieved_memories,
        "knowledge_sources": sources_metadata,
        "offer_escalation": offer_escalation
    }


# --------------------------------------------------
# MEMORY INTELLIGENCE & MANAGEMENT (PHASE 3)
# --------------------------------------------------

@app.get("/memory/insights")
def get_memory_insights(
    current_user: Customer = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memories = db.query(MemoryItem).filter(
        MemoryItem.customer_id == current_user.id
    ).order_by(desc(MemoryItem.created_at)).all()

    categories = {
        "Device Information": [],
        "Support Preferences": [],
        "Reported Issues": [],
        "Troubleshooting History": [],
        "Resolutions": [],
        "Other Information": []
    }

    for m in memories:
        cat = m.category if m.category in categories else "Other Information"
        categories[cat].append({
            "id": m.id,
            "content": m.content,
            "confidence": m.confidence,
            "is_active": m.is_active,
            "is_outdated": m.is_outdated,
            "source": m.source,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })

    return {
        "memories": [
            {
                "id": m.id,
                "customer_id": m.customer_id,
                "category": m.category,
                "content": m.content,
                "confidence": m.confidence,
                "relevance_score": m.relevance_score,
                "source": m.source,
                "is_active": m.is_active,
                "is_outdated": m.is_outdated,
                "created_at": m.created_at.isoformat() if m.created_at else None
            } for m in memories
        ],
        "categories": categories,
        "total_memories": len(memories),
        "memory_enabled": True,
        "hindsight_connected": is_hindsight_configured()
    }


@app.post("/memory/items", response_model=MemoryItemResponse)
def create_custom_memory(
    request: MemoryItemCreate,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    mem = MemoryItem(
        customer_id=current_user.id,
        category=request.category,
        content=request.content.strip(),
        confidence=request.confidence or 0.95,
        source=request.source or "customer_statement",
        is_active=True,
        is_outdated=False
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem


@app.put("/memory/items/{memory_id}", response_model=MemoryItemResponse)
def update_memory(
    memory_id: int,
    request: MemoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    mem = update_memory_record(
        db=db,
        customer_id=current_user.id,
        memory_id=memory_id,
        category=request.category,
        content=request.content,
        is_active=request.is_active,
        is_outdated=request.is_outdated
    )
    if not mem:
        raise HTTPException(status_code=404, detail="Memory record not found")
    return mem


@app.delete("/memory/items/{memory_id}")
def delete_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    success = delete_memory_record(db=db, customer_id=current_user.id, memory_id=memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory record not found")
    return {"message": "Memory record successfully deleted", "id": memory_id}


# --------------------------------------------------
# SUPPORT TICKET MANAGEMENT (PHASE 5)
# --------------------------------------------------

@app.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    request: TicketCreate,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    # Generate unique ticket number (e.g. RF-1001)
    last_ticket = db.query(Ticket).order_by(desc(Ticket.id)).first()
    next_num = 1001 if not last_ticket else last_ticket.id + 1001
    ticket_number = f"RF-{next_num}"

    ticket = Ticket(
        ticket_number=ticket_number,
        customer_id=current_user.id,
        conversation_id=request.conversation_id,
        title=request.title.strip(),
        description=request.description.strip(),
        category=request.category,
        priority=request.priority,
        status="Open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    record_analytics_event(db, "ticket_created", customer_id=current_user.id, details=ticket.ticket_number)
    return ticket


@app.get("/tickets")
def list_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    category_filter: Optional[str] = Query(None, alias="category"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    query = db.query(Ticket)

    # Customers see only their own tickets; agents see all
    if current_user.role == "customer":
        query = query.filter(Ticket.customer_id == current_user.id)

    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if priority_filter:
        query = query.filter(Ticket.priority == priority_filter)
    if category_filter:
        query = query.filter(Ticket.category == category_filter)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Ticket.title.ilike(s)) | (Ticket.ticket_number.ilike(s)) | (Ticket.description.ilike(s)))

    tickets = query.order_by(desc(Ticket.created_at)).all()

    results = []
    for t in tickets:
        cust = db.query(Customer).filter(Customer.id == t.customer_id).first()
        agent = db.query(Customer).filter(Customer.id == t.assigned_agent_id).first() if t.assigned_agent_id else None
        results.append({
            "id": t.id,
            "ticket_number": t.ticket_number,
            "customer_id": t.customer_id,
            "customer_name": cust.full_name if cust else "Unknown",
            "customer_email": cust.email if cust else "",
            "conversation_id": t.conversation_id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "assigned_agent_id": t.assigned_agent_id,
            "assigned_agent_name": agent.full_name if agent else "Unassigned",
            "internal_notes": t.internal_notes,
            "resolution_summary": t.resolution_summary,
            "escalation_reason": t.escalation_reason,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        })

    return {"tickets": results, "total": len(results)}


@app.get("/tickets/{ticket_id}")
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "customer" and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    cust = db.query(Customer).filter(Customer.id == ticket.customer_id).first()
    agent = db.query(Customer).filter(Customer.id == ticket.assigned_agent_id).first() if ticket.assigned_agent_id else None

    # Fetch comments (filter out internal notes for regular customers)
    comm_query = db.query(TicketComment).filter(TicketComment.ticket_id == ticket.id)
    if current_user.role == "customer":
        comm_query = comm_query.filter(TicketComment.is_internal == False)
    comments = comm_query.order_by(TicketComment.created_at.asc()).all()

    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "customer_id": ticket.customer_id,
        "customer_name": cust.full_name if cust else "Unknown",
        "customer_email": cust.email if cust else "",
        "conversation_id": ticket.conversation_id,
        "title": ticket.title,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "assigned_agent_id": ticket.assigned_agent_id,
        "assigned_agent_name": agent.full_name if agent else "Unassigned",
        "internal_notes": ticket.internal_notes if current_user.role in ["agent", "admin"] else None,
        "resolution_summary": ticket.resolution_summary,
        "escalation_reason": ticket.escalation_reason,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "comments": [
            {
                "id": c.id,
                "ticket_id": c.ticket_id,
                "author_id": c.author_id,
                "author_name": c.author_name,
                "author_role": c.author_role,
                "is_internal": c.is_internal,
                "content": c.content,
                "created_at": c.created_at.isoformat() if c.created_at else None
            } for c in comments
        ]
    }


@app.put("/tickets/{ticket_id}")
def update_ticket(
    ticket_id: int,
    request: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(require_agent_or_admin)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if request.title is not None:
        ticket.title = request.title
    if request.description is not None:
        ticket.description = request.description
    if request.category is not None:
        ticket.category = request.category
    if request.priority is not None:
        ticket.priority = request.priority
    if request.status is not None:
        ticket.status = request.status
        if request.status == "Resolved" and not ticket.resolved_at:
            ticket.resolved_at = datetime.now(timezone.utc)
            record_analytics_event(db, "ticket_resolved", customer_id=ticket.customer_id, details=ticket.ticket_number)
    if request.assigned_agent_id is not None:
        ticket.assigned_agent_id = request.assigned_agent_id
    if request.internal_notes is not None:
        ticket.internal_notes = request.internal_notes
    if request.resolution_summary is not None:
        ticket.resolution_summary = request.resolution_summary

    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


@app.post("/tickets/{ticket_id}/comments")
def add_ticket_comment(
    ticket_id: int,
    request: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "customer" and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access forbidden")

    is_internal = request.is_internal and current_user.role in ["agent", "admin"]

    comment = TicketComment(
        ticket_id=ticket.id,
        author_id=current_user.id,
        author_name=current_user.full_name,
        author_role=current_user.role,
        is_internal=is_internal,
        content=request.content.strip()
    )
    db.add(comment)
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(comment)
    return comment


# --------------------------------------------------
# KNOWLEDGE BASE & RAG (PHASE 6)
# --------------------------------------------------

@app.post("/knowledge/upload", response_model=KnowledgeDocResponse)
async def upload_knowledge_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Customer = Depends(require_agent_or_admin)
):
    # Validate file type
    filename = file.filename or "document.txt"
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"
    if ext not in ["txt", "md", "markdown", "pdf", "json"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported document format. Please upload .txt, .md, .pdf, or .json"
        )

    content_bytes = await file.read()
    if len(content_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowable limit (10MB)")

    doc = index_document_in_db(
        db=db,
        title=title.strip(),
        filename=filename,
        file_type=ext,
        file_bytes=content_bytes
    )
    return doc


@app.get("/knowledge/documents")
def list_knowledge_documents(
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    docs = db.query(KnowledgeDocument).order_by(desc(KnowledgeDocument.created_at)).all()
    return {
        "documents": [
            {
                "id": d.id,
                "title": d.title,
                "filename": d.filename,
                "file_type": d.file_type,
                "file_size": d.file_size,
                "chunk_count": d.chunk_count,
                "created_at": d.created_at.isoformat() if d.created_at else None
            } for d in docs
        ]
    }


@app.delete("/knowledge/documents/{document_id}")
def delete_knowledge_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(require_agent_or_admin)
):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Document and its indexed chunks successfully removed", "id": document_id}


@app.post("/knowledge/search")
def test_knowledge_search(
    query: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    results = search_knowledge_base(db=db, query=query, top_k=4)
    return {"query": query, "results": results}


# --------------------------------------------------
# HUMAN SUPPORT ESCALATION (PHASE 7)
# --------------------------------------------------

@app.post("/escalate", response_model=EscalationResponse)
def escalate_conversation(
    request: EscalationRequest,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(
        Conversation.id == request.conversation_id,
        Conversation.customer_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.is_escalated = True
    conv.updated_at = datetime.now(timezone.utc)

    # Gather customer memories to attach to internal notes
    memories = db.query(MemoryItem).filter(
        MemoryItem.customer_id == current_user.id,
        MemoryItem.is_active == True
    ).limit(6).all()
    mem_summary = "\n".join([f"- [{m.category}] {m.content}" for m in memories]) if memories else "No memories recorded."

    # Generate next ticket number
    last_ticket = db.query(Ticket).order_by(desc(Ticket.id)).first()
    next_num = 1001 if not last_ticket else last_ticket.id + 1001
    ticket_number = f"RF-{next_num}"

    ticket = Ticket(
        ticket_number=ticket_number,
        customer_id=current_user.id,
        conversation_id=conv.id,
        title=f"Escalated Session: {conv.title}",
        description=f"Customer requested human escalation during conversation {conv.id}.\n\nReason: {request.reason}",
        category="Technical",
        priority=request.priority or "High",
        status="Escalated",
        escalation_reason=request.reason,
        internal_notes=f"=== TRANSFERRED CUSTOMER MEMORY SNAPSHOT ===\n{mem_summary}\n\nSentiment at handoff: {conv.sentiment_label}"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    record_analytics_event(db, "conversation_escalated", customer_id=current_user.id, details=ticket.ticket_number)

    return {
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "status": "Escalated",
        "message": "Your conversation and remembered profile details have been successfully escalated to our specialized human support team. A specialist has been notified."
    }


# --------------------------------------------------
# ANALYTICS DASHBOARD (PHASE 8)
# --------------------------------------------------

@app.get("/analytics/overview", response_model=AnalyticsOverviewResponse)
def get_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: Customer = Depends(require_agent_or_admin)
):
    overview = get_analytics_overview(db=db, days=days)
    return overview
