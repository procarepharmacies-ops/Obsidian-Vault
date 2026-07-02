"""
Hermes async SQLite database manager.

Tables
------
messages        — AI conversation history
tasks           — Personal / operational tasks
pharmacy_events — ProCare pharmacy operation log
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import aiosqlite

from hermes.core.config import settings

logger = logging.getLogger(__name__)

# ── Schema DDL ───────────────────────────────────────────────────────────────

_CREATE_MESSAGES = """
CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    role        TEXT    NOT NULL,          -- 'user' | 'assistant' | 'system'
    content     TEXT    NOT NULL,
    model       TEXT,                      -- e.g. 'claude-sonnet-4-6'
    session_id  TEXT    NOT NULL DEFAULT 'default',
    timestamp   TEXT    NOT NULL
)
"""

_CREATE_TASKS = """
CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    description  TEXT    DEFAULT '',
    status       TEXT    NOT NULL DEFAULT 'pending',   -- pending | done | cancelled
    priority     INTEGER NOT NULL DEFAULT 2,           -- 1=urgent 2=high 3=medium 4=low
    due_date     TEXT,
    created_at   TEXT    NOT NULL,
    completed_at TEXT
)
"""

_CREATE_PHARMACY_EVENTS = """
CREATE TABLE IF NOT EXISTS pharmacy_events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type   TEXT    NOT NULL,   -- refill_created | refill_filled | notification_sent | ...
    patient_id   TEXT    NOT NULL,
    details_json TEXT    NOT NULL DEFAULT '{}',
    timestamp    TEXT    NOT NULL
)
"""

_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status)",
    "CREATE INDEX IF NOT EXISTS idx_pharmacy_type    ON pharmacy_events(event_type)",
    "CREATE INDEX IF NOT EXISTS idx_pharmacy_patient ON pharmacy_events(patient_id)",
]


def _now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


class AsyncDB:
    """Async wrapper around an aiosqlite connection pool (single-file SQLite)."""

    def __init__(self, db_path: Optional[Path] = None) -> None:
        self._path = db_path or settings.db_path_expanded
        self._conn: Optional[aiosqlite.Connection] = None

    # ── Lifecycle ────────────────────────────────────────────────────────────

    async def initialize(self) -> None:
        """Create the database file and all tables if they don't exist."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = await aiosqlite.connect(str(self._path))
        self._conn.row_factory = aiosqlite.Row
        await self._conn.execute("PRAGMA journal_mode=WAL")
        await self._conn.execute("PRAGMA foreign_keys=ON")
        for ddl in (_CREATE_MESSAGES, _CREATE_TASKS, _CREATE_PHARMACY_EVENTS):
            await self._conn.execute(ddl)
        for idx in _INDEXES:
            await self._conn.execute(idx)
        await self._conn.commit()
        logger.debug("Database initialised at %s", self._path)

    async def close(self) -> None:
        if self._conn:
            await self._conn.close()
            self._conn = None

    def _require(self) -> aiosqlite.Connection:
        if self._conn is None:
            raise RuntimeError("Database not initialised — call await db.initialize() first.")
        return self._conn

    # ── Messages ─────────────────────────────────────────────────────────────

    async def add_message(
        self,
        role: str,
        content: str,
        model: Optional[str] = None,
        session_id: str = "default",
    ) -> int:
        conn = self._require()
        cur = await conn.execute(
            "INSERT INTO messages (role, content, model, session_id, timestamp) "
            "VALUES (?, ?, ?, ?, ?)",
            (role, content, model, session_id, _now()),
        )
        await conn.commit()
        return cur.lastrowid  # type: ignore[return-value]

    async def get_messages(
        self,
        session_id: str = "default",
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        conn = self._require()
        async with conn.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?",
            (session_id, limit),
        ) as cur:
            rows = await cur.fetchall()
        return [dict(r) for r in reversed(rows)]

    # ── Tasks ─────────────────────────────────────────────────────────────────

    async def add_task(
        self,
        title: str,
        description: str = "",
        priority: int = 2,
        due_date: Optional[str] = None,
    ) -> int:
        conn = self._require()
        cur = await conn.execute(
            "INSERT INTO tasks (title, description, status, priority, due_date, created_at) "
            "VALUES (?, ?, 'pending', ?, ?, ?)",
            (title, description, priority, due_date, _now()),
        )
        await conn.commit()
        return cur.lastrowid  # type: ignore[return-value]

    async def get_tasks(
        self,
        status: Optional[str] = None,
        priority: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        conn = self._require()
        clauses: list[str] = []
        params: list[Any] = []
        if status:
            clauses.append("status = ?")
            params.append(status)
        if priority is not None:
            clauses.append("priority = ?")
            params.append(priority)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        async with conn.execute(
            f"SELECT * FROM tasks {where} ORDER BY priority ASC, due_date ASC NULLS LAST",
            params,
        ) as cur:
            rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def update_task(self, task_id: int, **fields: Any) -> bool:
        """Update arbitrary task fields by keyword. Returns True if a row was changed."""
        if not fields:
            return False
        conn = self._require()
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        params = list(fields.values()) + [task_id]
        cur = await conn.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = ?", params
        )
        await conn.commit()
        return cur.rowcount > 0

    # ── Pharmacy Events ───────────────────────────────────────────────────────

    async def add_pharmacy_event(
        self,
        event_type: str,
        patient_id: str,
        details: dict[str, Any],
    ) -> int:
        conn = self._require()
        cur = await conn.execute(
            "INSERT INTO pharmacy_events (event_type, patient_id, details_json, timestamp) "
            "VALUES (?, ?, ?, ?)",
            (event_type, patient_id, json.dumps(details), _now()),
        )
        await conn.commit()
        return cur.lastrowid  # type: ignore[return-value]

    async def get_pharmacy_events(
        self,
        event_type: Optional[str] = None,
        patient_id: Optional[str] = None,
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        conn = self._require()
        clauses: list[str] = []
        params: list[Any] = []
        if event_type:
            clauses.append("event_type = ?")
            params.append(event_type)
        if patient_id:
            clauses.append("patient_id = ?")
            params.append(patient_id)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        params.append(limit)
        async with conn.execute(
            f"SELECT * FROM pharmacy_events {where} ORDER BY id DESC LIMIT ?",
            params,
        ) as cur:
            rows = await cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["details"] = json.loads(d.pop("details_json", "{}"))
            result.append(d)
        return result
