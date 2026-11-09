import io
import re
import math
import logging
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from models import KnowledgeDocument, KnowledgeChunk

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file bytes using pypdf if installed."""
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages_text.append(text.strip())
        return "\n\n".join(pages_text)
    except Exception as e:
        logger.warning(f"pypdf extraction error or not installed: {e}")
        # Fallback basic ASCII extraction
        text = file_bytes.decode("latin-1", errors="ignore")
        clean_text = re.sub(r"[^\x20-\x7E\n\t]", "", text)
        return clean_text[:50000]


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """Splits text into overlapping chunks, preferring paragraph/sentence boundaries."""
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        clean_para = para.strip()
        if not clean_para:
            continue

        if len(current_chunk) + len(clean_para) + 2 <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{clean_para}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            # If the single paragraph exceeds chunk_size, split by sentences
            if len(clean_para) > chunk_size:
                sentences = re.split(r"(?<=[.!?])\s+", clean_para)
                sub_chunk = ""
                for sent in sentences:
                    if len(sub_chunk) + len(sent) + 1 <= chunk_size:
                        sub_chunk = f"{sub_chunk} {sent}".strip()
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk)
                        sub_chunk = sent
                if sub_chunk:
                    chunks.append(sub_chunk)
                current_chunk = ""
            else:
                current_chunk = clean_para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks if chunks else [text[:chunk_size]]


def tokenize_for_search(text: str) -> List[str]:
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    return [w for w in cleaned.split() if len(w) > 2]


def index_document_in_db(
    db: Session,
    title: str,
    filename: str,
    file_type: str,
    file_bytes: bytes
) -> KnowledgeDocument:
    """Ingests, chunks, and indexes a knowledge document in the database."""
    if file_type.lower() == "pdf":
        raw_text = extract_text_from_pdf(file_bytes)
    else:
        raw_text = file_bytes.decode("utf-8", errors="replace")

    chunks = chunk_text(raw_text)

    doc = KnowledgeDocument(
        title=title,
        filename=filename,
        file_type=file_type.lower(),
        file_size=len(file_bytes),
        content=raw_text,
        chunk_count=len(chunks)
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    for i, chunk_str in enumerate(chunks):
        tokens = tokenize_for_search(chunk_str)
        chunk = KnowledgeChunk(
            document_id=doc.id,
            chunk_index=i + 1,
            content=chunk_str,
            token_count=len(tokens),
            keywords=" ".join(tokens[:100])
        )
        db.add(chunk)

    db.commit()
    db.refresh(doc)
    return doc


def search_knowledge_base(
    db: Session,
    query: str,
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    Retrieves the most semantically relevant knowledge chunks using token BM25-style scoring.
    """
    query_tokens = tokenize_for_search(query)
    if not query_tokens:
        return []

    chunks = db.query(KnowledgeChunk, KnowledgeDocument.title).join(
        KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id
    ).all()

    if not chunks:
        return []

    scored_results = []
    for chunk, doc_title in chunks:
        chunk_tokens = tokenize_for_search(chunk.content)
        if not chunk_tokens:
            continue

        score = 0.0
        chunk_token_set = set(chunk_tokens)
        for token in query_tokens:
            if token in chunk_token_set:
                # Term frequency boost
                tf = chunk_tokens.count(token)
                score += (1.0 + math.log(tf)) * 1.5

        if score > 0:
            scored_results.append({
                "document_id": chunk.document_id,
                "document_title": doc_title,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "similarity_score": round(score, 2)
            })

    scored_results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored_results[:top_k]
