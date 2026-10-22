"""
Hermes TaskRunner — priority-based personal / operational task management.

Priority levels
---------------
1 = Urgent
2 = High
3 = Medium
4 = Low
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any, Optional

from hermes.core.database import AsyncDB

logger = logging.getLogger(__name__)

PRIORITY_LABELS = {1: "Urgent", 2: "High", 3: "Medium", 4: "Low"}


def _today() -> str:
    return date.today().isoformat()


def _now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


class TaskRunner:
    """Manages tasks stored in the Hermes SQLite database."""

    def __init__(self, db: AsyncDB) -> None:
        self._db = db

    # ── Create ─────────────────────────────────────────────────────────────────

    async def add_task(
        self,
        title: str,
        description: str = "",
        priority: int = 2,
        due_date: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Add a new task.

        Parameters
        ----------
        title       : short task title
        description : optional longer description
        priority    : 1=Urgent, 2=High, 3=Medium, 4=Low
        due_date    : ISO date string, e.g. '2026-06-10' (optional)

        Returns the newly created task record as a dict.
        """
        if priority not in PRIORITY_LABELS:
            raise ValueError(f"priority must be 1–4, got {priority}")

        task_id = await self._db.add_task(
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
        )
        logger.info("Task #%d created: '%s' (priority=%d)", task_id, title, priority)

        return {
            "id": task_id,
            "title": title,
            "description": description,
            "status": "pending",
            "priority": priority,
            "priority_label": PRIORITY_LABELS[priority],
            "due_date": due_date,
            "created_at": _now(),
            "completed_at": None,
        }

    # ── Read ───────────────────────────────────────────────────────────────────

    async def list_tasks(
        self,
        status: Optional[str] = None,
        priority: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """
        Return tasks, optionally filtered by status and/or priority.

        status   : 'pending' | 'done' | 'cancelled' | None (all)
        priority : 1–4 | None (all)
        """
        tasks = await self._db.get_tasks(status=status, priority=priority)
        for t in tasks:
            t["priority_label"] = PRIORITY_LABELS.get(t.get("priority", 3), "Unknown")
        return tasks

    async def get_overdue_tasks(self) -> list[dict[str, Any]]:
        """Return all pending tasks whose due_date is before today."""
        today = _today()
        tasks = await self._db.get_tasks(status="pending")
        overdue = [
            t for t in tasks
            if t.get("due_date") and t["due_date"] < today
        ]
        for t in overdue:
            t["priority_label"] = PRIORITY_LABELS.get(t.get("priority", 3), "Unknown")
        return overdue

    # ── Update ─────────────────────────────────────────────────────────────────

    async def complete_task(self, task_id: int) -> bool:
        """
        Mark a task as done.

        Returns True if the task was found and updated, False otherwise.
        """
        updated = await self._db.update_task(
            task_id,
            status="done",
            completed_at=_now(),
        )
        if updated:
            logger.info("Task #%d marked as done.", task_id)
        else:
            logger.warning("Task #%d not found.", task_id)
        return updated

    async def update_task(
        self,
        task_id: int,
        **fields: Any,
    ) -> bool:
        """Update arbitrary fields on a task. Returns True if a row was changed."""
        # Validate priority if provided
        if "priority" in fields and fields["priority"] not in PRIORITY_LABELS:
            raise ValueError(f"priority must be 1–4, got {fields['priority']}")
        return await self._db.update_task(task_id, **fields)

    # ── Scheduled check ────────────────────────────────────────────────────────

    async def run_scheduled(self) -> dict[str, Any]:
        """
        Check for overdue and due-today tasks.

        Logs alerts and returns a summary dict:
          {overdue: [...], due_today: [...], alert_count: int}
        """
        today = _today()
        all_pending = await self._db.get_tasks(status="pending")

        overdue: list[dict[str, Any]] = []
        due_today: list[dict[str, Any]] = []

        for task in all_pending:
            task["priority_label"] = PRIORITY_LABELS.get(task.get("priority", 3), "Unknown")
            dd = task.get("due_date")
            if not dd:
                continue
            if dd < today:
                overdue.append(task)
                logger.warning(
                    "[OVERDUE] Task #%d '%s' was due %s", task["id"], task["title"], dd
                )
            elif dd == today:
                due_today.append(task)
                logger.info(
                    "[DUE TODAY] Task #%d '%s'", task["id"], task["title"]
                )

        alert_count = len(overdue) + len(due_today)
        if alert_count == 0:
            logger.info("Scheduled check: no overdue or due-today tasks.")

        return {
            "overdue": overdue,
            "due_today": due_today,
            "alert_count": alert_count,
            "checked_at": _now(),
        }
