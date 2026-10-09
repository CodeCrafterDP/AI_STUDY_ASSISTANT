

"use strict";

const API_BASE_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("aiChatForm");
  const chatInput = document.getElementById("aiChatInput");
  const sendButton = document.getElementById("aiSendButton");
  const chatMessages = document.getElementById("chatMessages");
  const chatSourceLabel = document.getElementById("chatSourceLabel");
  const sourceCount = document.getElementById("sourceCount");
  const fileList = document.getElementById("fileList");
  const clearChat = document.getElementById("clearChat");

  let activePDF = null;
  let uploading = false;
  let asking = false;

  function showMessage(role, text, sources = []) {
    document.getElementById("chatWelcome")?.remove();

    const message = document.createElement("div");
    message.className = `chat-message ${role}`;

    const content = document.createElement("div");
    content.className = "chat-message-content";
    content.textContent = text;
    message.appendChild(content);

    if (sources.length > 0) {
      const sourceBox = document.createElement("div");
      sourceBox.className = "chat-message-sources";

      const heading = document.createElement("strong");
      heading.textContent = "Sources";
      sourceBox.appendChild(heading);

      sources.forEach((source) => {
        const sourceText = document.createElement("p");
        sourceText.textContent =
          `Page ${source.page}: ${source.text}`;
        sourceBox.appendChild(sourceText);
      });

      message.appendChild(sourceBox);
    }

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
  }

  // Listen for files selected by landing_page.js.
  window.addEventListener("studybase:file-selected", async (event) => {
    const file = event.detail?.file;
    if (!file) return;

    if (uploading) {
      showMessage(
        "assistant",
        "Please wait for the current PDF upload to finish."
      );
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showMessage("assistant", "Only PDF files are supported by the backend.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage("assistant", "Please choose a PDF smaller than 10 MB.");
      return;
    }

    uploading = true;
    activePDF = null;

    if (chatSourceLabel) {
      chatSourceLabel.textContent = `Uploading ${file.name}...`;
    }

    showMessage("assistant", `Uploading ${file.name} to the study backend...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Upload failed (${response.status}).`);
      }

      activePDF = file;

      if (chatSourceLabel) {
        chatSourceLabel.textContent = data.filename;
      }

      if (sourceCount) {
        sourceCount.textContent = "1";
      }

      if (fileList) {
        fileList.replaceChildren();

        const item = document.createElement("div");
        item.className = "file-item";

        const name = document.createElement("span");
        name.className = "file-name";
        name.textContent =
          `${data.filename} — ${data.pages} pages`;

        item.appendChild(name);
        fileList.appendChild(item);
      }

      showMessage(
        "assistant",
        `PDF uploaded and processed successfully!\n\n` +
        `File: ${data.filename}\n` +
        `Pages: ${data.pages}\n` +
        `Text chunks indexed: ${data.chunks}\n\n` +
        "You can now ask questions about this PDF."
      );
    } catch (error) {
      activePDF = null;

      if (chatSourceLabel) {
        chatSourceLabel.textContent = "PDF upload failed";
      }

      showMessage(
        "assistant",
        `Upload failed: ${error.message}\n\n` +
        "Check that the Python backend is running on port 8000."
      );
    } finally {
      uploading = false;
    }
  });

  // Send questions to the Python RAG backend.
  chatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = chatInput.value.trim();

    if (!question || asking) return;

    if (uploading) {
      showMessage("assistant", "Please wait until the PDF upload finishes.");
      return;
    }

    if (!activePDF) {
      showMessage("assistant", "Please upload a PDF successfully first.");
      return;
    }

    showMessage("user", question);
    chatInput.value = "";

    asking = true;
    if (sendButton) sendButton.disabled = true;

    const loading = showMessage("assistant", "Searching your notes...");

    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Request failed (${response.status}).`);
      }

      loading.remove();

      showMessage(
        "assistant",
        data.answer || "The backend returned an empty answer.",
        data.sources || []
      );
    } catch (error) {
      loading.remove();

      showMessage(
        "assistant",
        `Could not get an answer: ${error.message}`
      );
    } finally {
      asking = false;
      if (sendButton) sendButton.disabled = false;
      chatInput.focus();
    }
  });

  // Enter sends; Shift+Enter creates a new line.
  chatInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  // Suggested questions fill the input.
  document.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
      chatInput.value = button.textContent.trim();
      chatInput.focus();
    });
  });

  // Clear visible messages; keep the uploaded PDF available.
  clearChat?.addEventListener("click", () => {
    chatMessages.replaceChildren();

    const welcome = document.createElement("div");
    welcome.className = "chat-welcome";
    welcome.id = "chatWelcome";

    const heading = document.createElement("h3");
    heading.textContent = "What would you like to learn?";

    const paragraph = document.createElement("p");
    paragraph.textContent =
      "Ask questions about your notes or understand difficult concepts.";

    welcome.append(heading, paragraph);
    chatMessages.appendChild(welcome);
  });
});