
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from backend.rag import (
    create_document_chunks,
    build_embeddings,
    documents,
    search_documents,
)
from backend.pdf_processor import extract_text_from_pdf
from backend.ai_service import generate_answer

app = FastAPI(
    title="AI Study Assistant API",
    description="Backend API for an AI-powered Study Assistant",
    version="1.0.0",
)

UPLOAD_FOLDER = Path("uploads")
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


class QuestionRequest(BaseModel):
    question: str


@app.get("/")
def home():
    return {"message": "AI Study Assistant backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    filename = Path(file.filename).name
    file_path = UPLOAD_FOLDER / filename

    try:
        content = await file.read(MAX_FILE_SIZE + 1)

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="PDF must be 20 MB or smaller.",
            )

        file_path.write_bytes(content)
        pages = extract_text_from_pdf(str(file_path))

        if not pages:
            raise HTTPException(
                status_code=400,
                detail="No extractable text found in this PDF.",
            )

        chunks = create_document_chunks(pages)
        embedded_chunks = build_embeddings(chunks)

        documents.clear()
        documents.extend(embedded_chunks)

        return {
            "message": "PDF uploaded and processed successfully",
            "filename": filename,
            "pages": len(pages),
            "chunks": len(embedded_chunks),
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"PDF processing error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="PDF processing failed. Check the server terminal.",
        )
    finally:
        await file.close()


@app.post("/ask")
def ask_question(request: QuestionRequest):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not documents:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF first.",
        )

    results = search_documents(request.question, top_k=3)

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No relevant study passages found.",
        )

    context = "\n\n".join(
        f"[Page {item['page']}]\n{item['text']}"
        for item in results
    )

    try:
        answer = generate_answer(request.question, context)
    except Exception as exc:
        print(f"Gemini generation error: {exc}")
        raise HTTPException(
            status_code=502,
            detail=(
                "Gemini answer generation failed. Check your local API key, "
                "model configuration, network connection, and API quota."
            ),
        )

    sources = [
        {
            "page": item["page"],
            "text": item["text"][:500],
        }
        for item in results
    ]

    return {
        "question": request.question,
        "answer": answer,
        "sources": sources,
    }