const STORAGE_KEY = "studybase-plan-v1";
const DEFAULT_STATE = { tasks: [], weeklyGoal: 10, focus: "Build a consistent routine", note: "" };
let state = loadState();
let toastTimer;
const $ = (id) => document.getElementById(id);

function loadState() {
  try { return { ...DEFAULT_STATE, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return { ...DEFAULT_STATE }; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid() { return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`; }
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function formatTime(value) {
  if (!value) return "Anytime";
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2300);
}
function render() {
  const tasks = [...state.tasks].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const done = tasks.filter(t => t.done).length;
  $("done-count").textContent = done;
  $("total-count").textContent = tasks.length;
  $("today-progress").style.width = `${tasks.length ? done / tasks.length * 100 : 0}%`;
  $("progress-caption").textContent = !tasks.length ? "A fresh start. Pick your first task." : done === tasks.length ? "Lovely work — you completed today's plan." : `${tasks.length - done} task${tasks.length - done === 1 ? "" : "s"} left. Keep going at your pace.`;
  $("focus-display").textContent = state.focus;
  $("hours-goal").textContent = state.weeklyGoal;
  $("goal-hours-side").textContent = state.weeklyGoal;
  $("goal-input").value = state.weeklyGoal;
  const totalHours = tasks.reduce((sum, t) => sum + Number(t.duration || 0), 0);
  const completedHours = tasks.filter(t => t.done).reduce((sum, t) => sum + Number(t.duration || 0), 0);
  $("hours-done").textContent = completedHours.toFixed(1).replace(/\.0$/, "");
  $("weekly-progress").style.width = `${Math.min(100, completedHours / Math.max(1, state.weeklyGoal) * 100)}%`;
  $("weekly-summary").textContent = totalHours.toFixed(1).replace(/\.0$/, "");
  $("task-list").innerHTML = tasks.map(task => `
    <article class="task-item ${task.done ? "completed" : ""}" data-id="${escapeHTML(task.id)}">
      <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} complete" ${task.done ? "checked" : ""} data-action="toggle">
      <div class="task-info">
        <div class="task-name">${escapeHTML(task.title)}</div>
        <div class="task-meta"><span class="subject-tag">${escapeHTML(task.subject || "Study")}</span><span>${Number(task.duration)} ${Number(task.duration) === 1 ? "hour" : "hours"}</span>${task.priority === "High" ? '<span class="priority">High priority</span>' : task.priority === "Low" ? '<span class="priority low">Low priority</span>' : ""}</div>
      </div>
      <div class="task-time"><strong>${formatTime(task.time)}</strong><div class="task-actions"><button class="mini-action" data-action="edit" title="Edit task">Edit</button><button class="mini-action" data-action="delete" title="Delete task">Delete</button></div></div>
    </article>`).join("");
  $("empty-state").classList.toggle("show", tasks.length === 0);
  $("task-list").style.display = tasks.length ? "grid" : "none";
  renderWeek(totalHours);
}
function renderWeek(totalHours) {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const mondayIndex = (today.getDay() + 6) % 7;
  $("week-days").innerHTML = names.map((name, i) => {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - mondayIndex + i);
    const isToday = i === mondayIndex;
    // The prototype allocates planned hours evenly; current-day completion is reflected in the goal card.
    const planned = state.tasks.reduce((sum, task) => sum + Number(task.duration || 0), 0) / 7;
    const height = Math.min(100, planned / Math.max(1, state.weeklyGoal / 3) * 100);
    return `<div class="day-column ${isToday ? "today" : ""}"><div class="day-name">${name}</div><div class="day-bar-wrap"><div class="day-bar" style="height:${height}%"></div></div><div class="day-hours">${isToday ? "Today" : (planned ? `${planned.toFixed(1)}h` : "—")}</div></div>`;
  }).join("");
}
function openTaskDialog(task = null) {
  $("task-form").reset();
  $("task-edit-id").value = task ? task.id : "";
  $("dialog-title").textContent = task ? "Edit study task" : "Add a study task";
  $("task-title").value = task?.title || "";
  $("task-subject").value = task?.subject || "Study";
  $("task-time").value = task?.time || "17:00";
  $("task-duration").value = String(task?.duration || 1);
  $("task-priority").value = task?.priority || "Normal";
  $("task-dialog").showModal();
  $("task-title").focus();
}
function closeDialog() { $("task-dialog").close(); }
$("task-form").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("task-title").value.trim();
  if (!title) return;
  const id = $("task-edit-id").value;
  const existing = state.tasks.find(t => t.id === id);
  const task = { id: id || uid(), title, subject: $("task-subject").value.trim() || "Study", time: $("task-time").value, duration: Number($("task-duration").value), priority: $("task-priority").value, done: existing?.done || false };
  if (existing) state.tasks = state.tasks.map(t => t.id === id ? task : t);
  else state.tasks.push(task);
  saveState(); render(); closeDialog(); showToast(existing ? "Task updated." : "Study task added.");
});
$("task-list").addEventListener("change", event => {
  if (!event.target.matches('[data-action="toggle"]')) return;
  const id = event.target.closest(".task-item").dataset.id;
  state.tasks = state.tasks.map(t => t.id === id ? { ...t, done: event.target.checked } : t);
  saveState(); render(); showToast(event.target.checked ? "Nice work — task completed!" : "Task moved back to your plan.");
});
$("task-list").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = button.closest(".task-item");
  const task = state.tasks.find(t => t.id === item.dataset.id);
  if (button.dataset.action === "edit") openTaskDialog(task);
  if (button.dataset.action === "delete" && confirm(`Delete "${task.title}" from your plan?`)) {
    state.tasks = state.tasks.filter(t => t.id !== task.id); saveState(); render(); showToast("Task deleted.");
  }
});
$("add-task-open").addEventListener("click", () => openTaskDialog());
$("empty-add").addEventListener("click", () => openTaskDialog());
$("close-dialog").addEventListener("click", closeDialog);
$("cancel-dialog").addEventListener("click", closeDialog);
$("task-dialog").addEventListener("click", event => { if (event.target === $("task-dialog")) closeDialog(); });
$("save-goal").addEventListener("click", () => {
  const value = Math.max(1, Math.min(80, Number($("goal-input").value) || 10));
  state.weeklyGoal = value; saveState(); render(); showToast("Weekly study goal saved.");
});
$("edit-focus").addEventListener("click", () => {
  const next = prompt("What do you want to focus on?", state.focus);
  if (next !== null && next.trim()) { state.focus = next.trim().slice(0, 90); saveState(); render(); showToast("Focus updated."); }
});
$("quick-note").value = state.note;
$("quick-note").addEventListener("input", () => {
  state.note = $("quick-note").value; saveState(); $("note-saved").textContent = "Saved in this browser";
});
$("today-date").textContent = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
$("menu-toggle").addEventListener("click", () => $("sidebar").classList.toggle("open"));
document.addEventListener("click", event => {
  if (window.innerWidth <= 900 && $("sidebar").classList.contains("open") && !$("sidebar").contains(event.target) && !$("menu-toggle").contains(event.target)) $("sidebar").classList.remove("open");
});
$("source-file").addEventListener("change", event => {
  const file = event.target.files[0];
  if (file) showToast(`${file.name} selected — connect your upload API to store it.`);
});
document.querySelectorAll(".main-nav .nav-link").forEach(link => link.addEventListener("click", event => {
  event.preventDefault();
  if (!link.classList.contains("active")) showToast(`${link.textContent.trim()} page can be connected to your existing route.`);
}));
render();
