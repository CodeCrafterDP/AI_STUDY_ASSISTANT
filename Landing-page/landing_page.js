"use strict";

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");

if (sidebar && menuButton) {
  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

// Navigation
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function (event) {
    const href = this.getAttribute("href");

    if (href && href !== "#") {
      sidebar?.classList.remove("open");
      return;
    }

    event.preventDefault();
    alert((this.dataset.tool || "This") + " page will be added later.");
    sidebar?.classList.remove("open");
  });
});

// File library
const fileInput = document.getElementById("fileInput");
let uploadedFiles = [];

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);

    const validFiles = files.filter((file) => {
      if (!/\.(pdf|txt|md|doc|docx)$/i.test(file.name)) {
        alert(file.name + " is not a supported file type.");
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(file.name + " exceeds the 10 MB limit.");
        return false;
      }

      const duplicate = uploadedFiles.some((existing) =>
        existing.name === file.name &&
        existing.size === file.size &&
        existing.lastModified === file.lastModified
      );

      if (duplicate) {
        alert(file.name + " has already been added.");
        return false;
      }

      return true;
    });

    uploadedFiles.push(...validFiles);

    // Notify AI chat about each uploaded file.
    validFiles.forEach((file) => {
      window.dispatchEvent(
        new CustomEvent("studybase:file-selected", {
          detail: { file }
        })
      );
    });

    updateLibrary();
    fileInput.value = "";
  });
}

function updateLibrary() {
  const count = uploadedFiles.length;

  renderFileList();

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  setText("sourceCount", count);
  setText(
    "selectedCount",
    `${count} ${count === 1 ? "source" : "sources"} selected`
  );
  setText("materialCount", String(count).padStart(2, "0"));
  setText(
    "materialDescription",
    `${count} ${count === 1 ? "file" : "files"} in your library.`
  );
  setText(
    "indexStatus",
    count ? "FILES ADDED" : "WAITING"
  );
  setText(
    "recentMessage",
    count
      ? "Files added. Ask a question in the chat to get started."
      : "Your first source-linked guide will appear here."
  );
  setText(
    "progressCaption",
    count
      ? "Your study material has been added."
      : "Add your first notes to begin your learning journey."
  );

  const miniProgress = document.getElementById("miniProgress");
  if (miniProgress) miniProgress.style.width = count ? "35%" : "0%";

  // Keep the file list outside the status text.
  const libraryMessage = document.getElementById("libraryMessage");
  if (libraryMessage) {
    let status = document.getElementById("libraryStatusText");

    if (!status) {
      status = document.createElement("span");
      status.id = "libraryStatusText";
      libraryMessage.prepend(status);
    }

    status.textContent = count
      ? `Your library contains ${count} file(s).`
      : "▤ Your library is ready for its first source.";
  }

  updateProgress(count ? 1 : 0);
}

function updateProgress(milestones) {
  const percent = Math.min(100, Math.round((milestones / 4) * 100));

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  const fill = document.getElementById("progressFill");
  const track = document.getElementById("progressTrack");

  if (fill) fill.style.width = percent + "%";
  if (track) track.setAttribute("aria-valuenow", percent);

  setText("progressPercent", percent + "%");
  setText("progressLeft", `${milestones} of 4 milestones completed`);
  setText(
    "progressRight",
    percent === 100 ? "All milestones complete ✓" : "Keep learning ✳"
  );
}

// Add-source buttons
document.getElementById("addSource")?.addEventListener("click", () => {
  fileInput?.click();
});

document.getElementById("libraryButton")?.addEventListener("click", () => {
  fileInput?.click();
});

// Source selector
document.getElementById("sourceSelector")?.addEventListener("click", () => {
  if (!uploadedFiles.length) {
    alert("Please add notes or a PDF first.");
    fileInput?.click();
    return;
  }

  alert("Files in your library:\n" +
    uploadedFiles.map((file) => file.name).join("\n"));
});

// Get started
document.getElementById("startButton")?.addEventListener("click", () => {
  const message = document.getElementById("actionMessage");

  if (!uploadedFiles.length) {
    if (message) message.textContent = "First add your notes or PDF.";
    fileInput?.click();
    return;
  }

  if (message) message.textContent = "Your files are ready. Ask a question below.";
  document.getElementById("aiChatInput")?.focus();
});

// Render library files
function renderFileList() {
  const fileList = document.getElementById("fileList");
  if (!fileList) return;

  fileList.replaceChildren();

  uploadedFiles.forEach((file) => {
    const item = document.createElement("div");
    item.className = "file-item";

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "🗑 Delete";

    deleteButton.addEventListener("click", () => {
      if (!confirm(`Delete "${file.name}" from your library?`)) return;

      uploadedFiles = uploadedFiles.filter((existing) => existing !== file);

      window.dispatchEvent(
        new CustomEvent("studybase:file-removed", {
          detail: { name: file.name }
        })
      );

      updateLibrary();
    });

    item.append(name, deleteButton);
    fileList.append(item);
  });
}

updateLibrary();