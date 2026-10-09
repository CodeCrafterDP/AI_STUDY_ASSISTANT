
(() => {
  "use strict";

  const DB_NAME = "StudyBaseKeyTopicsDB";
  const STORE_NAME = "sources";
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  let db = null;
  let sources = [];
  let selectedId = null;

  const $ = (id) => document.getElementById(id);

  // ---------------- DATABASE ----------------

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, {
            keyPath: "id"
          });
        }
      };

      request.onsuccess = () => {
        db = request.result;

        db.onversionchange = () => db.close();

        resolve(db);
      };

      request.onerror = () => {
        reject(request.error || new Error("Database could not open."));
      };

      request.onblocked = () => {
        console.warn("Database upgrade is blocked by another open tab.");
      };
    });
  }

  function getAllSources() {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database is not ready."));
        return;
      }

      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error || new Error("Could not load PDFs."));
      };

      transaction.onabort = () => {
        reject(transaction.error || new Error("Reading PDFs was aborted."));
      };
    });
  }

  function saveSource(source) {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database is not ready."));
        return;
      }

      const transaction = db.transaction(STORE_NAME, "readwrite");
      const request = transaction.objectStore(STORE_NAME).put(source);

      transaction.oncomplete = () => resolve();

      transaction.onerror = () => {
        reject(transaction.error || new Error("Could not save PDF."));
      };

      transaction.onabort = () => {
        reject(transaction.error || new Error("Saving PDF was aborted."));
      };

      request.onerror = () => {
        reject(request.error || new Error("Could not save PDF."));
      };
    });
  }

  // Corrected delete function: waits for transaction completion.
  function deleteSource(id) {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database is not ready."));
        return;
      }

      let transaction;

      try {
        transaction = db.transaction(STORE_NAME, "readwrite");

        const store = transaction.objectStore(STORE_NAME);
        store.delete(id);

        transaction.oncomplete = () => resolve();

        transaction.onerror = () => {
          reject(
            transaction.error || new Error("Could not delete PDF.")
          );
        };

        transaction.onabort = () => {
          reject(
            transaction.error || new Error("PDF deletion was aborted.")
          );
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // ---------------- PDF TEXT EXTRACTION ----------------

  async function extractPDFText(file) {
    if (!window.pdfjsLib) {
      throw new Error(
        "PDF.js did not load. Check your internet connection and reload."
      );
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(await file.arrayBuffer())
    }).promise;

    const pageTexts = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      pageTexts.push(
        content.items.map((item) => item.str || "").join(" ")
      );
    }

    return {
      text: pageTexts.join("\n"),
      pageCount: pdf.numPages
    };
  }

  // ---------------- TOPIC DETECTION ----------------
  // Basic keyword extraction, not AI-generated predictions.

  function findTopicCandidates(text) {
    const stopWords = new Set(`
      about above after again against also among and any are because been
      before being between both but can could did does doing down during
      each few for from further had has have having here how into its itself
      more most other our out over own same should some such than that the
      their them then there these they this those through under until very
      was were what when where which while who will with would your
      chapter section figure table example page university introduction
      conclusion therefore however using used use based given find show
      define explain problem solution
    `.split(/\s+/));

    const clean = text.replace(/\s+/g, " ").trim();

    const words =
      clean.match(/\b[a-zA-Z][a-zA-Z-]{3,}\b/g) || [];

    const frequency = new Map();

    for (const word of words) {
      const key = word.toLowerCase();

      if (!stopWords.has(key)) {
        frequency.set(key, (frequency.get(key) || 0) + 1);
      }
    }

    const rankedWords = [...frequency.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [];

    return rankedWords.map(([word, count], index) => {
      const sentence = sentences.find((item) =>
        item.toLowerCase().includes(word)
      );

      return {
        title: word.charAt(0).toUpperCase() + word.slice(1),
        description: sentence
          ? sentence.trim().slice(0, 240)
          : `This term appears ${count} times in the PDF.`,
        frequency: count,
        number: index + 1
      };
    });
  }

  // ---------------- UPLOAD PDF ----------------

  async function handleUpload(fileList) {
    const files = Array.from(fileList || []);

    for (const file of files) {
      const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPDF) {
        alert(`${file.name} is not a PDF file.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} exceeds the 10 MB limit.`);
        continue;
      }

      try {
        const extracted = await extractPDFText(file);

        if (!extracted.text.trim()) {
          alert(
            `${file.name} contains no selectable text. ` +
            "Scanned PDFs need OCR."
          );
        }

        const source = {
          id:
            window.crypto && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          size: file.size,
          pageCount: extracted.pageCount,
          text: extracted.text,
          topics: findTopicCandidates(extracted.text),
          uploadedAt: new Date().toISOString()
        };

        await saveSource(source);
      } catch (error) {
        console.error("PDF processing error:", error);

        alert(
          `Could not process ${file.name}.\n` +
          (error.message || "Unknown error")
        );
      }
    }

    await refreshSources();
  }

  // ---------------- HELPER FUNCTIONS ----------------

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  // ---------------- SIDEBAR PDF LIST ----------------

  function renderSidebar() {
    $("sourceCount").textContent = sources.length;

    const list = $("sourceList");
    list.replaceChildren();

    sources.forEach((source) => {
      const row = createElement("div", "source-item");
      const icon = createElement("span", "file-symbol", "▤");
      const name = createElement("button", "source-name", source.name);
      const remove = createElement("button", "remove-source", "×");

      name.type = "button";

      name.style.cssText =
        "border:0;background:transparent;text-align:left;" +
        "cursor:pointer;flex:1;min-width:0;overflow-wrap:anywhere;";

      name.addEventListener("click", () => {
        selectSource(source.id);
      });

      remove.type = "button";
      remove.title = "Delete PDF";
      remove.setAttribute("aria-label", `Delete ${source.name}`);

      // DELETE BUTTON
      remove.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const confirmed = window.confirm(
          `Are you sure you want to delete "${source.name}"?`
        );

        if (!confirmed) return;

        remove.disabled = true;

        try {
          await deleteSource(source.id);

          if (selectedId === source.id) {
            selectedId = null;
          }

          await refreshSources();
        } catch (error) {
          console.error("Delete error:", error);

          alert(
            "Could not delete this PDF.\n" +
            (error.message || "Please try again.")
          );

          remove.disabled = false;
        }
      });

      row.append(icon, name, remove);
      list.append(row);
    });

    const footer = $("libraryFooter");

    if (footer) {
      footer.textContent = sources.length
        ? `${sources.length} PDF source(s) in your library.`
        : "▤ Your library is ready for its first source.";
    }
  }

  // ---------------- MAIN PDF CARDS ----------------

  function renderPDFCards() {
    const container = $("pdfCards");
    container.replaceChildren();

    if (!sources.length) {
      const empty = createElement("div", "empty-state");
      const icon = createElement("div", "empty-icon", "⇧");
      const heading = createElement("h3", "", "No PDF uploaded yet");

      const paragraph = createElement(
        "p",
        "",
        "Upload your class notes or textbook PDF to get started."
      );

      const label = createElement("label", "secondary-button", "Choose a PDF");

      label.htmlFor = "mainPdfInput";

      empty.append(icon, heading, paragraph, label);
      container.append(empty);
      return;
    }

    sources.forEach((source) => {
      const card = createElement(
        "article",
        `pdf-card ${selectedId === source.id ? "selected" : ""}`
      );

      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `View topics in ${source.name}`);

      const icon = createElement("div", "pdf-icon", "PDF");
      const info = createElement("div", "pdf-info");
      const title = createElement("h3", "", source.name);

      const details = createElement(
        "p",
        "",
        `${source.pageCount} pages · ${formatSize(source.size)}`
      );

      const button = createElement("button", "pdf-select", "→");

      button.type = "button";
      button.title = "View topics";
      button.setAttribute("aria-label", `View topics in ${source.name}`);

      info.append(title, details);
      card.append(icon, info, button);

      card.addEventListener("click", () => {
        selectSource(source.id);
      });

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectSource(source.id);
        }
      });

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        selectSource(source.id);
      });

      container.append(card);
    });
  }

  // ---------------- DISPLAY TOPICS ----------------

  function renderTopics(source) {
    $("selectedTitle").textContent = source.name;

    $("selectedSubtitle").textContent =
      `${source.pageCount} pages · Detected topic candidates`;

    const container = $("topicContent");
    container.replaceChildren();

    container.append(
      createElement(
        "div",
        "notice",
        "Topics are detected from repeated words in the PDF. " +
        "They are not AI-verified exam predictions."
      )
    );

    if (!source.text.trim()) {
      const empty = createElement("div", "topic-placeholder");

      empty.append(
        createElement("div", "placeholder-icon", "◎"),
        createElement("h3", "", "No selectable text found"),
        createElement(
          "p",
          "",
          "This may be a scanned PDF. OCR is needed to read its images."
        )
      );

      container.append(empty);
      return;
    }

    if (!source.topics || !source.topics.length) {
      const empty = createElement("div", "topic-placeholder");

      empty.append(
        createElement("div", "placeholder-icon", "◎"),
        createElement("h3", "", "No repeated topics detected"),
        createElement(
          "p",
          "",
          "Try a text-based PDF with more content."
        )
      );

      container.append(empty);
      return;
    }

    const group = createElement("div", "topic-group");

    group.append(createElement("h3", "", "Detected topics"));

    const list = createElement("div", "topic-list");

    source.topics.forEach((topic) => {
      const card = createElement("article", "topic-card");

      card.append(
        createElement(
          "span",
          "topic-number",
          `TOPIC ${String(topic.number).padStart(2, "0")}`
        ),
        createElement("h4", "", topic.title),
        createElement("p", "", topic.description),
        createElement(
          "span",
          "topic-tag",
          `${topic.frequency} occurrences`
        )
      );

      list.append(card);
    });

    group.append(list);
    container.append(group);
  }

  // ---------------- SELECT A PDF ----------------

  function selectSource(id) {
    const source = sources.find((item) => item.id === id);

    if (!source) return;

    selectedId = id;

    const topicCount = source.topics ? source.topics.length : 0;

    $("topicTotal").textContent = topicCount;
    $("conceptTotal").textContent = topicCount;

    renderSidebar();
    renderPDFCards();
    renderTopics(source);
  }

  // ---------------- REFRESH LIBRARY ----------------

  async function refreshSources() {
    sources = await getAllSources();

    $("pdfTotal").textContent = sources.length;

    renderSidebar();
    renderPDFCards();

    if (selectedId && sources.some((item) => item.id === selectedId)) {
      selectSource(selectedId);
      return;
    }

    if (sources.length) {
      selectSource(sources[0].id);
      return;
    }

    selectedId = null;

    $("topicTotal").textContent = "0";
    $("conceptTotal").textContent = "0";

    $("selectedTitle").textContent = "Important topics";

    $("selectedSubtitle").textContent =
      "Choose an uploaded PDF to view its key topics.";

    const placeholder = createElement("div", "topic-placeholder");

    placeholder.append(
      createElement("div", "placeholder-icon", "◎"),
      createElement("h3", "", "Your key topics will appear here"),
      createElement(
        "p",
        "",
        "Choose a PDF above to explore its concepts."
      )
    );

    $("topicContent").replaceChildren(placeholder);
  }

  // ---------------- INITIALIZE ----------------

  async function init() {
    const pdfInput = $("pdfInput");
    const mainPdfInput = $("mainPdfInput");
    const addSource = $("addSource");

    if (!pdfInput || !mainPdfInput || !addSource) {
      console.error(
        "Required HTML elements are missing. Check the IDs in key-topics.html."
      );
      return;
    }

    pdfInput.addEventListener("change", async (event) => {
      try {
        await handleUpload(event.target.files);
      } catch (error) {
        console.error(error);
        alert("Could not refresh the PDF library.");
      } finally {
        event.target.value = "";
      }
    });

    mainPdfInput.addEventListener("change", async (event) => {
      try {
        await handleUpload(event.target.files);
      } catch (error) {
        console.error(error);
        alert("Could not refresh the PDF library.");
      } finally {
        event.target.value = "";
      }
    });

    addSource.addEventListener("click", () => {
      pdfInput.click();
    });

    try {
      await openDatabase();
      await refreshSources();
    } catch (error) {
      console.error("StudyBase database error:", error);

      alert(
        "Could not open the PDF library. " +
        "Try running the page with VS Code Live Server."
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
