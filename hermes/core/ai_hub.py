"""
Hermes AI Hub — multi-provider message routing.

Supported providers
-------------------
claude  — Anthropic API via the official `anthropic` Python SDK
gemini  — Google Gemini REST API via httpx

Auto-routing picks the first available provider in order: claude → gemini.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

from hermes.core.config import settings

logger = logging.getLogger(__name__)

# ── Type alias ────────────────────────────────────────────────────────────────
Message = dict[str, str]  # {"role": "user"|"assistant", "content": "..."}


class AIHubError(Exception):
    """Raised when all configured providers fail or none are available."""


class AIHub:
    """Manages connections to multiple AI providers and routes messages."""

    GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self) -> None:
        self._anthropic_client: Any = None
        self._http: Optional[httpx.AsyncClient] = None

    # ── Lifecycle ────────────────────────────────────────────────────────────

    async def __aenter__(self) -> "AIHub":
        await self.open()
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self.close()

    async def open(self) -> None:
        self._http = httpx.AsyncClient(timeout=60.0)
        if settings.has_claude:
            try:
                import anthropic  # lazy import so missing package is clear
                self._anthropic_client = anthropic.AsyncAnthropic(
                    api_key=settings.anthropic_api_key
                )
            except ImportError:
                logger.warning("anthropic package not installed — Claude unavailable.")

    async def close(self) -> None:
        if self._http:
            await self._http.aclose()
            self._http = None

    # ── Provider availability ────────────────────────────────────────────────

    def get_available_providers(self) -> list[str]:
        """Return a list of provider names that are currently configured."""
        providers: list[str] = []
        if self._anthropic_client and settings.has_claude:
            providers.append("claude")
        if settings.has_gemini:
            providers.append("gemini")
        return providers

    # ── Claude ───────────────────────────────────────────────────────────────

    async def chat_claude(
        self,
        messages: list[Message],
        model: str = "claude-sonnet-4-6",
        max_tokens: int = 4096,
        system: Optional[str] = None,
    ) -> str:
        """Send messages to Claude and return the assistant reply as a string."""
        if not self._anthropic_client:
            raise AIHubError("Claude is not configured (missing ANTHROPIC_API_KEY or anthropic package).")

        # Anthropic SDK expects messages without a system role entry —
        # system prompt is passed separately.
        sdk_messages = [
            {"role": m["role"], "content": m["content"]}
            for m in messages
            if m["role"] in ("user", "assistant")
        ]

        kwargs: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": sdk_messages,
        }
        if system:
            kwargs["system"] = system

        response = await self._anthropic_client.messages.create(**kwargs)
        text: str = response.content[0].text
        logger.debug("Claude (%s) replied (%d chars)", model, len(text))
        return text

    # ── Gemini ───────────────────────────────────────────────────────────────

    async def chat_gemini(
        self,
        messages: list[Message],
        model: str = "gemini-2.0-flash",
    ) -> str:
        """Send messages to Gemini and return the assistant reply as a string."""
        if not settings.has_gemini:
            raise AIHubError("Gemini is not configured (missing GEMINI_API_KEY).")
        if not self._http:
            raise AIHubError("AIHub not opened — use `async with AIHub()` or call open().")

        # Convert to Gemini's `contents` format
        contents: list[dict[str, Any]] = []
        for m in messages:
            role = "model" if m["role"] == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})

        url = (
            f"{self.GEMINI_API_BASE}/models/{model}:generateContent"
            f"?key={settings.gemini_api_key}"
        )
        payload = {"contents": contents}
        resp = await self._http.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

        try:
            text: str = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            raise AIHubError(f"Unexpected Gemini response structure: {data}") from exc

        logger.debug("Gemini (%s) replied (%d chars)", model, len(text))
        return text

    # ── Auto-routing ──────────────────────────────────────────────────────────

    async def _chat_demo(self, messages: list[Message]) -> str:
        """Demo mode — echoes back a helpful reply when no providers are configured."""
        last = messages[-1]["content"] if messages else ""
        return (
            f"[Demo Mode] Hermes received: \"{last[:80]}{'…' if len(last) > 80 else ''}\"\n\n"
            "No API keys are configured yet. To enable real AI responses:\n"
            "  1. Edit ~/.hermes/.env\n"
            "  2. Add ANTHROPIC_API_KEY=sk-ant-... for Claude\n"
            "  3. Or add GEMINI_API_KEY=AIza... for Gemini\n"
            "  4. Restart phermes chat\n\n"
            "All other features (pharmacy, tasks, status) work fully in demo mode."
        )

    async def route_message(
        self,
        messages: list[Message],
        provider: str = "auto",
        **kwargs: Any,
    ) -> tuple[str, str]:
        """
        Route messages to the best available provider.

        Parameters
        ----------
        messages : list of role/content dicts
        provider : 'auto' | 'claude' | 'gemini'
        **kwargs : forwarded to the provider-specific method

        Returns
        -------
        (reply_text, provider_used)
        """
        if provider == "claude":
            if not settings.has_claude:
                return await self._chat_demo(messages), "demo"
            return await self.chat_claude(messages, **kwargs), "claude"
        if provider == "gemini":
            if not settings.has_gemini:
                return await self._chat_demo(messages), "demo"
            return await self.chat_gemini(messages, **kwargs), "gemini"

        # auto — try in order of preference
        available = self.get_available_providers()
        if not available:
            # Fall back to demo mode so Hermes works without any API keys
            return await self._chat_demo(messages), "demo"

        last_error: Optional[Exception] = None
        for prov in available:
            try:
                if prov == "claude":
                    reply = await self.chat_claude(messages, **kwargs)
                else:
                    reply = await self.chat_gemini(messages, **kwargs)
                return reply, prov
            except Exception as exc:  # noqa: BLE001
                logger.warning("Provider %s failed: %s", prov, exc)
                last_error = exc

        raise AIHubError(f"All providers failed. Last error: {last_error}") from last_error
