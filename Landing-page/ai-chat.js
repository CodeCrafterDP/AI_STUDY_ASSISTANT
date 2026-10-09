
"use strict";

(() => {
  const $ = (id) => document.getElementById(id);

  const form = $("aiChatForm");
  const input = $("aiChatInput");
  const messages = $("chatMessages");
  const sendButton = $("aiSendButton");
  const fileInput = $("fileInput");
  const sourceLabel = $("chatSourceLabel");

  if (!form || !input || !messages || !sendButton) {
    console.error("Required AI chat elements are missing.");
    return;
  }

  let selectedPdfText = "";
  let selectedPdfName = "";
  let sending = false;

  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(text, role) {
    const message = document.createElement("div");
    message.className = `chat-message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "J" : "✦";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    message.append(avatar, bubble);
    messages.append(message);
    scrollBottom();
  }

  function showTyping() {
    removeTyping();

    const message = document.createElement("div");
    message.className = "chat-message assistant";
    message.id = "chatTyping";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "✦";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const dots = document.createElement("div");
    dots.className = "typing-indicator";

    for (let i = 0; i < 3; i++) {
      dots.append(document.createElement("span"));
    }

    bubble.append(dots);
    message.append(avatar, bubble);
    messages.append(message);
    scrollBottom();
  }

  function removeTyping() {
    $("chatTyping")?.remove();
  }

  async function readPDF(file) {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js did not load. Check your internet connection.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("PDF must be smaller than 10 MB.");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(await file.arrayBuffer())
    }).promise;

    const pages = [];

    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();

      pages.push(
        `[Page ${number}] ` +
        content.items.map((item) => item.str || "").join(" ")
      );
    }

    return pages.join("\n\n");
  }

  async function handleSelectedFile(file) {
    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      if (sourceLabel) {
        sourceLabel.textContent = file.name + " (PDF required)";
      }
      return;
    }

    if (sourceLabel) sourceLabel.textContent = "Reading " + file.name + "...";

    try {
      const text = await readPDF(file);

      if (!text.trim()) {
        throw new Error("No selectable text found. Scanned PDFs need OCR.");
      }

      selectedPdfText = text;
      selectedPdfName = file.name;

      window.studyBaseSelectedPdf = {
        name: selectedPdfName,
        text: selectedPdfText
      };

      if (sourceLabel) sourceLabel.textContent = file.name;

      messages.querySelector(".chat-welcome")?.remove();
      addMessage(`PDF ready: ${file.name}. Ask a question about this document.`, "assistant");
    } catch (error) {
      selectedPdfText = "";
      selectedPdfName = "";
      window.studyBaseSelectedPdf = null;

      if (sourceLabel) sourceLabel.textContent = "Could not read " + file.name;

      console.error(error);
      alert(error.message || "Could not read PDF.");
    }
  }

  window.addEventListener("studybase:file-selected", (event) => {
    handleSelectedFile(event.detail?.file);
  });

  window.addEventListener("studybase:file-removed", (event) => {
    if (event.detail?.name === selectedPdfName) {
      selectedPdfText = "";
      selectedPdfName = "";
      window.studyBaseSelectedPdf = null;

      if (sourceLabel) sourceLabel.textContent = "No study source selected";
    }
  });

  // Suggested questions
  messages.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => sendMessage(button.textContent));
  });

  // Add PDF button
  $("chatAddSource")?.addEventListener("click", () => fileInput?.click());

  // Send question to backend
  async function sendMessage(text) {
    const question = text.trim();
    if (!question || sending) return;

    messages.querySelector(".chat-welcome")?.remove();

    sending = true;
    sendButton.disabled = true;

    addMessage(question, "user");
    input.value = "";
    input.style.height = "auto";
    showTyping();

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          pdfText: selectedPdfText,
          pdfName: selectedPdfName
        })
      });

      const result = await response.json();
      removeTyping();

      if (!response.ok) {
        throw new Error(result.error || "AI request failed.");
      }

      if (!result.answer) {
        throw new Error("The AI returned an empty answer.");
      }

      addMessage(result.answer, "assistant");
    } catch (error) {
      removeTyping();
      console.error("AI chat error:", error);

      addMessage(
        "I couldn't generate an answer. " +
        (error.message || "Check that your backend is running."),
        "assistant"
      );
    } finally {
      sending = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });

  $("clearChat")?.addEventListener("click", () => {
    if (sending) return;

    messages.replaceChildren();

    const welcome = document.createElement("div");
    welcome.className = "chat-welcome";

    const icon = document.createElement("div");
    icon.className = "welcome-icon";
    icon.textContent = "✦";

    const heading = document.createElement("h3");
    heading.textContent = "What would you like to learn?";

    const paragraph = document.createElement("p");
    paragraph.textContent =
      "Ask questions about your notes, understand difficult concepts, or get a simple explanation.";

    const suggestions = document.createElement("div");
    suggestions.className = "suggested-questions";

    [
      "Explain the main concepts",
      "Summarize my notes",
      "Give me important questions"
    ].forEach((question) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion";
      button.textContent = question;
      button.addEventListener("click", () => sendMessage(question));
      suggestions.append(button);
    });

    welcome.append(icon, heading, paragraph, suggestions);
    messages.append(welcome);
  });
})();
