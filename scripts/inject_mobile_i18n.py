"""Inject push_prompt + guest auth keys into mobile locale TS files."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCALE_DIR = ROOT / "mobile" / "src" / "locales"

FALLBACK = {
    "push_prompt.title": "Stay ahead of the air",
    "push_prompt.body": (
        "Allow notifications so Mframapa can tip you when air quality "
        "changes near you — and share a daily Did you know."
    ),
    "push_prompt.allow": "Allow",
    "push_prompt.not_now": "Not now",
    "screen.auth.continue_without_account": "Continue without account",
}

TRANSLATIONS: dict[str, dict[str, str]] = {
    "fr": {
        "push_prompt.title": "Restez informé de l'air",
        "push_prompt.body": (
            "Autorisez les notifications pour les alertes de qualité de l'air "
            "et le conseil du jour."
        ),
        "push_prompt.allow": "Autoriser",
        "push_prompt.not_now": "Pas maintenant",
        "screen.auth.continue_without_account": "Continuer sans compte",
    },
    "es": {
        "push_prompt.title": "Adelántate al aire",
        "push_prompt.body": (
            "Permite notificaciones para alertas de calidad del aire y el dato del día."
        ),
        "push_prompt.allow": "Permitir",
        "push_prompt.not_now": "Ahora no",
        "screen.auth.continue_without_account": "Continuar sin cuenta",
    },
    "pt": {
        "push_prompt.title": "Fique à frente do ar",
        "push_prompt.body": (
            "Permita notificações para alertas de qualidade do ar e a dica do dia."
        ),
        "push_prompt.allow": "Permitir",
        "push_prompt.not_now": "Agora não",
        "screen.auth.continue_without_account": "Continuar sem conta",
    },
    "ar": {
        "push_prompt.title": "ابقَ على اطلاع بالهواء",
        "push_prompt.body": "اسمح بالإشعارات لتنبيهات جودة الهواء ونصيحة اليوم.",
        "push_prompt.allow": "السماح",
        "push_prompt.not_now": "ليس الآن",
        "screen.auth.continue_without_account": "المتابعة بدون حساب",
    },
    "sw": {
        "push_prompt.title": "Kuwa mbele ya hewa",
        "push_prompt.body": (
            "Ruhusu arifa kwa tahadhari za ubora wa hewa na kidokezo cha kila siku."
        ),
        "push_prompt.allow": "Ruhusu",
        "push_prompt.not_now": "Sio sasa",
        "screen.auth.continue_without_account": "Endelea bila akaunti",
    },
}


def _escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def main() -> None:
    updated = 0
    for path in sorted(LOCALE_DIR.glob("*.ts")):
        if path.name == "en.ts":
            continue
        lang = path.stem
        text = path.read_text(encoding="utf-8")
        patch = {**FALLBACK, **TRANSLATIONS.get(lang, {})}
        missing = {k: v for k, v in patch.items() if f"'{k}'" not in text}
        if not missing:
            continue
        lines = [f"  '{k}': '{_escape(v)}'," for k, v in missing.items()]
        block = "\n  // injected critical keys\n" + "\n".join(lines) + "\n"
        new_text, n = re.subn(r"\n\};\s*\nexport default", block + "};\n\nexport default", text, count=1)
        if n != 1:
            print(f"skip (pattern miss): {path.name}")
            continue
        path.write_text(new_text, encoding="utf-8")
        updated += 1
        print(f"updated {path.name} (+{len(missing)})")
    print(f"done: {updated} locale files")


if __name__ == "__main__":
    main()
