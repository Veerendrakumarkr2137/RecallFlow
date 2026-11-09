import os
import re
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import desc

from models import MemoryItem

load_dotenv()
logger = logging.getLogger(__name__)

# Hindsight Client instance
hindsight_client = None


def is_hindsight_configured() -> bool:
    base_url = os.getenv("HINDSIGHT_BASE_URL")
    api_key = os.getenv("HINDSIGHT_API_KEY")
    return bool(base_url and api_key and not base_url.startswith("your_"))


def initialize_memory_client():
    global hindsight_client
    if hindsight_client is None and is_hindsight_configured():
        try:
            from hindsight_client import Hindsight
            base_url = os.getenv("HINDSIGHT_BASE_URL")
            api_key = os.getenv("HINDSIGHT_API_KEY")
            hindsight_client = Hindsight(
                base_url=base_url,
                api_key=api_key,
                timeout=30.0
            )
            logger.info("Hindsight persistent memory client connected successfully.")
        except Exception as e:
            logger.warning(f"Could not connect to Hindsight service: {e}. Falling back to local hybrid memory engine.")
            hindsight_client = None
    return hindsight_client


async def close_memory_client():
    global hindsight_client
    if hindsight_client is not None:
        try:
            await hindsight_client.aclose()
        except Exception as e:
            logger.warning(f"Error closing Hindsight client: {e}")
        finally:
            hindsight_client = None


def get_customer_bank_id(customer_id: int) -> str:
    customer_hash = hashlib.sha256(str(customer_id).encode("utf-8")).hexdigest()[:24]
    return f"recallflow-{customer_hash}"


async def ensure_customer_bank(customer_id: int) -> Optional[str]:
    client = initialize_memory_client()
    if client is None:
        return None
    bank_id = get_customer_bank_id(customer_id)
    try:
        await client.acreate_bank(
            bank_id=bank_id,
            name="RecallFlow Customer Memory"
        )
    except Exception as e:
        logger.debug(f"Bank {bank_id} might already exist or create error: {e}")
    return bank_id


# --------------------------------------------------
# DUPLICATE DETECTION & SIMILARITY HELPERS
# --------------------------------------------------

def clean_text_for_comparison(text: str) -> str:
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def calculate_token_similarity(text_a: str, text_b: str) -> Tuple[float, float]:
    norm_a = clean_text_for_comparison(text_a)
    norm_b = clean_text_for_comparison(text_b)
    if not norm_a or not norm_b:
        return 0.0, 0.0
    if norm_a == norm_b:
        return 1.0, 1.0

    words_a = set(w for w in norm_a.split() if len(w) > 2)
    words_b = set(w for w in norm_b.split() if len(w) > 2)
    if not words_a or not words_b:
        return 0.0, 0.0

    overlap = len(words_a.intersection(words_b))
    containment = overlap / min(len(words_a), len(words_b))
    jaccard = overlap / len(words_a.union(words_b))
    return containment, jaccard


def is_near_duplicate(first: str, second: str, threshold: float = 0.75) -> bool:
    containment, jaccard = calculate_token_similarity(first, second)
    return containment >= 0.88 or jaccard >= threshold


# --------------------------------------------------
# STRUCTURED MEMORY EXTRACTION & CLASSIFICATION
# --------------------------------------------------

DEVICE_PATTERNS = [
    r"\b(laptop|macbook|dell|lenovo|hp|thinkpad|asus|acer|surface|iphone|android|samsung|pixel|desktop|monitor|pc|ipad|tablet)\b",
    r"\b(model|serial number|os|windows 11|windows 10|macos|ubuntu|linux|ios|ram|ssd|cpu|gpu)\b"
]

PREFERENCE_PATTERNS = [
    r"\b(prefer|preference|contact me via|reach me at|email support|phone support|slack|sms|text message|morning|afternoon|evening|timezone|opt-in|opt-out)\b"
]

ISSUE_PATTERNS = [
    r"\b(battery|drain|crash|error|bug|blue screen|bsod|frozen|freezes|overheat|fan|glitch|broken|failure|won't start|fails|slow|black screen|wifi|disconnect)\b"
]

TROUBLESHOOTING_PATTERNS = [
    r"\b(tried|attempted|restarted|rebooted|updated driver|safe mode|uninstalled|cleared cache|ran diagnostics|reset|disabled|checked settings)\b"
]

