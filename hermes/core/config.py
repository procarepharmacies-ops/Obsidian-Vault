"""
Hermes configuration — loaded from environment / .env file.
Priority: environment variables > ~/.hermes/.env > .env in cwd
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class HermesSettings(BaseSettings):
    """All runtime settings for Hermes, sourced from environment / .env."""

    model_config = SettingsConfigDict(
        # Look for .env in ~/.hermes/ first, then cwd
        env_file=(
            str(Path.home() / ".hermes" / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── AI Provider Keys ────────────────────────────────────────────────────
    anthropic_api_key: Optional[str] = Field(
        default=None,
        description="Anthropic API key for Claude models.",
    )
    gemini_api_key: Optional[str] = Field(
        default=None,
        description="Google AI API key for Gemini models.",
    )

    # ── Hermes Core ─────────────────────────────────────────────────────────
    hermes_db_path: Path = Field(
        default=Path.home() / ".hermes" / "hermes.db",
        description="Path to the SQLite database file.",
    )
    hermes_log_level: str = Field(
        default="INFO",
        description="Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL.",
    )

    # ── Pharmacy ────────────────────────────────────────────────────────────
    pharmacy_name: str = Field(
        default="ProCare Pharmacy",
        description="Display name of the pharmacy.",
    )
    pharmacy_webhook_url: Optional[str] = Field(
        default=None,
        description="Webhook URL for pharmacy notification integration. "
                    "Leave blank to use demo/mock mode.",
    )

    # ── Derived helpers ──────────────────────────────────────────────────────
    @property
    def has_claude(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def has_gemini(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def available_providers(self) -> list[str]:
        providers: list[str] = []
        if self.has_claude:
            providers.append("claude")
        if self.has_gemini:
            providers.append("gemini")
        return providers

    @property
    def db_path_expanded(self) -> Path:
        return Path(os.path.expanduser(str(self.hermes_db_path)))


# Module-level singleton — import and use directly:
#   from hermes.core.config import settings
settings = HermesSettings()
