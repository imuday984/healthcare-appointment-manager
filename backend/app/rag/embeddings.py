import hashlib
import math
from typing import Iterable

from app.core.config import get_settings


class DemoEmbeddingModel:
    def __init__(self, dims: int = 256):
        self.dims = dims

    def _embed(self, text: str) -> list[float]:
        values = [0.0] * self.dims
        for token in text.lower().split():
            digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
            idx = int(digest[:8], 16) % self.dims
            values[idx] += 1.0
        norm = math.sqrt(sum(v * v for v in values)) or 1.0
        return [v / norm for v in values]

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)


def get_embedding_model():
    settings = get_settings()
    if settings.openai_api_key:
        from langchain_openai import OpenAIEmbeddings

        return OpenAIEmbeddings(model=settings.embedding_model, api_key=settings.openai_api_key)
    return DemoEmbeddingModel()
