"""
Hermes CLI — built with Typer + Rich.

Entry point: hermes (defined in setup.py console_scripts)
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import datetime
from typing import Optional

import typer
from rich import box
from rich.console import Console
from rich.live import Live
from rich.markup import escape
from rich.panel import Panel
from rich.prompt import Prompt
from rich.spinner import Spinner
from rich.table import Table
from rich.text import Text

app = typer.Typer(
    name="hermes",
    help="[bold gold1]Hermes[/bold gold1] — ProCare AI Hub  |  AI chat · Pharmacy ops · Tasks",
    rich_markup_mode="rich",
    no_args_is_help=True,
)

pharmacy_app = typer.Typer(help="ProCare Pharmacy operations.", no_args_is_help=True)
task_app = typer.Typer(help="Personal task management.", no_args_is_help=True)
app.add_typer(pharmacy_app, name="pharmacy")
app.add_typer(task_app, name="task")

console = Console()

# ── Palette ──────────────────────────────────────────────────────────────────
GOLD = "gold1"
NAVY = "navy_blue"
GREEN = "green3"
RED = "red1"
DIM = "dim"
CYAN = "cyan1"

PRIORITY_LABELS = {1: ("Urgent", RED), 2: ("High", "orange3"), 3: ("Medium", GOLD), 4: ("Low", DIM)}


# ── Async helpers ─────────────────────────────────────────────────────────────

def _run(coro):  # type: ignore[no-untyped-def]
    """Run an async coroutine from a sync CLI command."""
    return asyncio.run(coro)


async def _get_db():
    from hermes.core.database import AsyncDB
    db = AsyncDB()
    await db.initialize()
    return db


# ── hermes init ──────────────────────────────────────────────────────────────

@app.command()
def init():
    """Initialize Hermes: create directories, database, and show setup checklist."""
    from pathlib import Path

    hermes_dir = Path.home() / ".hermes"

    console.print(Panel.fit(
        "[bold gold1]Initializing Hermes[/bold gold1]",
        border_style=GOLD,
    ))

    async def _init() -> None:
        hermes_dir.mkdir(parents=True, exist_ok=True)
        console.print(f"  [green3]✓[/green3] Created [cyan1]{hermes_dir}[/cyan1]")

        env_example = Path(__file__).parent.parent / ".env.example"
        env_target = hermes_dir / ".env"
        if not env_target.exists() and env_example.exists():
            import shutil
            shutil.copy(env_example, env_target)
            console.print(f"  [green3]✓[/green3] Copied .env.example → [cyan1]{env_target}[/cyan1]")
        elif env_target.exists():
            console.print(f"  [dim]  .env already exists at {env_target}[/dim]")

        db = await _get_db()
        await db.close()
        console.print(f"  [green3]✓[/green3] Database initialized")

    _run(_init())

    table = Table(title="Setup Checklist", box=box.ROUNDED, border_style=GOLD)
    table.add_column("Step", style="bold")
    table.add_column("Action")
    table.add_row("1", f"Edit [cyan1]{Path.home() / '.hermes' / '.env'}[/cyan1] — add your API keys")
    table.add_row("2", "Set [gold1]ANTHROPIC_API_KEY[/gold1] for Claude")
    table.add_row("3", "Set [gold1]GEMINI_API_KEY[/gold1] for Gemini")
    table.add_row("4", "Run [bold]hermes status[/bold] to verify configuration")
    table.add_row("5", "Run [bold]hermes chat[/bold] to start chatting!")
    console.print(table)


# ── hermes status ─────────────────────────────────────────────────────────────

@app.command()
def status():
    """Show system status: providers, database, tasks, and pharmacy summary."""

    async def _status() -> None:
        from hermes.core.config import settings
        from hermes.core.database import AsyncDB
        from hermes.core.pharmacy import PharmacyOps
        from hermes.core.task_runner import TaskRunner

        db = await _get_db()
        try:
            task_runner = TaskRunner(db)
            pharmacy = PharmacyOps(db)

            pending_tasks = await task_runner.list_tasks(status="pending")
            overdue_tasks = await task_runner.get_overdue_tasks()
            pharmacy_summary = await pharmacy.get_daily_summary()
        finally:
            await db.close()

        # ── Providers panel ──────────────────────────────────────────────────
        prov_table = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        prov_table.add_column("Provider", style="bold")
        prov_table.add_column("Status")
        prov_table.add_column("Key")

        if settings.has_claude:
            key_preview = (settings.anthropic_api_key or "")[:12] + "..."
            prov_table.add_row("Claude", f"[{GREEN}]● Configured[/{GREEN}]", f"[{DIM}]{key_preview}[/{DIM}]")
        else:
            prov_table.add_row("Claude", f"[{RED}]○ Not configured[/{RED}]", "[dim]—[/dim]")

        if settings.has_gemini:
            key_preview = (settings.gemini_api_key or "")[:12] + "..."
            prov_table.add_row("Gemini", f"[{GREEN}]● Configured[/{GREEN}]", f"[{DIM}]{key_preview}[/{DIM}]")
        else:
            prov_table.add_row("Gemini", f"[{RED}]○ Not configured[/{RED}]", "[dim]—[/dim]")

        console.print(Panel(prov_table, title="[bold]AI Providers[/bold]", border_style=GOLD))

        # ── Database panel ───────────────────────────────────────────────────
        db_info = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        db_info.add_column("Key", style="bold")
        db_info.add_column("Value")
        db_info.add_row("Path", f"[{CYAN}]{settings.db_path_expanded}[/{CYAN}]")
        db_info.add_row("Log Level", settings.hermes_log_level)
        db_info.add_row("Pharmacy", settings.pharmacy_name)
        db_info.add_row(
            "Webhook",
            f"[{GREEN}]Configured[/{GREEN}]" if settings.pharmacy_webhook_url else f"[{DIM}]Demo mode[/{DIM}]",
        )
        console.print(Panel(db_info, title="[bold]Configuration[/bold]", border_style=NAVY))

        # ── Tasks panel ──────────────────────────────────────────────────────
        task_color = RED if overdue_tasks else GREEN
        task_info = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        task_info.add_column("Key", style="bold")
        task_info.add_column("Value")
        task_info.add_row("Pending tasks", str(len(pending_tasks)))
        task_info.add_row(
            "Overdue",
            f"[{task_color}]{len(overdue_tasks)}[/{task_color}]",
        )
        console.print(Panel(task_info, title="[bold]Tasks[/bold]", border_style=CYAN))

        # ── Pharmacy panel ────────────────────────────────────────────────────
        pharm_info = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
        pharm_info.add_column("Key", style="bold")
        pharm_info.add_column("Value")
        pharm_info.add_row("Date", pharmacy_summary["date"])
        pharm_info.add_row("Pending refills", str(pharmacy_summary["pending_refills"]))
        pharm_info.add_row("Filled today", str(pharmacy_summary["filled_today"]))
        pharm_info.add_row("Notifications today", str(pharmacy_summary["notifications_today"]))
        pharm_info.add_row(
            "Mode",
            f"[{DIM}]demo[/{DIM}]" if pharmacy_summary["mode"] == "demo" else f"[{GREEN}]live[/{GREEN}]",
        )
        console.print(Panel(pharm_info, title="[bold]Pharmacy[/bold]", border_style=GOLD))

    _run(_status())


# ── hermes chat ───────────────────────────────────────────────────────────────

@app.command()
def chat(
    provider: str = typer.Option("auto", "--provider", "-p", help="claude | gemini | auto"),
    session: Optional[str] = typer.Option(None, "--session", "-s", help="Session ID (default: new UUID)"),
):
    """Interactive AI chat loop. Type 'exit' or 'quit' to end."""
    from hermes.core.ai_hub import AIHub, AIHubError
    from hermes.core.database import AsyncDB

    session_id = session or uuid.uuid4().hex[:8]
    console.print(Panel.fit(
        f"[bold gold1]Hermes Chat[/bold gold1]  |  provider=[cyan1]{provider}[/cyan1]  "
        f"session=[cyan1]{session_id}[/cyan1]\n"
        f"[dim]Type [bold]exit[/bold] or [bold]quit[/bold] to leave.[/dim]",
        border_style=GOLD,
    ))

    async def _chat_loop() -> None:
        db = await _get_db()
        conversation: list[dict[str, str]] = []

        # Load prior history for this session
        prior = await db.get_messages(session_id=session_id)
        for m in prior:
            if m["role"] in ("user", "assistant"):
                conversation.append({"role": m["role"], "content": m["content"]})
        if prior:
            console.print(f"[{DIM}]Loaded {len(prior)} messages from session {session_id}[/{DIM}]")

        async with AIHub() as hub:
            while True:
                try:
                    user_input = Prompt.ask(f"\n[bold {GOLD}]You[/bold {GOLD}]")
                except (EOFError, KeyboardInterrupt):
                    console.print("\n[dim]Goodbye![/dim]")
                    break

                if user_input.strip().lower() in ("exit", "quit", "q"):
                    console.print("[dim]Goodbye![/dim]")
                    break
                if not user_input.strip():
                    continue

                conversation.append({"role": "user", "content": user_input})
                await db.add_message("user", user_input, session_id=session_id)

                with console.status(f"[{DIM}]Thinking…[/{DIM}]", spinner="dots"):
                    try:
                        reply, used_provider = await hub.route_message(
                            conversation, provider=provider
                        )
                    except AIHubError as exc:
                        console.print(f"[{RED}]Error:[/{RED}] {escape(str(exc))}")
                        conversation.pop()  # remove the failed user message
                        continue

                conversation.append({"role": "assistant", "content": reply})
                model_label = "claude-sonnet-4-6" if used_provider == "claude" else "gemini-2.0-flash"
                await db.add_message("assistant", reply, model=model_label, session_id=session_id)

                console.print(Panel(
                    escape(reply),
                    title=f"[bold {CYAN}]{used_provider.title()}[/bold {CYAN}]",
                    border_style=CYAN,
                    padding=(1, 2),
                ))

        await db.close()

    _run(_chat_loop())


# ── pharmacy commands ─────────────────────────────────────────────────────────

@pharmacy_app.command("refill")
def pharmacy_refill(
    patient: str = typer.Option(..., "--patient", help="Patient ID"),
    med: str = typer.Option(..., "--med", help="Medication name and strength"),
    qty: int = typer.Option(..., "--qty", help="Quantity to dispense"),
):
    """Create a new refill request for a patient."""
    from hermes.core.database import AsyncDB
    from hermes.core.pharmacy import PharmacyOps

    async def _refill() -> None:
        db = await _get_db()
        ops = PharmacyOps(db)
        with console.status("[dim]Submitting refill request…[/dim]", spinner="dots"):
            result = await ops.create_refill_request(patient, med, qty)
        await db.close()

        info = Table(box=box.ROUNDED, border_style=GOLD)
        info.add_column("Field", style="bold")
        info.add_column("Value")
        info.add_row("Refill ID", f"[{CYAN}]{result['refill_id']}[/{CYAN}]")
        info.add_row("Patient", result["patient_id"])
        info.add_row("Medication", result["medication"])
        info.add_row("Quantity", str(result["quantity"]))
        info.add_row("Status", f"[{GOLD}]pending[/{GOLD}]")
        info.add_row("Requested at", result["requested_at"])
        console.print(Panel(info, title="[bold green3]Refill Request Created[/bold green3]", border_style=GREEN))

    _run(_refill())


@pharmacy_app.command("list-pending")
def pharmacy_list_pending():
    """List all pending refill requests."""
    from hermes.core.pharmacy import PharmacyOps

    async def _list() -> None:
        db = await _get_db()
        ops = PharmacyOps(db)
        refills = await ops.get_pending_refills()
        await db.close()

        if not refills:
            console.print(Panel("[dim]No pending refills.[/dim]", border_style=GOLD))
            return

        table = Table(title="Pending Refills", box=box.ROUNDED, border_style=GOLD)
        table.add_column("Refill ID", style=CYAN)
        table.add_column("Patient ID")
        table.add_column("Medication")
        table.add_column("Qty", justify="right")
        table.add_column("Requested At", style=DIM)

        for r in refills:
            table.add_row(
                r["refill_id"],
                r["patient_id"],
                r["medication"] or "—",
                str(r["quantity"] or "—"),
                r["requested_at"] or "—",
            )
        console.print(table)

    _run(_list())


@pharmacy_app.command("fill")
def pharmacy_fill(
    refill_id: str = typer.Argument(..., help="Refill ID to mark as filled"),
):
    """Mark a refill as filled/dispensed."""
    from hermes.core.pharmacy import PharmacyOps

    async def _fill() -> None:
        db = await _get_db()
        ops = PharmacyOps(db)
        try:
            with console.status("[dim]Marking refill as filled…[/dim]", spinner="dots"):
                result = await ops.mark_filled(refill_id)
        except ValueError as exc:
            console.print(f"[{RED}]Error:[/{RED}] {escape(str(exc))}")
            await db.close()
            raise typer.Exit(1) from exc
        await db.close()

        console.print(Panel(
            f"[{GREEN}]Refill [bold]{refill_id}[/bold] has been marked as filled.[/{GREEN}]\n"
            f"Filled at: [dim]{result['filled_at']}[/dim]",
            title="[bold green3]Refill Filled[/bold green3]",
            border_style=GREEN,
        ))

    _run(_fill())


@pharmacy_app.command("summary")
def pharmacy_summary():
    """Show today's pharmacy operations summary."""
    from hermes.core.pharmacy import PharmacyOps

    async def _summary() -> None:
        db = await _get_db()
        ops = PharmacyOps(db)
        summary = await ops.get_daily_summary()
        await db.close()

        table = Table(box=box.ROUNDED, border_style=GOLD, show_header=False)
        table.add_column("Metric", style="bold", min_width=25)
        table.add_column("Value", justify="right")
        table.add_row("Pharmacy", summary["pharmacy"])
        table.add_row("Date", summary["date"])
        table.add_row("Pending refills", f"[{GOLD}]{summary['pending_refills']}[/{GOLD}]")
        table.add_row("Filled today", f"[{GREEN}]{summary['filled_today']}[/{GREEN}]")
        table.add_row("Notifications today", str(summary["notifications_today"]))
        table.add_row(
            "Mode",
            f"[{DIM}]demo[/{DIM}]" if summary["mode"] == "demo" else f"[{GREEN}]live[/{GREEN}]",
        )
        console.print(Panel(table, title="[bold gold1]Daily Summary[/bold gold1]", border_style=GOLD))

    _run(_summary())


