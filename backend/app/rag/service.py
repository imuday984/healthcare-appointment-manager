from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from langchain.text_splitter import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, PointStruct, VectorParams

from app.core.config import get_settings
from app.rag.embeddings import get_embedding_model


@dataclass
class RAGResult:
    answer: str
    sources: list[str]
    context: list[str]


class RAGService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.embedding_model = get_embedding_model()
        self.collection = self.settings.qdrant_collection
        self.top_k = 4
        self.chunk_size = 300
        self.chunk_overlap = 20
        self.knowledge_dir = Path(__file__).resolve().parents[2] / "data" / "knowledge"
        if self.settings.qdrant_url:
            self.qdrant = QdrantClient(url=self.settings.qdrant_url, api_key=self.settings.qdrant_api_key)
        else:
            local_path = Path(__file__).resolve().parents[2] / "data" / "qdrant_local"
            local_path.mkdir(parents=True, exist_ok=True)
            self.qdrant = QdrantClient(path=str(local_path))
        self._ensure_collection()

    def _vector_size(self) -> int:
        probe = self.embedding_model.embed_query("probe vector")
        return len(probe)

    def _ensure_collection(self) -> None:
        exists = self.qdrant.collection_exists(self.collection)
        if not exists:
            self.qdrant.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(size=self._vector_size(), distance=Distance.COSINE),
            )

    def index_documents(self) -> dict:
        splitter = RecursiveCharacterTextSplitter(chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        chunks: list[tuple[str, str]] = []
        for file in sorted(self.knowledge_dir.glob("*.md")):
            text = file.read_text(encoding="utf-8")
            for chunk in splitter.split_text(text):
                chunks.append((file.name, chunk))

        if not chunks:
            return {"document_count": 0, "chunk_count": 0}

        vectors = self.embedding_model.embed_documents([chunk for _, chunk in chunks])
        points = [
            PointStruct(id=idx + 1, vector=vector, payload={"source": source, "text": text})
            for idx, ((source, text), vector) in enumerate(zip(chunks, vectors, strict=False))
        ]
        self.qdrant.recreate_collection(
            collection_name=self.collection,
            vectors_config=VectorParams(size=len(vectors[0]), distance=Distance.COSINE),
        )
        self.qdrant.upsert(collection_name=self.collection, points=points)
        return {"document_count": len({s for s, _ in chunks}), "chunk_count": len(chunks)}

    def search(self, query: str, top_k: int | None = None) -> RAGResult:
        k = top_k or self.top_k
        query_vec = self.embedding_model.embed_query(query)
        hits = self.qdrant.search(collection_name=self.collection, query_vector=query_vec, limit=k)
        filtered_hits = [hit for hit in hits if hit.payload and float(hit.score or 0.0) >= 0.2]
        context = [hit.payload.get("text", "") for hit in filtered_hits]
        sources = list({hit.payload.get("source", "unknown") for hit in filtered_hits})

        if not context:
            answer = "I could not find this information in the current knowledge base."
        else:
            answer = "\n".join(context[:2])
        return RAGResult(answer=answer, sources=sources, context=context)

    def status(self) -> dict:
        try:
            collection_info = self.qdrant.get_collection(self.collection)
            chunk_count = int(collection_info.points_count or 0)
            available = True
        except Exception:
            chunk_count = 0
            available = False
        return {
            "qdrant_available": available,
            "collection": self.collection,
            "document_count": len(list(self.knowledge_dir.glob("*.md"))),
            "chunk_count": chunk_count,
            "embedding_model": self.settings.embedding_model if self.settings.openai_api_key else "demo-deterministic-embeddings",
            "similarity_metric": "cosine",
            "top_k": self.top_k,
        }


rag_service = RAGService()
