const $ = (id) => document.getElementById(id);
const sidebar = $("sidebar"),
  menu = $("mobileMenu"),
  fileInput = $("fileInput"),
  sourceList = $("sourceList"),
  textArea = $("sourceText"),
  toast = $("toast");
let sources = [],
  lastSummary = "",
  toastTimer;
function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function countWords(text) {
  return text.trim() ? text.trim().split(/\\s+/).length : 0;
}
function updateWordCount() {
  $("wordCount").textContent = `${countWords(textArea.value)} words`;
}
textArea.addEventListener("input", updateWordCount);
$("clearText").addEventListener("click", () => {
  textArea.value = "";
  updateWordCount();
  $("message").textContent = "";
  textArea.focus();
});
menu.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
});
document.addEventListener("click", (e) => {
  if (
    innerWidth <= 800 &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    !e.target.closest("#mobileMenu")
  ) {
    sidebar.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
  }
});
document.querySelectorAll(".nav-item").forEach((link) =>
  link.addEventListener("click", () => {
    if (innerWidth <= 800) {
      sidebar.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    }
  }),
);
$("addSourceButton").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async (e) => {
  let added = 0;
  for (const file of Array.from(e.target.files || [])) {
    if (!/\\.(txt|md|text)$/i.test(file.name)) {
      notify(`${file.name}: this demo supports .txt and .md files.`);
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify(`${file.name}: file exceeds 10 MB.`);
      continue;
    }
    if (
      sources.some(
        (s) =>
          s.name === file.name &&
          s.size === file.size &&
          s.lastModified === file.lastModified,
      )
    ) {
      notify(`${file.name} is already added.`);
      continue;
    }
    try {
      sources.push({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        text: await file.text(),
      });
      added++;
    } catch {
      notify(`Could not read ${file.name}.`);
    }
  }
  renderSources();
  if (added) notify(`${added} text file${added === 1 ? "" : "s"} added.`);
  fileInput.value = "";
});
function renderSources() {
  $("sourceCount").textContent = sources.length;
  $("materialCount").textContent = String(sources.length).padStart(2, "0");
  $("materialDescription").textContent = sources.length
    ? `${sources.length} text file${sources.length === 1 ? "" : "s"} available in this page's library.`
    : "Paste text or add a text file to get started.";
  $("materialStatus").textContent = sources.length ? "FILES ADDED" : "WAITING";
  $("materialBarFill").style.width = sources.length ? "35%" : "0%";
  sourceList.replaceChildren();
  if (!sources.length) {
    sourceList.innerHTML =
      '<div class="source-empty"><span class="document-icon">▤</span><span>No sources added yet.</span></div>';
    return;
  }
  sources.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "source-item";
    const icon = document.createElement("span");
    icon.className = "document-icon";
    icon.textContent = "▤";
    const name = document.createElement("span");
    name.textContent = s.name;
    const use = document.createElement("button");
    use.className = "remove-source";
    use.type = "button";
    use.textContent = "↳";
    use.title = "Load text";
    use.addEventListener("click", () => {
      textArea.value = s.text;
      updateWordCount();
      textArea.focus();
      notify(`${s.name} loaded.`);
    });
    const remove = document.createElement("button");
    remove.className = "remove-source";
    remove.type = "button";
    remove.textContent = "×";
    remove.title = "Remove source";
    remove.addEventListener("click", () => {
      sources.splice(i, 1);
      renderSources();
      notify("Source removed.");
    });
    row.append(icon, name, use, remove);
    sourceList.append(row);
  });
}
$("loadSample").addEventListener("click", () => {
  textArea.value =
    "Machine learning is a branch of artificial intelligence that enables computer systems to learn patterns from data and make predictions or decisions. Supervised learning uses labelled examples to train a model. Classification predicts categories, such as whether an email is spam, while regression predicts continuous values, such as house prices. Unsupervised learning finds patterns in unlabelled data, for example by clustering similar observations. A dataset is often divided into training, validation, and test sets. The training set is used to fit model parameters, the validation set helps select models and tune hyperparameters, and the test set estimates performance on unseen examples. Overfitting occurs when a model learns the training data too closely and performs poorly on new data. Feature engineering, suitable evaluation metrics, and representative data can improve model performance.";
  updateWordCount();
  $("message").textContent =
    "Sample text loaded. Choose settings and generate a summary.";
});
function sentencesOf(text) {
  return (text.replace(/\\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [])
    .map((s) => s.trim())
    .filter(Boolean);
}
function summarize(text, length) {
  const sentences = sentencesOf(text);
  if (sentences.length <= 2) return sentences;
  const limit =
    length === "short"
      ? Math.max(2, Math.ceil(sentences.length * 0.25))
      : length === "detailed"
        ? Math.max(3, Math.ceil(sentences.length * 0.65))
        : Math.max(3, Math.ceil(sentences.length * 0.4));
  const stop = new Set(
    "a an and are as at be been being by for from has have in into is it its of on or that the their this to was were which with will".split(
      " ",
    ),
  );
  const words = sentences.map((s) =>
    (s.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) || []).filter(
      (w) => w.length > 2 && !stop.has(w),
    ),
  );
  const freq = new Map();
  words.flat().forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
  return sentences
    .map((sentence, i) => ({
      sentence,
      i,
      score: words[i].length
        ? words[i].reduce((n, w) => n + freq.get(w), 0) /
          Math.sqrt(words[i].length)
        : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limit, sentences.length))
    .sort((a, b) => a.i - b.i)
    .map((x) => x.sentence);
}
function renderSummary(items, format) {
  const out = $("summaryOutput");
  out.replaceChildren();
  if (format === "paragraph") {
    const p = document.createElement("p");
    p.textContent = items.join(" ");
    out.append(p);
  } else if (format === "revision") {
    items.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "revision-point";
      d.textContent = `${String(i + 1).padStart(2, "0")}. ${s}`;
      out.append(d);
    });
  } else {
    const ul = document.createElement("ul");
    items.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      ul.append(li);
    });
    out.append(ul);
  }
  lastSummary = items.join("\\n\\n");
}
$("generateButton").addEventListener("click", () => {
  const text = textArea.value.trim();
  if (!text) {
    $("message").textContent =
      "Paste or load notes before generating a summary.";
    textArea.focus();
    return;
  }
  if (countWords(text) < 20) {
    $("message").textContent =
      "Please provide at least 20 words for a useful summary.";
    textArea.focus();
    return;
  }
  const items = summarize(text, $("summaryLength").value),
    format = $("summaryFormat").value;
  renderSummary(items, format);
  $("outputTitle").textContent =
    format === "revision"
      ? "Revision notes"
      : format === "paragraph"
        ? "Summary paragraph"
        : "Key points";
  $("outputCount").textContent = `${items.length} key sentences`;
  $("outputCard").hidden = false;
  $("message").textContent =
    "Summary created locally from the sentences in your text.";
  $("outputCard").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("copyButton").addEventListener("click", async () => {
  if (!lastSummary) return;
  try {
    await navigator.clipboard.writeText(lastSummary);
    notify("Summary copied.");
  } catch {
    const t = document.createElement("textarea");
    t.value = lastSummary;
    document.body.append(t);
    t.select();
    const ok = document.execCommand("copy");
    t.remove();
    notify(ok ? "Summary copied." : "Copy failed; select and copy manually.");
  }
});
$("downloadButton").addEventListener("click", () => {
  if (!lastSummary) return;
  const url = URL.createObjectURL(
    new Blob([lastSummary], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "studybase-summary.txt";
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
renderSources();
updateWordCount();