RESOLUTION_PATTERNS = [
    r"\b(fixed|resolved|working now|solution worked|replaced battery|reinstalled|passed test|warranty approved|refund issued)\b"
]


def extract_structured_categories(message: str) -> List[Tuple[str, str, float]]:
    """
    Extracts structured memory records from customer statements.
    Returns list of (category, extracted_fact, confidence).
    """
    results = []
    text_lower = message.lower()

    # Preference update detection (e.g. "I previously preferred email, but now I prefer phone")
    update_match = re.search(
        r"(?:previously preferred|used to prefer|change my preference from)\s+(email|phone|chat|sms).*?(?:to|now prefer)\s+(email|phone|chat|sms)",
        text_lower
    )
    if update_match:
        old_pref, new_pref = update_match.group(1), update_match.group(2)
        fact = f"Customer explicitly updated support preference from {old_pref} to {new_pref}."
        results.append(("Support Preferences", fact, 0.99))

    # General preference detection
    elif any(re.search(pat, text_lower) for pat in PREFERENCE_PATTERNS):
        results.append(("Support Preferences", message.strip(), 0.92))

    # Device specs / hardware detection
    if any(re.search(pat, text_lower) for pat in DEVICE_PATTERNS):
        results.append(("Device Information", message.strip(), 0.90))

    # Troubleshooting history
    if any(re.search(pat, text_lower) for pat in TROUBLESHOOTING_PATTERNS):
        results.append(("Troubleshooting History", message.strip(), 0.88))

    # Reported issue
    if any(re.search(pat, text_lower) for pat in ISSUE_PATTERNS):
        results.append(("Reported Issues", message.strip(), 0.88))

    # Resolutions
    if any(re.search(pat, text_lower) for pat in RESOLUTION_PATTERNS):
        results.append(("Resolutions", message.strip(), 0.91))

    # Fallback to general statement if substantial
    if not results and len(message.split()) >= 4:
        results.append(("Other Information", message.strip(), 0.80))

    return results


# --------------------------------------------------
# MEMORY RETENTION & CONFLICT RESOLUTION
# --------------------------------------------------

async def process_and_retain_memory(
    db: Session,
    customer_id: int,
    message: str,
    source: str = "customer_statement"
) -> List[MemoryItem]:
    """
    Processes message, extracts structured memories, detects conflicts/outdated records,
    retains to local DB and attempts sync with Hindsight bank.
    """
    extracted_items = extract_structured_categories(message)
    saved_records = []

    client = initialize_memory_client()
    bank_id = None
    if client:
        try:
            bank_id = await ensure_customer_bank(customer_id)
        except Exception as e:
            logger.warning(f"Hindsight bank check error: {e}")

    for category, content, confidence in extracted_items:
        # 1. Duplicate check against existing active memories for this customer
        existing_memories = db.query(MemoryItem).filter(
            MemoryItem.customer_id == customer_id,
            MemoryItem.is_active == True,
            MemoryItem.category == category
        ).all()

        is_dup = False
        for ex in existing_memories:
            if is_near_duplicate(ex.content, content):
                # Update timestamp and confidence if newer statement confirms it
                ex.confidence = max(ex.confidence, confidence)
                ex.updated_at = datetime.now(timezone.utc)
                db.commit()
                is_dup = True
                saved_records.append(ex)
                break

        if is_dup:
            continue

        # 2. Outdated / conflict detection
        # E.g., if category is "Support Preferences" and customer mentions a new preference
        if category == "Support Preferences":
            # Check if previous preference contradicts
            if "phone" in content.lower() and not "email" in content.lower():
                for ex in existing_memories:
                    if "email" in ex.content.lower():
                        ex.is_outdated = True
                        ex.is_active = False
            elif "email" in content.lower() and not "phone" in content.lower():
                for ex in existing_memories:
                    if "phone" in ex.content.lower():
                        ex.is_outdated = True
                        ex.is_active = False

        # 3. Create new MemoryItem
        hindsight_id = None
        if client and bank_id:
            try:
                h_res = await client.aretain(
                    bank_id=bank_id,
                    content=f"[{category}] {content}"
                )
                hindsight_id = str(getattr(h_res, "id", ""))
            except Exception as e:
                logger.warning(f"Hindsight retain error: {e}")

        new_mem = MemoryItem(
            customer_id=customer_id,
            category=category,
            content=content,
            confidence=confidence,
            relevance_score=1.0,
            source=source,
            is_active=True,
            is_outdated=False,
            hindsight_memory_id=hindsight_id
        )
        db.add(new_mem)
        db.commit()
        db.refresh(new_mem)
        saved_records.append(new_mem)

    return saved_records


