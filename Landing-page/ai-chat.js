
"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));

// Serve your existing frontend from the project folder.
app.use(express.static(path.join(__dirname)));

app.post("/api/ask", async (req, res) => {
  try {
    const { question, pdfText = "", pdfName = "" } = req.body || {};

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        error: "Question is too long. Keep it under 2000 characters."
      });
    }

    if (typeof pdfText !== "string" || typeof pdfName !== "string") {
      return res.status(400).json({
        error: "Invalid PDF data."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is missing. Configure GEMINI_API_KEY in .env."
      });
    }

    // Limit the amount of document text sent to the model.
    const documentText = pdfText.slice(0, 40000);

    const instructions = documentText.trim()
      ? `
You are StudyBase, an AI study assistant.

Answer the student's question using the provided study document.
Explain concepts clearly and in student-friendly language.
When relevant, mention page numbers found in the document.
If the document does not contain enough information, say so.
Do not invent quotations, facts, or page references.

Document name: ${pdfName || "Uploaded study material"}

Document content:
${documentText}
`
      : `
You are StudyBase, an AI study assistant.
Answer the student's question clearly and helpfully.
No PDF has been provided, so answer as a general study assistant.
Do not claim that you used the student's notes.
`;

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: instructions }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: question.trim() }]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1200
          }
        })
      }
    );

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Gemini API error:", data);

      return res.status(502).json({
        error:
          data.error?.message ||
          "The AI provider could not answer. Check the model and API key."
      });
    }

    const answer = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "The AI returned no text. Please try again."
      });
    }

    return res.json({ answer });
  } catch (error) {
    console.error("Backend error:", error);

    return res.status(500).json({
      error: "Something went wrong while generating the answer."
    });
  }
});

app.listen(PORT, () => {
  console.log(`StudyBase running at http://localhost:${PORT}`);
});
