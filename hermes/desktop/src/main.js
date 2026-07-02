/**
 * Hermes Desktop — Frontend JavaScript
 * Handles tab switching, chat, pharmacy ops, and task CRUD.
 *
 * When running inside Tauri: calls window.__TAURI__.core.invoke()
 * When running in a browser/dev: uses a built-in mock API layer.
 */

// ── Tauri detection ──────────────────────────────────────────────────────────

const isTauri = typeof window !== "undefined" && window.__TAURI__ !== undefined;

async function tauriInvoke(cmd, args = {}) {
  if (isTauri) {
    return window.__TAURI__.core.invoke(cmd, args);
  }
  // Fall back to mock API for browser-only development
  return mockApi(cmd, args);
}

// ── Mock API (browser dev mode) ───────────────────────────────────────────────

/** In-memory store for development / demo */
const store = {
  messages: [],
  tasks: [
    { id: 1, title: "Call insurance re: P042", description: "Verify coverage", status: "pending", priority: 1, due_date: "2026-06-05" },
    { id: 2, title: "Order Metformin 500mg", description: "", status: "pending", priority: 2, due_date: "2026-06-07" },
    { id: 3, title: "Update patient records", description: "", status: "done", priority: 3, due_date: null },
  ],
  refills: [
    { refill_id: "REFILL-A1B2C3D4", patient_id: "P001", medication: "Lisinopril 10mg", quantity: 30, requested_at: "2026-06-04T08:00:00" },
    { refill_id: "REFILL-E5F6G7H8", patient_id: "P007", medication: "Metformin 500mg", quantity: 90, requested_at: "2026-06-04T09:15:00" },
  ],
  nextTaskId: 4,
};

const MOCK_REPLIES = {
  claude: "I'm Claude (mock mode). I can help with pharmacy questions, medication info, and general tasks. In production, connect your Anthropic API key to get real responses.",
  gemini: "I'm Gemini (mock mode). Ready to assist with your ProCare Pharmacy workflows. Add your Google AI API key to enable real AI responses.",
  auto: "Hello from Hermes (mock mode)! Configure your API keys in ~/.hermes/.env to enable real AI responses. I'll route to the best available provider automatically.",
};

let mockTaskIdCounter = store.nextTaskId;

async function mockApi(cmd, args) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

  switch (cmd) {
    case "send_chat": {
      const provider = args.provider === "auto" ? "auto" : args.provider;
      return {
        reply: MOCK_REPLIES[provider] || MOCK_REPLIES.auto,
        provider_used: provider === "auto" ? "claude" : provider,
      };
    }
    case "get_status":
      return {
        providers: { claude: false, gemini: false },
        db_path: "~/.hermes/hermes.db (mock)",
        pharmacy: "ProCare Pharmacy",
        mode: "demo",
      };
    case "get_pharmacy_summary":
      return {
        pending_refills: store.refills.length,
        filled_today: 3,
        notifications_today: 7,
        mode: "demo",
      };
    case "get_pending_refills":
      return [...store.refills];
    case "create_refill": {
      const id = "REFILL-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      const r = {
        refill_id: id,
        patient_id: args.patient_id,
        medication: args.medication,
        quantity: args.quantity,
        requested_at: new Date().toISOString().slice(0, 19),
      };
      store.refills.push(r);
      return r;
    }
    case "mark_filled": {
      const idx = store.refills.findIndex(r => r.refill_id === args.refill_id);
      if (idx === -1) throw new Error(`Refill ${args.refill_id} not found`);
      store.refills.splice(idx, 1);
      return { refill_id: args.refill_id, filled_at: new Date().toISOString().slice(0, 19) };
    }
    case "get_tasks": {
      let tasks = [...store.tasks];
      if (args.status) tasks = tasks.filter(t => t.status === args.status);
      if (args.priority) tasks = tasks.filter(t => t.priority === Number(args.priority));
      return tasks;
    }
    case "add_task": {
      const t = {
        id: mockTaskIdCounter++,
        title: args.title,
        description: args.description || "",
        status: "pending",
        priority: Number(args.priority) || 2,
        due_date: args.due_date || null,
      };
      store.tasks.push(t);
      return t;
    }
    case "complete_task": {
      const t = store.tasks.find(t => t.id === Number(args.task_id));
      if (!t) throw new Error(`Task ${args.task_id} not found`);
      t.status = "done";
      return true;
    }
    default:
      throw new Error(`Unknown command: ${cmd}`);
  }
}

// ── Toast notifications ───────────────────────────────────────────────────────

const toastEl = document.getElementById("toast");
let toastTimer = null;

function toast(msg, isError = false) {
  toastEl.textContent = msg;
  toastEl.className = "show" + (isError ? " error" : "");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = ""; }, 3200);
}

// ── Tab switching ─────────────────────────────────────────────────────────────

const tabBtns = document.querySelectorAll(".tab-btn");
const panels = { chat: document.getElementById("chat-panel"), pharmacy: document.getElementById("pharmacy-panel"), tasks: document.getElementById("tasks-panel") };

