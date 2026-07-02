"""
Hermes — ProCare Pharmacy Operations Automation.

All operations are persisted to the pharmacy_events table.
When PHARMACY_WEBHOOK_URL is not set, the module runs in demo/mock mode
and prints notifications to stdout instead of POSTing to a webhook.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime
from typing import Any, Optional

import httpx

from hermes.core.config import settings
from hermes.core.database import AsyncDB

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


class PharmacyOps:
    """High-level ProCare Pharmacy operations."""

    def __init__(self, db: AsyncDB) -> None:
        self._db = db
        self._mock = not bool(settings.pharmacy_webhook_url)
        if self._mock:
            logger.info("PharmacyOps running in DEMO/MOCK mode (no webhook configured).")

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _refill_id(self) -> str:
        return f"REFILL-{uuid.uuid4().hex[:8].upper()}"

    async def _webhook(self, payload: dict[str, Any]) -> None:
        """POST payload to the configured webhook, or log it in mock mode."""
        if self._mock:
            logger.info("[MOCK WEBHOOK] %s", json.dumps(payload, indent=2))
            return
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.post(
                    settings.pharmacy_webhook_url,  # type: ignore[arg-type]
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                resp.raise_for_status()
                logger.debug("Webhook delivered: HTTP %d", resp.status_code)
            except httpx.HTTPError as exc:
                logger.error("Webhook delivery failed: %s", exc)

    # ── Refill management ─────────────────────────────────────────────────────

    async def create_refill_request(
        self,
        patient_id: str,
        medication: str,
        quantity: int,
    ) -> dict[str, Any]:
        """
        Create and log a new refill request.

        Returns a dict representing the new refill record.
        """
        refill_id = self._refill_id()
        details: dict[str, Any] = {
            "refill_id": refill_id,
            "medication": medication,
            "quantity": quantity,
            "status": "pending",
            "requested_at": _now(),
            "pharmacy": settings.pharmacy_name,
        }
        event_id = await self._db.add_pharmacy_event(
            event_type="refill_created",
            patient_id=patient_id,
            details=details,
        )
        details["event_id"] = event_id
        details["patient_id"] = patient_id

        await self._webhook({
            "event": "refill_created",
            "patient_id": patient_id,
            **details,
        })

        logger.info("Refill %s created for patient %s (%s x%d)", refill_id, patient_id, medication, quantity)
        return details

    async def get_pending_refills(self) -> list[dict[str, Any]]:
        """Return all refill_created events that have not been matched by a refill_filled event."""
        created = await self._db.get_pharmacy_events(event_type="refill_created")
        filled = await self._db.get_pharmacy_events(event_type="refill_filled")
        filled_ids = {e["details"].get("refill_id") for e in filled}

        pending: list[dict[str, Any]] = []
        for evt in created:
            rid = evt["details"].get("refill_id")
            if rid and rid not in filled_ids:
                pending.append({
                    "refill_id": rid,
                    "patient_id": evt["patient_id"],
                    "medication": evt["details"].get("medication"),
                    "quantity": evt["details"].get("quantity"),
                    "requested_at": evt["details"].get("requested_at"),
                    "event_id": evt["id"],
                })
        return pending

    async def mark_filled(self, refill_id: str) -> dict[str, Any]:
        """
        Mark a refill as filled.

        Returns the fill-event record, or raises ValueError if refill not found.
        """
        pending = await self.get_pending_refills()
        match = next((r for r in pending if r["refill_id"] == refill_id), None)
        if not match:
            raise ValueError(f"No pending refill found with ID '{refill_id}'.")

        details: dict[str, Any] = {
            "refill_id": refill_id,
            "filled_at": _now(),
            "medication": match.get("medication"),
            "quantity": match.get("quantity"),
            "pharmacy": settings.pharmacy_name,
        }
        event_id = await self._db.add_pharmacy_event(
            event_type="refill_filled",
            patient_id=match["patient_id"],
            details=details,
        )
        details["event_id"] = event_id

        await self._webhook({
            "event": "refill_filled",
            "patient_id": match["patient_id"],
            **details,
        })

        logger.info("Refill %s marked as filled.", refill_id)
        return details

    # ── Patient notifications ─────────────────────────────────────────────────

    async def send_patient_notification(
        self,
        patient_id: str,
        message: str,
    ) -> dict[str, Any]:
        """Send (or mock) a notification message to a patient."""
        details: dict[str, Any] = {
            "message": message,
            "sent_at": _now(),
            "channel": "webhook" if not self._mock else "mock",
            "pharmacy": settings.pharmacy_name,
        }
        event_id = await self._db.add_pharmacy_event(
            event_type="notification_sent",
            patient_id=patient_id,
            details=details,
        )
        details["event_id"] = event_id
        details["patient_id"] = patient_id

        if self._mock:
            print(f"\n[MOCK SMS → Patient {patient_id}] {message}\n")
        else:
            await self._webhook({
                "event": "notification_sent",
                "patient_id": patient_id,
                **details,
            })

        logger.info("Notification sent to patient %s.", patient_id)
        return details

    # ── Daily summary ─────────────────────────────────────────────────────────

    async def get_daily_summary(self) -> dict[str, Any]:
        """
        Return a summary dict with today's activity counts.

        Keys: pending_refills, filled_today, notifications_today, pharmacy, date
        """
        today = datetime.utcnow().date().isoformat()

        pending = await self.get_pending_refills()
        all_filled = await self._db.get_pharmacy_events(event_type="refill_filled")
        all_notifs = await self._db.get_pharmacy_events(event_type="notification_sent")

        filled_today = [
            e for e in all_filled
            if e.get("timestamp", "").startswith(today)
        ]
        notifs_today = [
            e for e in all_notifs
            if e.get("timestamp", "").startswith(today)
        ]

        return {
            "pharmacy": settings.pharmacy_name,
            "date": today,
            "pending_refills": len(pending),
            "filled_today": len(filled_today),
            "notifications_today": len(notifs_today),
            "mode": "demo" if self._mock else "live",
        }
