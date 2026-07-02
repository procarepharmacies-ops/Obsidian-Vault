use serde_json::{json, Value};

// ── Tauri Commands ────────────────────────────────────────────────────────────

/// Simple greeting — sanity-check that the Tauri bridge is working.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Hermes — ProCare AI Hub.", name)
}

/// Return a mock system status JSON object.
/// In a real implementation this would call the Python core via a sidecar or IPC.
#[tauri::command]
fn get_status() -> Value {
    json!({
        "app": "Hermes",
        "version": "0.1.0",
        "pharmacy": "ProCare Pharmacy",
        "providers": {
            "claude": false,
            "gemini": false
        },
        "db_path": "~/.hermes/hermes.db",
        "mode": "demo"
    })
}

/// Stub chat command. In production this would spawn the Python CLI
/// as a Tauri sidecar and stream back the response.
#[tauri::command]
async fn send_chat(message: String, provider: String) -> Result<Value, String> {
    // In a full implementation:
    // 1. Spawn the Python hermes CLI as a sidecar (defined in tauri.conf.json)
    // 2. Pass message and provider as arguments
    // 3. Collect stdout and return JSON
    //
    // For now, return a placeholder response so the frontend works.

    let provider_used = if provider == "auto" { "claude" } else { provider.as_str() }.to_string();

    let reply = format!(
        "[Tauri stub] You said: \"{}\"\n\n\
        This is a placeholder response from the Rust backend. \
        To enable real AI responses, configure the Python sidecar in \
        tauri.conf.json and implement the sidecar bridge in this command.",
        message
    );

    Ok(json!({
        "reply": reply,
        "provider_used": provider_used,
        "stub": true
    }))
}

/// Get pharmacy summary stats (stub).
#[tauri::command]
fn get_pharmacy_summary() -> Value {
    json!({
        "pending_refills": 0,
        "filled_today": 0,
        "notifications_today": 0,
        "mode": "demo"
    })
}

/// Get list of pending refills (stub — returns empty list).
#[tauri::command]
fn get_pending_refills() -> Value {
    json!([])
}

/// Create a refill request (stub).
#[tauri::command]
fn create_refill(patient_id: String, medication: String, quantity: u32) -> Result<Value, String> {
    Ok(json!({
        "refill_id": format!("REFILL-STUB-{}", &patient_id),
        "patient_id": patient_id,
        "medication": medication,
        "quantity": quantity,
        "requested_at": "2026-06-04T00:00:00",
        "status": "pending"
    }))
}

/// Mark a refill as filled (stub).
#[tauri::command]
fn mark_filled(refill_id: String) -> Result<Value, String> {
    Ok(json!({
        "refill_id": refill_id,
        "filled_at": "2026-06-04T00:00:00"
    }))
}

/// Get tasks (stub).
#[tauri::command]
fn get_tasks(status: Option<String>, priority: Option<u32>) -> Value {
    // Stubs return empty; a full implementation would call the Python backend
    json!([])
}

/// Add a task (stub).
#[tauri::command]
fn add_task(
    title: String,
    description: Option<String>,
    priority: u32,
    due_date: Option<String>,
) -> Result<Value, String> {
    Ok(json!({
        "id": 1,
        "title": title,
        "description": description.unwrap_or_default(),
        "status": "pending",
        "priority": priority,
        "due_date": due_date
    }))
}

/// Complete a task (stub).
#[tauri::command]
fn complete_task(task_id: u32) -> Result<bool, String> {
    Ok(true)
}

// ── App entry point ───────────────────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_status,
            send_chat,
            get_pharmacy_summary,
            get_pending_refills,
            create_refill,
            mark_filled,
            get_tasks,
            add_task,
            complete_task,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Hermes desktop application");
}