function switchTab(tabName) {
  tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  Object.entries(panels).forEach(([name, el]) => {
    el.classList.toggle("active", name === tabName);
  });
  if (tabName === "pharmacy") loadPharmacyData();
  if (tabName === "tasks") loadTasks();
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

// ── Chat ──────────────────────────────────────────────────────────────────────

const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const providerSelect = document.getElementById("provider-select");
const sessionInput = document.getElementById("session-input");
const clearChatBtn = document.getElementById("clear-chat-btn");

/** Conversation history for the current session */
let conversation = [];

function appendMessage(role, content, providerLabel = null) {
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;

  const meta = document.createElement("div");
  meta.className = "msg-meta";
  meta.textContent = role === "user"
    ? "You"
    : (providerLabel ? providerLabel.charAt(0).toUpperCase() + providerLabel.slice(1) : "Hermes");
  div.appendChild(meta);

  const text = document.createElement("div");
  text.textContent = content;
  div.appendChild(text);

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function showThinking() {
  const div = document.createElement("div");
  div.className = "thinking";
  div.id = "thinking-indicator";
  div.textContent = "Thinking…";
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeThinking() {
  const el = document.getElementById("thinking-indicator");
  if (el) el.remove();
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = "";
  chatInput.style.height = "auto";

  appendMessage("user", text);
  conversation.push({ role: "user", content: text });

  sendBtn.disabled = true;
  showThinking();

  try {
    const result = await tauriInvoke("send_chat", {
      message: text,
      provider: providerSelect.value,
      session: sessionInput.value.trim() || null,
      history: conversation.slice(-20), // last 20 turns for context
    });

    removeThinking();

    const reply = typeof result === "string" ? result : result.reply;
    const usedProvider = typeof result === "object" ? result.provider_used : providerSelect.value;

    appendMessage("assistant", reply, usedProvider);
    conversation.push({ role: "assistant", content: reply });
  } catch (err) {
    removeThinking();
    appendMessage("assistant", `Error: ${err.message || err}`, "Error");
    toast(`Chat error: ${err.message || err}`, true);
  } finally {
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-grow textarea
chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
});

clearChatBtn.addEventListener("click", () => {
  // Remove all but the first welcome message
  while (chatMessages.children.length > 1) {
    chatMessages.removeChild(chatMessages.lastChild);
  }
  conversation = [];
  toast("Chat cleared.");
});

// ── Pharmacy ──────────────────────────────────────────────────────────────────

const statPending = document.getElementById("stat-pending");
const statFilled = document.getElementById("stat-filled");
const statNotifs = document.getElementById("stat-notifs");
const statMode = document.getElementById("stat-mode");
const refillsTableWrap = document.getElementById("refills-table-wrap");

async function loadPharmacyData() {
  try {
    const [summary, refills] = await Promise.all([
      tauriInvoke("get_pharmacy_summary"),
      tauriInvoke("get_pending_refills"),
    ]);

    statPending.textContent = summary.pending_refills ?? "—";
    statFilled.textContent = summary.filled_today ?? "—";
    statNotifs.textContent = summary.notifications_today ?? "—";
    statMode.textContent = summary.mode === "demo" ? "DEMO" : "LIVE";
    statMode.style.color = summary.mode === "demo" ? "var(--white-dim)" : "var(--green)";

    renderRefillsTable(refills);
  } catch (err) {
    toast(`Failed to load pharmacy data: ${err.message || err}`, true);
  }
}

function renderRefillsTable(refills) {
  if (!refills || refills.length === 0) {
    refillsTableWrap.innerHTML = '<div class="empty-state">No pending refills. Great work!</div>';
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Refill ID</th>
        <th>Patient</th>
        <th>Medication</th>
        <th>Qty</th>
        <th>Requested At</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  refills.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-family:var(--mono); font-size:12px; color:var(--gold)">${escHtml(r.refill_id)}</td>
      <td>${escHtml(r.patient_id)}</td>
      <td>${escHtml(r.medication || "—")}</td>
      <td style="text-align:right">${r.quantity ?? "—"}</td>
      <td style="color:var(--white-dim); font-size:12px">${escHtml(r.requested_at || "—")}</td>
      <td><button class="btn btn-success fill-btn" data-id="${escHtml(r.refill_id)}" style="padding:4px 12px; font-size:12px">Fill</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Wire up fill buttons
  tbody.querySelectorAll(".fill-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const refillId = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = "…";
      try {
        await tauriInvoke("mark_filled", { refill_id: refillId });
        toast(`Refill ${refillId} marked as filled.`);
        await loadPharmacyData();
      } catch (err) {
        toast(`Error: ${err.message || err}`, true);
        btn.disabled = false;
        btn.textContent = "Fill";
      }
    });
  });

  refillsTableWrap.innerHTML = "";
  refillsTableWrap.appendChild(table);
}

// Refill form
document.getElementById("refill-btn").addEventListener("click", async () => {
  const patient = document.getElementById("refill-patient").value.trim();
  const med = document.getElementById("refill-med").value.trim();
  const qty = parseInt(document.getElementById("refill-qty").value, 10);

  if (!patient || !med || !qty || qty < 1) {
    toast("Please fill in all refill fields.", true);
    return;
  }

  try {
    await tauriInvoke("create_refill", { patient_id: patient, medication: med, quantity: qty });
    toast(`Refill request created for patient ${patient}.`);
    document.getElementById("refill-patient").value = "";
    document.getElementById("refill-med").value = "";
    document.getElementById("refill-qty").value = "";
    await loadPharmacyData();
  } catch (err) {
    toast(`Error: ${err.message || err}`, true);
  }
});

document.getElementById("refresh-refills-btn").addEventListener("click", loadPharmacyData);

// ── Tasks ─────────────────────────────────────────────────────────────────────

const tasksTableWrap = document.getElementById("tasks-table-wrap");
const filterStatus = document.getElementById("filter-status");
const filterPriority = document.getElementById("filter-priority");

const PRIORITY_MAP = { 1: ["Urgent", "var(--red)"], 2: ["High", "var(--gold)"], 3: ["Medium", "#aaa"], 4: ["Low", "var(--white-dim)"] };

async function loadTasks() {
  try {
    const tasks = await tauriInvoke("get_tasks", {
      status: filterStatus.value || null,
      priority: filterPriority.value ? Number(filterPriority.value) : null,
    });
    renderTasksTable(tasks);
  } catch (err) {
    toast(`Failed to load tasks: ${err.message || err}`, true);
  }
}

function renderTasksTable(tasks) {
  if (!tasks || tasks.length === 0) {
    tasksTableWrap.innerHTML = '<div class="empty-state">No tasks found. Add one above!</div>';
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Priority</th>
        <th>Title</th>
        <th>Status</th>
        <th>Due Date</th>
        <th>Description</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  tasks.forEach(t => {
    const [pLabel, pColor] = PRIORITY_MAP[t.priority] || ["?", "var(--white-dim)"];
    const isDone = t.status === "done";
    const statusBadge = isDone
      ? `<span class="badge badge-green">done</span>`
      : `<span class="badge badge-gold">pending</span>`;

    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = t.due_date && t.due_date < today && !isDone;
    const dueDisplay = t.due_date
      ? (isOverdue
          ? `<span style="color:var(--red); font-weight:700">${escHtml(t.due_date)} !</span>`
          : escHtml(t.due_date))
      : "<span style='color:var(--white-dim)'>—</span>";

    const tr = document.createElement("tr");
    tr.style.opacity = isDone ? "0.55" : "1";
    tr.innerHTML = `
      <td style="color:var(--white-dim)">${t.id}</td>
      <td><span style="color:${pColor}; font-weight:700">${pLabel}</span></td>
      <td style="${isDone ? 'text-decoration:line-through; color:var(--white-dim)' : ''}">${escHtml(t.title)}</td>
      <td>${statusBadge}</td>
      <td>${dueDisplay}</td>
      <td style="color:var(--white-dim); font-size:12px">${escHtml((t.description || "").slice(0, 50))}</td>
      <td>
        ${!isDone
          ? `<button class="btn btn-success done-btn" data-id="${t.id}" style="padding:4px 10px; font-size:12px">Done</button>`
          : "<span style='color:var(--white-dim); font-size:12px'>✓</span>"}
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".done-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "…";
      try {
        await tauriInvoke("complete_task", { task_id: Number(btn.dataset.id) });
        toast(`Task #${btn.dataset.id} completed.`);
        await loadTasks();
      } catch (err) {
        toast(`Error: ${err.message || err}`, true);
        btn.disabled = false;
        btn.textContent = "Done";
      }
    });
  });

  tasksTableWrap.innerHTML = "";
  tasksTableWrap.appendChild(table);
}