# --------------------------------------------------
# CONTEXT-AWARE MEMORY RETRIEVAL & RELEVANCE SCORING
# --------------------------------------------------

async def retrieve_relevant_memories(
    db: Session,
    customer_id: int,
    query: str,
    limit: int = 8
) -> List[Dict[str, Any]]:
    """
    Hybrid context-aware retrieval:
    1. Recalls from Hindsight bank if connected.
    2. Retrieves active, non-outdated structured records from SQLite.
    3. Calculates relevance scores based on token overlap with customer query.
    4. Deduplicates and orders by relevance score descending.
    """
    scored_memories = []
    seen_texts = set()

    # 1. Hindsight recall if available
    client = initialize_memory_client()
    if client:
        try:
            bank_id = await ensure_customer_bank(customer_id)
            if bank_id:
                h_result = await client.arecall(
                    bank_id=bank_id,
                    query=query,
                    budget="high",
                    max_tokens=2048
                )
                for item in getattr(h_result, "results", []):
                    raw_text = getattr(item, "text", "").strip()
                    if raw_text and clean_text_for_comparison(raw_text) not in seen_texts:
                        seen_texts.add(clean_text_for_comparison(raw_text))
                        scored_memories.append({
                            "id": None,
                            "category": "Hindsight Memory",
                            "content": raw_text,
                            "confidence": 0.95,
                            "relevance_score": 1.2,
                            "source": "hindsight_bank"
                        })
        except Exception as e:
            logger.warning(f"Hindsight recall error: {e}")

    # 2. Local DB Structured Memory retrieval
    db_memories = db.query(MemoryItem).filter(
        MemoryItem.customer_id == customer_id,
        MemoryItem.is_active == True,
        MemoryItem.is_outdated == False
    ).order_by(desc(MemoryItem.created_at)).all()

    query_tokens = set(clean_text_for_comparison(query).split())

    for mem in db_memories:
        norm = clean_text_for_comparison(mem.content)
        if norm in seen_texts:
            continue
        seen_texts.add(norm)

        # Calculate keyword relevance boost
        mem_tokens = set(norm.split())
        overlap = len(query_tokens.intersection(mem_tokens)) if query_tokens else 0
        base_relevance = 1.0 + (overlap * 0.35)

        # Category relevance boosts
        q_low = query.lower()
        if mem.category == "Device Information" and any(k in q_low for k in ["laptop", "pc", "device", "model", "computer"]):
            base_relevance += 0.5
        elif mem.category == "Support Preferences" and any(k in q_low for k in ["prefer", "contact", "phone", "email", "call"]):
            base_relevance += 0.6
        elif mem.category == "Reported Issues" and any(k in q_low for k in ["issue", "problem", "battery", "drain", "broken"]):
            base_relevance += 0.5

        scored_memories.append({
            "id": mem.id,
            "category": mem.category,
            "content": mem.content,
            "confidence": mem.confidence,
            "relevance_score": round(base_relevance, 2),
            "source": mem.source,
            "created_at": mem.created_at.isoformat() if mem.created_at else None
        })

    # Sort descending by relevance_score
    scored_memories.sort(key=lambda m: m["relevance_score"], reverse=True)
    return scored_memories[:limit]


# --------------------------------------------------
# MEMORY CORRECTION & DELETION ENDPOINTS HELPERS
# --------------------------------------------------

def update_memory_record(
    db: Session,
    customer_id: int,
    memory_id: int,
    category: Optional[str] = None,
    content: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_outdated: Optional[bool] = None
) -> Optional[MemoryItem]:
    memory = db.query(MemoryItem).filter(
        MemoryItem.id == memory_id,
        MemoryItem.customer_id == customer_id
    ).first()

    if not memory:
        return None

    if category is not None:
        memory.category = category
    if content is not None:
        memory.content = content
    if is_active is not None:
        memory.is_active = is_active
    if is_outdated is not None:
        memory.is_outdated = is_outdated

    memory.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(memory)
    return memory


def delete_memory_record(db: Session, customer_id: int, memory_id: int) -> bool:
    memory = db.query(MemoryItem).filter(
        MemoryItem.id == memory_id,
        MemoryItem.customer_id == customer_id
    ).first()

    if not memory:
        return False

    db.delete(memory)
    db.commit()
    return True