# ── task commands ─────────────────────────────────────────────────────────────

@task_app.command("add")
def task_add(
    title: str = typer.Option(..., "--title", help="Task title"),
    desc: str = typer.Option("", "--desc", help="Optional description"),
    priority: int = typer.Option(2, "--priority", help="1=Urgent 2=High 3=Medium 4=Low"),
    due: Optional[str] = typer.Option(None, "--due", help="Due date YYYY-MM-DD"),
):
    """Add a new task."""
    from hermes.core.task_runner import TaskRunner

    async def _add() -> None:
        db = await _get_db()
        runner = TaskRunner(db)
        task = await runner.add_task(title, desc, priority, due)
        await db.close()

        label, color = PRIORITY_LABELS.get(priority, ("Unknown", DIM))
        console.print(Panel(
            f"[bold]#{task['id']}[/bold]  {escape(title)}\n"
            f"Priority: [{color}]{label}[/{color}]"
            + (f"  |  Due: [gold1]{due}[/gold1]" if due else ""),
            title="[bold green3]Task Created[/bold green3]",
            border_style=GREEN,
        ))

    _run(_add())


@task_app.command("list")
def task_list(
    status: Optional[str] = typer.Option(None, "--status", help="pending | done | cancelled"),
    priority: Optional[int] = typer.Option(None, "--priority", help="1–4"),
):
    """List tasks, optionally filtered by status and/or priority."""
    from hermes.core.task_runner import TaskRunner

    async def _list() -> None:
        db = await _get_db()
        runner = TaskRunner(db)
        tasks = await runner.list_tasks(status=status, priority=priority)
        await db.close()

        if not tasks:
            console.print(Panel("[dim]No tasks found.[/dim]", border_style=GOLD))
            return

        table = Table(
            title="Tasks",
            box=box.ROUNDED,
            border_style=GOLD,
            show_lines=True,
        )
        table.add_column("ID", style="bold", width=5, justify="right")
        table.add_column("Priority", width=10)
        table.add_column("Title")
        table.add_column("Status", width=12)
        table.add_column("Due", width=12)
        table.add_column("Description")

        for t in tasks:
            p = t.get("priority", 3)
            label, color = PRIORITY_LABELS.get(p, ("?", DIM))
            stat = t.get("status", "pending")
            stat_styled = (
                f"[{GREEN}]{stat}[/{GREEN}]" if stat == "done"
                else f"[{GOLD}]{stat}[/{GOLD}]" if stat == "pending"
                else f"[{DIM}]{stat}[/{DIM}]"
            )
            table.add_row(
                str(t["id"]),
                f"[{color}]{label}[/{color}]",
                escape(t.get("title", "")),
                stat_styled,
                t.get("due_date") or "[dim]—[/dim]",
                escape(t.get("description", "")[:60]),
            )
        console.print(table)

    _run(_list())


