from backend.pdf_processor import extract_text_from_pdf


pdf_path = "uploads/nasscom certificate.pdf"

pages = extract_text_from_pdf(pdf_path)

print("Number of pages:", len(pages))

for page in pages:
    print("\n--- PAGE", page["page"], "---")
    print(page["text"][:500])