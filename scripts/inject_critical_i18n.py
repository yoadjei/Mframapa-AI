"""Inject critical missing UI strings into all PWA locale JSON files.

Fills notif_prefs category labels + profile account_actions so non-English
bundles do not rely solely on runtime EN fallback. Values are natural
short translations for major languages; others use clear EN until the
full translation agent run merges richer copy.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCALE_DIR = ROOT / "frontend-pwa" / "src" / "locales"

# lang -> { key: value }
TRANSLATIONS: dict[str, dict[str, str]] = {
    "fr": {
        "notif_prefs.air_quality_alerts": "Alertes qualité de l'air",
        "notif_prefs.daily_summaries": "Résumés quotidiens",
        "notif_prefs.air_quality_updates": "Mises à jour qualité de l'air",
        "notif_prefs.tips_and_guidance": "Conseils et guidance",
        "notif_prefs.nothing_unread": "Rien de non lu",
        "screen.profile.account_actions": "Compte",
        "screen.country.rural_cities": "Rural",
        "install.title": "Ajouter Mframapa à l'écran d'accueil",
        "install.subtitle": "Installez pour un accès rapide, hors ligne et les alertes.",
        "install.cta": "Installer sur l'écran d'accueil",
        "install.not_now": "Pas maintenant",
        "install.menu": "Installer l'application",
        "push_prompt.title": "Restez informé de l'air",
        "push_prompt.body": "Autorisez les notifications pour les alertes de qualité de l'air et le conseil du jour.",
        "push_prompt.allow": "Autoriser",
        "push_prompt.not_now": "Pas maintenant",
    },
    "es": {
        "notif_prefs.air_quality_alerts": "Alertas de calidad del aire",
        "notif_prefs.daily_summaries": "Resúmenes diarios",
        "notif_prefs.air_quality_updates": "Actualizaciones de calidad del aire",
        "notif_prefs.tips_and_guidance": "Consejos y orientación",
        "notif_prefs.nothing_unread": "Nada sin leer",
        "screen.profile.account_actions": "Cuenta",
        "screen.country.rural_cities": "Rural",
        "install.title": "Añade Mframapa a tu pantalla de inicio",
        "install.subtitle": "Instala para acceso rápido, uso sin conexión y alertas.",
        "install.cta": "Instalar en la pantalla de inicio",
        "install.not_now": "Ahora no",
        "install.menu": "Instalar app",
        "push_prompt.title": "Adelántate al aire",
        "push_prompt.body": "Permite notificaciones para alertas de calidad del aire y el dato del día.",
        "push_prompt.allow": "Permitir",
        "push_prompt.not_now": "Ahora no",
    },
    "pt": {
        "notif_prefs.air_quality_alerts": "Alertas de qualidade do ar",
        "notif_prefs.daily_summaries": "Resumos diários",
        "notif_prefs.air_quality_updates": "Atualizações da qualidade do ar",
        "notif_prefs.tips_and_guidance": "Dicas e orientação",
        "notif_prefs.nothing_unread": "Nada por ler",
        "screen.profile.account_actions": "Conta",
        "screen.country.rural_cities": "Rural",
        "install.title": "Adicione o Mframapa ao ecrã inicial",
        "install.subtitle": "Instale para acesso rápido, offline e alertas.",
        "install.cta": "Instalar no ecrã inicial",
        "install.not_now": "Agora não",
        "install.menu": "Instalar aplicação",
        "push_prompt.title": "Fique à frente do ar",
        "push_prompt.body": "Permita notificações para alertas de qualidade do ar e a dica do dia.",
        "push_prompt.allow": "Permitir",
        "push_prompt.not_now": "Agora não",
    },
    "ar": {
        "notif_prefs.air_quality_alerts": "تنبيهات جودة الهواء",
        "notif_prefs.daily_summaries": "ملخصات يومية",
        "notif_prefs.air_quality_updates": "تحديثات جودة الهواء",
        "notif_prefs.tips_and_guidance": "نصائح وإرشاد",
        "notif_prefs.nothing_unread": "لا يوجد غير مقروء",
        "screen.profile.account_actions": "الحساب",
        "screen.country.rural_cities": "ريفي",
        "install.title": "أضف مفرامابا إلى الشاشة الرئيسية",
        "install.subtitle": "ثبّت للوصول السريع والعمل دون اتصال والتنبيهات.",
        "install.cta": "تثبيت على الشاشة الرئيسية",
        "install.not_now": "ليس الآن",
        "install.menu": "تثبيت التطبيق",
        "push_prompt.title": "ابقَ على اطلاع بالهواء",
        "push_prompt.body": "اسمح بالإشعارات لتنبيهات جودة الهواء ونصيحة اليوم.",
        "push_prompt.allow": "السماح",
        "push_prompt.not_now": "ليس الآن",
    },
    "sw": {
        "notif_prefs.air_quality_alerts": "Tahadhari za ubora wa hewa",
        "notif_prefs.daily_summaries": "Muhtasari wa kila siku",
        "notif_prefs.air_quality_updates": "Sasisho za ubora wa hewa",
        "notif_prefs.tips_and_guidance": "Vidokezo na mwongozo",
        "notif_prefs.nothing_unread": "Hakuna visivyosomwa",
        "screen.profile.account_actions": "Akaunti",
        "screen.country.rural_cities": "Vijijini",
        "install.title": "Ongeza Mframapa kwenye skrini ya mwanzo",
        "install.subtitle": "Sakinisha kwa ufikiaji wa haraka, nje ya mtandao, na tahadhari.",
        "install.cta": "Sakinisha kwenye skrini ya mwanzo",
        "install.not_now": "Sio sasa",
        "install.menu": "Sakinisha programu",
        "push_prompt.title": "Kuwa mbele ya hewa",
        "push_prompt.body": "Ruhusu arifa kwa tahadhari za ubora wa hewa na kidokezo cha kila siku.",
        "push_prompt.allow": "Ruhusu",
        "push_prompt.not_now": "Sio sasa",
    },
    "ha": {
        "notif_prefs.air_quality_alerts": "Faɗakarwa kan ingancin iska",
        "notif_prefs.daily_summaries": "Taƙaitaccen yau da kullum",
        "notif_prefs.air_quality_updates": "Sabuntawa kan ingancin iska",
        "notif_prefs.tips_and_guidance": "Shawarwari da jagora",
        "notif_prefs.nothing_unread": "Babu wanda ba duba ba",
        "screen.profile.account_actions": "Asusu",
        "screen.country.rural_cities": "Kauye",
        "install.title": "Ƙara Mframapa a allon gida",
        "install.subtitle": "Shigar don samun dama da sauri, offline, da faɗakarwa.",
        "install.cta": "Shigar a allon gida",
        "install.not_now": "Ba yanzu ba",
        "install.menu": "Shigar da app",
        "push_prompt.title": "Kasance a gaban iska",
        "push_prompt.body": "Bada izinin sanarwa don faɗakarwar ingancin iska da shawarar yau.",
        "push_prompt.allow": "Bada izini",
        "push_prompt.not_now": "Ba yanzu ba",
    },
    "yo": {
        "notif_prefs.air_quality_alerts": "Ìkìlọ̀ díẹ̀ nípa ààyè afẹ́fẹ́",
        "notif_prefs.daily_summaries": "Àkótán ojoojúmọ́",
        "notif_prefs.air_quality_updates": "Ìsódiwájú ààyè afẹ́fẹ́",
        "notif_prefs.tips_and_guidance": "ìmọ̀ràn àti ìtọ́sọ́nà",
        "notif_prefs.nothing_unread": "Kò sí ohun tí a kò kà",
        "screen.profile.account_actions": "Àkántì",
        "screen.country.rural_cities": "Ìgbèríko",
        "install.title": "Fi Mframapa kun ojú ìwé ibẹ̀rẹ̀",
        "install.subtitle": "Fi sórí ẹ̀rọ fún ìráàyèsí kíákíá, offline, àti ìkìlọ̀.",
        "install.cta": "Fi sórí ojú ìwé ibẹ̀rẹ̀",
        "install.not_now": "Kì í ṣe nísinsinyìí",
        "install.menu": "Fi app sórí ẹ̀rọ",
        "push_prompt.title": "Dúró níwájú afẹ́fẹ́",
        "push_prompt.body": "Fàyè gba ìfitónilétí fún ìkìlọ̀ ààyè afẹ́fẹ́ àti ìmọ̀ràn ojoojúmọ́.",
        "push_prompt.allow": "Fàyè gba",
        "push_prompt.not_now": "Kì í ṣe nísinsinyìí",
    },
    "tw": {
        "notif_prefs.air_quality_alerts": "Mframa ho kɔkɔbɔ",
        "notif_prefs.daily_summaries": "Daa ntio",
        "notif_prefs.air_quality_updates": "Mframa ho nkaebɔ foforo",
        "notif_prefs.tips_and_guidance": "Afotu ne akwankyerɛ",
        "notif_prefs.nothing_unread": "Biribiara nni hɔ a wonkenkan",
        "screen.profile.account_actions": "Akonta",
        "screen.country.rural_cities": "Kurotia",
    },
    "am": {
        "notif_prefs.air_quality_alerts": "የአየር ጥራት ማንቂያዎች",
        "notif_prefs.daily_summaries": "ዕለታዊ ማጠቃለያዎች",
        "notif_prefs.air_quality_updates": "የአየር ጥራት ዝማኔዎች",
        "notif_prefs.tips_and_guidance": "ምክሮች እና መመሪያ",
        "notif_prefs.nothing_unread": "ያልተነበበ የለም",
        "screen.profile.account_actions": "መለያ",
        "screen.country.rural_cities": "ገጠር",
    },
    "zu": {
        "notif_prefs.air_quality_alerts": "Izexwayiso zekhwalithi yomoya",
        "notif_prefs.daily_summaries": "Izifinyezo zansuku zonke",
        "notif_prefs.air_quality_updates": "Izibuyekezo zekhwalithi yomoya",
        "notif_prefs.tips_and_guidance": "Amathiphu nesiqondiso",
        "notif_prefs.nothing_unread": "Akukho okungafundiwe",
        "screen.profile.account_actions": "I-akhawunti",
        "screen.country.rural_cities": "Emaqanda",
    },
}

FALLBACK_EN = {
    "notif_prefs.air_quality_alerts": "Air quality alerts",
    "notif_prefs.daily_summaries": "Daily summaries",
    "notif_prefs.air_quality_updates": "Air quality updates",
    "notif_prefs.tips_and_guidance": "Tips and guidance",
    "notif_prefs.nothing_unread": "Nothing unread",
    "screen.profile.account_actions": "Account",
    "screen.country.rural_cities": "Rural",
    "install.title": "Add Mframapa to your home screen",
    "install.subtitle": "Install for one-tap access, offline checks, and air quality alerts.",
    "install.cta": "Install on home screen",
    "install.not_now": "Not now",
    "install.ios_step1_prefix": "Tap",
    "install.ios_step1_suffix": "Share in Safari",
    "install.ios_step2": "Scroll and tap Add to Home Screen",
    "install.ios_step3": "Tap Add — Mframapa appears on your home screen",
    "install.ios_got_it": "Got it",
    "install.menu": "Install app",
    "push_prompt.title": "Stay ahead of the air",
    "push_prompt.body": "Allow notifications so Mframapa can tip you when air quality changes near you — and share a daily Did you know.",
    "push_prompt.allow": "Allow",
    "push_prompt.not_now": "Not now",
}


def main() -> None:
    updated = 0
    for path in sorted(LOCALE_DIR.glob("*.json")):
        if path.name.startswith("_") or path.name == "en.json":
            continue
        lang = path.stem
        data = json.loads(path.read_text(encoding="utf-8"))
        patch = TRANSLATIONS.get(lang, FALLBACK_EN)
        # always ensure fallback keys exist
        merged = {**FALLBACK_EN, **patch}
        changed = False
        for key, value in merged.items():
            if data.get(key) != value:
                data[key] = value
                changed = True
        if changed:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            updated += 1
            print(f"updated {path.name}")
    print(f"done: {updated} locale files")


if __name__ == "__main__":
    main()