@task_app.command("done")
def task_done(
    task_id: int = typer.Argument(..., help="Task ID to mark as complete"),
):
    """Mark a task as done."""
    from hermes.core.task_runner import TaskRunner

    async def _done() -> None:
        db = await _get_db()
        runner = TaskRunner(db)
        updated = await runner.complete_task(task_id)
        await db.close()

        if updated:
            console.print(Panel(
                f"[{GREEN}]Task #{task_id} marked as done.[/{GREEN}]",
                border_style=GREEN,
            ))
        else:
            console.print(f"[{RED}]Task #{task_id} not found.[/{RED}]")
            raise typer.Exit(1)

    _run(_done())


@task_app.command("overdue")
def task_overdue():
    """List all overdue pending tasks."""
    from hermes.core.task_runner import TaskRunner

    async def _overdue() -> None:
        db = await _get_db()
        runner = TaskRunner(db)
        tasks = await runner.get_overdue_tasks()
        await db.close()

        if not tasks:
            console.print(Panel(f"[{GREEN}]No overdue tasks![/{GREEN}]", border_style=GREEN))
            return

        table = Table(
            title=f"[bold {RED}]Overdue Tasks[/bold {RED}]",
            box=box.ROUNDED,
            border_style=RED,
            show_lines=True,
        )
        table.add_column("ID", style="bold", width=5, justify="right")
        table.add_column("Priority", width=10)
        table.add_column("Title")
        table.add_column("Due Date", style=RED)
        table.add_column("Description")

        for t in tasks:
            p = t.get("priority", 3)
            label, color = PRIORITY_LABELS.get(p, ("?", DIM))
            table.add_row(
                str(t["id"]),
                f"[{color}]{label}[/{color}]",
                escape(t.get("title", "")),
                t.get("due_date", "—"),
                escape(t.get("description", "")[:60]),
            )
        console.print(table)

    _run(_overdue())


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app()
