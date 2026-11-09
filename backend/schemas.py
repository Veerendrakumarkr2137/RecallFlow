from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --------------------------------------------------
# AUTH SCHEMAS
# --------------------------------------------------

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Optional[str] = "customer"  # "customer" or "agent"
    company: Optional[str] = None
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: str
    company: Optional[str] = None
    phone: Optional[str] = None
    tier: str = "Standard"
    status: str = "active"
    created_at: Optional[datetime] = None


class CustomerUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    tier: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "customer"
    user: CustomerResponse


# --------------------------------------------------
# CONVERSATION & CHAT SCHEMAS
# --------------------------------------------------

class CreateConversationRequest(BaseModel):
    title: str = Field(default="New conversation", max_length=200)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: str


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    sentiment_label: Optional[str] = "Neutral"
    sentiment_score: Optional[float] = 0.0
    is_escalated: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    sentiment_score: Optional[float] = None
    memories_used: Optional[int] = 0
    knowledge_sources: Optional[str] = None
    created_at: Optional[datetime] = None


# --------------------------------------------------
# MEMORY SCHEMAS
# --------------------------------------------------

class MemoryItemCreate(BaseModel):
    category: str
    content: str
    confidence: Optional[float] = 0.95
    source: Optional[str] = "customer_statement"


class MemoryItemUpdate(BaseModel):
    category: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None
    is_outdated: Optional[bool] = None


class MemoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    category: str
    content: str
    confidence: float
    relevance_score: float
    source: str
    is_active: bool
    is_outdated: bool
    superseded_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MemoryInsightsResponse(BaseModel):
    memories: List[MemoryItemResponse]
    categories: dict
    total_memories: int
    memory_enabled: bool
    hindsight_connected: bool


# --------------------------------------------------
# TICKET SCHEMAS
# --------------------------------------------------

class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=5)
    category: str = "Technical"
    priority: str = "Medium"
    conversation_id: Optional[str] = None


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    internal_notes: Optional[str] = None
    resolution_summary: Optional[str] = None


class TicketCommentCreate(BaseModel):
    content: str = Field(min_length=1)
    is_internal: bool = False


class TicketCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    author_id: int
    author_name: str
    author_role: str
    is_internal: bool
    content: str
    created_at: Optional[datetime] = None


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    conversation_id: Optional[str] = None
    title: str
    description: str
    category: str
    priority: str
    status: str
    assigned_agent_id: Optional[int] = None
    assigned_agent_name: Optional[str] = None
    internal_notes: Optional[str] = None
    resolution_summary: Optional[str] = None
    escalation_reason: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    comments: Optional[List[TicketCommentResponse]] = []


# --------------------------------------------------
# KNOWLEDGE BASE SCHEMAS
# --------------------------------------------------

class KnowledgeDocResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    created_at: Optional[datetime] = None


class KnowledgeSearchResult(BaseModel):
    document_title: str
    chunk_index: int
    content: str
    similarity_score: float


# --------------------------------------------------
# ESCALATION & ANALYTICS SCHEMAS
# --------------------------------------------------

class EscalationRequest(BaseModel):
    conversation_id: str
    reason: Optional[str] = "Customer requested human support agent assistance"
    priority: Optional[str] = "High"


class EscalationResponse(BaseModel):
    ticket_id: int
    ticket_number: str
    status: str
    message: str


class AnalyticsOverviewResponse(BaseModel):
    total_customers: int
    total_conversations: int
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    escalated_tickets: int
    resolution_rate: float
    avg_response_time_ms: int
    customer_satisfaction_score: float
    sentiment_breakdown: dict
    top_issue_categories: List[dict]
    daily_activity: List[dict]