// Add task form
document.getElementById("add-task-btn").addEventListener("click", async () => {
  const title = document.getElementById("task-title").value.trim();
  const desc = document.getElementById("task-desc").value.trim();
  const priority = parseInt(document.getElementById("task-priority").value, 10);
  const due = document.getElementById("task-due").value || null;

  if (!title) {
    toast("Please enter a task title.", true);
    return;
  }

  try {
    await tauriInvoke("add_task", { title, description: desc, priority, due_date: due });
    toast(`Task "${title}" added.`);
    document.getElementById("task-title").value = "";
    document.getElementById("task-desc").value = "";
    document.getElementById("task-due").value = "";
    await loadTasks();
  } catch (err) {
    toast(`Error: ${err.message || err}`, true);
  }
});

filterStatus.addEventListener("change", loadTasks);
filterPriority.addEventListener("change", loadTasks);
document.getElementById("refresh-tasks-btn").addEventListener("click", loadTasks);

// ── Utility ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Init ──────────────────────────────────────────────────────────────────────

(async function init() {
  // Load initial data for the active tab (chat)
  // Nothing async needed for chat panel on load

  // Log Tauri status
  if (isTauri) {
    console.log("Hermes running inside Tauri — using native backend.");
  } else {
    console.log("Hermes running in browser — using mock API (dev mode).");
  }
})();
