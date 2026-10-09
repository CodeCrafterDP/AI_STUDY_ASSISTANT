
// ========================================
// STUDYBASE - LANDING PAGE JAVASCRIPT
// ========================================

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");

// ----------------------------------------
// MOBILE SIDEBAR
// ----------------------------------------

if (sidebar && menuButton) {
  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

// ----------------------------------------
// NAVIGATION
// Real HTML links navigate normally.
// Placeholder links do not change the page title.
// ----------------------------------------

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", function (event) {
    const href = this.getAttribute("href");

    // Allow links to other HTML pages to work normally.
    if (href && href !== "#") {
      return;
    }

    // Prevent navigation only for placeholder links.
    event.preventDefault();

    const toolName = this.dataset.tool;

    alert(toolName + " page will be added later.");

    if (sidebar) {
      sidebar.classList.remove("open");
    }
  });
});

// ----------------------------------------
// FILE UPLOAD
// ----------------------------------------

const fileInput = document.getElementById("fileInput");

let uploadedFiles = [];

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);

    const validFiles = files.filter(file => {
      const validType =
        /\.(pdf|txt|md|doc|docx)$/i.test(file.name);

      const validSize = file.size <= 10 * 1024 * 1024;

      if (!validType) {
        alert(file.name + " is not a supported file type.");
        return false;
      }

      if (!validSize) {
        alert(file.name + " exceeds the 10 MB limit.");
        return false;
      }

      // Avoid duplicate selection in the current session.
      const duplicate = uploadedFiles.some(existing =>
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

    updateLibrary();

    // Allows selecting the same file again after deleting it.
    fileInput.value = "";
  });
}

// ----------------------------------------
// UPDATE LIBRARY
// ----------------------------------------

function updateLibrary() {
  const count = uploadedFiles.length;

  renderFileList();

  const sourceCount = document.getElementById("sourceCount");
  const selectedCount = document.getElementById("selectedCount");
  const materialCount = document.getElementById("materialCount");
  const materialDescription =
    document.getElementById("materialDescription");
  const libraryMessage = document.getElementById("libraryMessage");
  const indexStatus = document.getElementById("indexStatus");
  const miniProgress = document.getElementById("miniProgress");
  const recentMessage = document.getElementById("recentMessage");
  const progressCaption = document.getElementById("progressCaption");

  if (sourceCount) {
    sourceCount.textContent = count;
  }

  if (selectedCount) {
    selectedCount.textContent =
      count + (count === 1 ? " source selected" : " sources selected");
  }

  if (materialCount) {
    materialCount.textContent = String(count).padStart(2, "0");
  }

  if (materialDescription) {
    materialDescription.textContent =
      count + (count === 1
        ? " file in your library."
        : " files in your library.");
  }

  if (libraryMessage) {
    libraryMessage.textContent = count
      ? "Your library contains " + count + " file(s)."
      : "▤ Your library is ready for its first source.";
  }

  if (indexStatus) {
    indexStatus.textContent = count ? "FILES ADDED" : "WAITING";
  }

  if (miniProgress) {
    miniProgress.style.width = count ? "35%" : "0%";
  }

  if (recentMessage) {
    recentMessage.textContent = count
      ? "Files added. Connect an AI service to generate a study guide."
      : "Your first source-linked guide will appear here.";
  }

  if (progressCaption) {
    progressCaption.textContent = count
      ? "Your study material has been added. Continue to your next milestone."
      : "Add your first notes to begin your learning journey.";
  }

  updateProgress(count > 0 ? 1 : 0);
}

// ----------------------------------------
// PROGRESS BAR
// ----------------------------------------

function updateProgress(milestones) {
  const percent = Math.min(
    100,
    Math.round((milestones / 4) * 100)
  );

  const progressFill = document.getElementById("progressFill");
  const progressPercent = document.getElementById("progressPercent");
  const progressTrack = document.getElementById("progressTrack");
  const progressLeft = document.getElementById("progressLeft");
  const progressRight = document.getElementById("progressRight");

  if (progressFill) {
    progressFill.style.width = percent + "%";
  }

  if (progressPercent) {
    progressPercent.textContent = percent + "%";
  }

  if (progressTrack) {
    progressTrack.setAttribute("aria-valuenow", percent);
  }

  if (progressLeft) {
    progressLeft.textContent =
      milestones + " of 4 milestones completed";
  }

  if (progressRight) {
    progressRight.textContent =
      percent === 100 ? "All milestones complete ✓" : "Keep learning ✳";
  }
}

// ----------------------------------------
// ADD SOURCE BUTTONS
// ----------------------------------------

const addSourceButton = document.getElementById("addSource");
const libraryButton = document.getElementById("libraryButton");

if (addSourceButton && fileInput) {
  addSourceButton.addEventListener("click", () => {
    fileInput.click();
  });
}

if (libraryButton && fileInput) {
  libraryButton.addEventListener("click", () => {
    fileInput.click();
  });
}

// ----------------------------------------
// SOURCE SELECTOR
// ----------------------------------------

const sourceSelector = document.getElementById("sourceSelector");

if (sourceSelector) {
  sourceSelector.addEventListener("click", () => {
    if (uploadedFiles.length === 0) {
      alert("Please add notes or a PDF to your study library first.");

      if (fileInput) {
        fileInput.click();
      }

      return;
    }

    alert(
      "Files in your library:\n" +
      uploadedFiles.map(file => file.name).join("\n")
    );
  });
}

// ----------------------------------------
// GET STARTED BUTTON
// ----------------------------------------

const startButton = document.getElementById("startButton");

if (startButton) {
  startButton.addEventListener("click", () => {
    const actionMessage = document.getElementById("actionMessage");

    if (uploadedFiles.length === 0) {
      if (actionMessage) {
        actionMessage.textContent =
          "First add your notes or PDF to get started.";
      }

      if (fileInput) {
        fileInput.click();
      }

      return;
    }

    if (actionMessage) {
      actionMessage.textContent =
        "Your files are ready. Connect your AI backend to continue.";
    }
  });
}

// ----------------------------------------
// RENDER FILE LIST + DELETE OPTION
// ----------------------------------------

function renderFileList() {
  const fileList = document.getElementById("fileList");

  if (!fileList) {
    return;
  }

  fileList.replaceChildren();

  uploadedFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "file-item";

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "🗑 Delete";
    deleteButton.setAttribute(
      "aria-label",
      "Delete " + file.name
    );

    deleteButton.addEventListener("click", () => {
      const confirmed = confirm(
        'Delete "' + file.name + '" from your library?'
      );

      if (!confirmed) {
        return;
      }

      uploadedFiles.splice(index, 1);
      updateLibrary();
    });

    item.append(name, deleteButton);
    fileList.appendChild(item);
  });
}

// ----------------------------------------
// INITIAL STATE
// ----------------------------------------

updateLibrary();
