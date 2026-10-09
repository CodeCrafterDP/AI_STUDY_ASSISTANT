from backend.pdf_processor import extract_text_from_pdf
from backend.rag import (
    create_document_chunks,
    build_embeddings,
    documents,
    search_documents
)


pdf_path = "uploads/nasscom certificate.pdf"


# Extract PDF text
pages = extract_text_from_pdf(pdf_path)

print("Pages:", len(pages))


# Create chunks
chunks = create_document_chunks(pages)

print("Chunks:", len(chunks))


# Create embeddings
chunks = build_embeddings(chunks)


# Store chunks
documents.clear()
documents.extend(chunks)


print("Embeddings created:", len(documents))


# Search
query = "What is this document about?"

results = search_documents(
    query,
    top_k=3
)


print("\nSEARCH RESULTS")

for i, result in enumerate(results, start=1):

    print(f"\n--- RESULT {i} ---")
    print("Page:", result["page"])
    print("Text:", result["text"][:500])