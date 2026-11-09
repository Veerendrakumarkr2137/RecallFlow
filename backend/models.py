from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    ForeignKey,
    Boolean,
    Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)  # "customer", "agent", "admin"
    company = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    tier = Column(String(50), default="Standard", nullable=False)  # "Standard", "Pro", "Enterprise"
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    conversations = relationship("Conversation", back_populates="customer", cascade="all, delete-orphan")
    messages = relationship("ConversationMessage", back_populates="customer", cascade="all, delete-orphan")
    memories = relationship("MemoryItem", back_populates="customer", cascade="all, delete-orphan")
    tickets = relationship("Ticket", foreign_keys="Ticket.customer_id", back_populates="customer", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False, default="New conversation")
    sentiment_label = Column(String(50), default="Neutral", nullable=False)
    sentiment_score = Column(Float, default=0.0, nullable=False)
    is_escalated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    customer = relationship("Customer", back_populates="conversations")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="conversation")


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant", "agent", "system"
    content = Column(Text, nullable=False)
    sentiment_score = Column(Float, nullable=True)
    memories_used = Column(Integer, default=0)
    knowledge_sources = Column(Text, nullable=True)  # JSON-encoded cited knowledge chunks
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="messages")
    conversation = relationship("Conversation", back_populates="messages")


class MemoryItem(Base):
    __tablename__ = "memory_items"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # "Device Information", "Support Preferences", etc.
    content = Column(Text, nullable=False)
    confidence = Column(Float, default=0.95, nullable=False)
    relevance_score = Column(Float, default=1.0, nullable=False)
    source = Column(String(50), default="customer_statement", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_outdated = Column(Boolean, default=False, nullable=False)
    superseded_by = Column(Integer, nullable=True)
    hindsight_memory_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="memories")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, index=True, nullable=False)  # e.g., RF-1001
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="Technical", nullable=False)  # "Technical", "Billing", "Hardware", etc.
    priority = Column(String(20), default="Medium", nullable=False)  # "Low", "Medium", "High", "Critical"
    status = Column(String(20), default="Open", nullable=False)  # "Open", "Pending", "In Progress", "Resolved", "Escalated"
    assigned_agent_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    internal_notes = Column(Text, nullable=True)
    resolution_summary = Column(Text, nullable=True)
    escalation_reason = Column(String(255), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", foreign_keys=[customer_id], back_populates="tickets")
    assigned_agent = relationship("Customer", foreign_keys=[assigned_agent_id])
    conversation = relationship("Conversation", back_populates="tickets")
    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    author_name = Column(String(100), nullable=False)
    author_role = Column(String(20), default="agent", nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("Customer")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), default="txt", nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    content = Column(Text, nullable=False)
    chunk_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)
    keywords = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("KnowledgeDocument", back_populates="chunks")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False)  # "conversation_started", "message_sent", "ticket_created", etc.
    sentiment = Column(String(20), nullable=True)
    sentiment_score = Column(Float, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
