import numpy as np
from sentence_transformers import SentenceTransformer


# Load the embedding model
embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def chunk_text(text, chunk_size=800, overlap=150):

    words = text.split()

    chunks = []

    start = 0

    while start < len(words):

        end = start + chunk_size

        chunk = " ".join(words[start:end])

        if chunk.strip():
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


def create_document_chunks(pages):

    chunks = []

    for page in pages:

        page_chunks = chunk_text(page["text"])

        for chunk in page_chunks:

            chunks.append({
                "text": chunk,
                "page": page["page"]
            })

    return chunks


def embed_text(text):

    vector = embedding_model.encode(
        text,
        normalize_embeddings=True
    )

    return vector

# Store document chunks and their embeddings
documents = []


def build_embeddings(chunks):

    for chunk in chunks:

        chunk["embedding"] = embed_text(
            chunk["text"]
        )

    return chunks


def search_documents(query, top_k=3):

    if not documents:
        return []

    query_embedding = embed_text(query)

    scored_documents = []

    for document in documents:

        document_embedding = document["embedding"]

        score = float(
            np.dot(
                query_embedding,
                document_embedding
            )
        )

        scored_documents.append(
            (score, document)
        )

    scored_documents.sort(
        key=lambda x: x[0],
        reverse=True
    )

    return [
        document
        for score, document in scored_documents[:top_k]
    ]