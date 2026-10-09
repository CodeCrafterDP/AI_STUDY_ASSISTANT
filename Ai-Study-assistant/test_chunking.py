from backend.pdf_processor import extract_text_from_pdf
from backend.rag import create_document_chunks


pdf_path = "uploads/nasscom certificate.pdf"

pages = extract_text_from_pdf(pdf_path)

chunks = create_document_chunks(pages)

print("Total pages:", len(pages))
print("Total chunks:", len(chunks))

for i, chunk in enumerate(chunks, start=1):

    print(f"\n--- CHUNK {i} ---")
    print("Page:", chunk["page"])
    print("Text:", chunk["text"][:300])