from app.rag.service import rag_service


if __name__ == "__main__":
    result = rag_service.index_documents()
    print(f"Indexed documents: {result['document_count']}")
    print(f"Indexed chunks: {result['chunk_count']}")
