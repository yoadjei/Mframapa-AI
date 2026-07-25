"""Fill lang.*, country.*, and new Trust strings across locale bundles.

Language labels use stable endonyms / proper names (Asante Twi, not Fante).
Trust copy is provided for major locales; others keep English until baked.
"""

from __future__ import annotations

import json
from pathlib import Path

from ml.paths import repository_root

LOCALES = repository_root() / "frontend-pwa" / "src" / "locales"

# Endonyms / preferred labels — same in every UI language (picker convention).
LANG_LABELS = {
    "lang.af": "Afrikaans",
    "lang.am": "አማርኛ",
    "lang.ar": "العربية",
    "lang.en": "English",
    "lang.es": "Español",
    "lang.fr": "Français",
    "lang.ga": "Ga",
    "lang.ha": "Hausa",
    "lang.ig": "Igbo",
    "lang.mg": "Malagasy",
    "lang.nd": "isiNdebele",
    "lang.ny": "Chichewa",
    "lang.pt": "Português",
    "lang.rn": "Ikirundi",
    "lang.rw": "Ikinyarwanda",
    "lang.sn": "ChiShona",
    "lang.so": "Soomaali",
    "lang.ss": "siSwati",
    "lang.st": "Sesotho",
    "lang.sw": "Kiswahili",
    "lang.ti": "ትግርኛ",
    "lang.tn": "Setswana",
    "lang.tw": "Asante Twi",
    "lang.wo": "Wolof",
    "lang.xh": "isiXhosa",
    "lang.yo": "Yorùbá",
    "lang.zu": "isiZulu",
}

# English UI keeps English language names (Asante Twi, Ga, Setswana…).
LANG_LABELS_EN = {
    "lang.af": "Afrikaans",
    "lang.am": "Amharic",
    "lang.ar": "Arabic",
    "lang.en": "English",
    "lang.es": "Spanish",
    "lang.fr": "French",
    "lang.ga": "Ga",
    "lang.ha": "Hausa",
    "lang.ig": "Igbo",
    "lang.mg": "Malagasy",
    "lang.nd": "Northern Ndebele",
    "lang.ny": "Chichewa",
    "lang.pt": "Portuguese",
    "lang.rn": "Kirundi",
    "lang.rw": "Kinyarwanda",
    "lang.sn": "Shona",
    "lang.so": "Somali",
    "lang.ss": "siSwati",
    "lang.st": "Sesotho",
    "lang.sw": "Swahili",
    "lang.ti": "Tigrinya",
    "lang.tn": "Setswana",
    "lang.tw": "Asante Twi",
    "lang.wo": "Wolof",
    "lang.xh": "Xhosa",
    "lang.yo": "Yoruba",
    "lang.zu": "Zulu",
}

COUNTRY_EN = {
    "country.botswana": "Botswana",
    "country.burundi": "Burundi",
    "country.egypt": "Egypt",
    "country.eritrea": "Eritrea",
    "country.eswatini": "Eswatini",
    "country.ethiopia": "Ethiopia",
    "country.france": "France",
    "country.ghana": "Ghana",
    "country.kenya": "Kenya",
    "country.lesotho": "Lesotho",
    "country.madagascar": "Madagascar",
    "country.malawi": "Malawi",
    "country.nigeria": "Nigeria",
    "country.portugal": "Portugal",
    "country.rwanda": "Rwanda",
    "country.senegal": "Senegal",
    "country.somalia": "Somalia",
    "country.south_africa": "South Africa",
    "country.spain": "Spain",
    "country.united_kingdom": "United Kingdom",
    "country.zimbabwe": "Zimbabwe",
}

TRUST_BY_LANG: dict[str, dict[str, str]] = {
    "tw": {
        "screen.trust.intro": "Yɛkyerɛ susu a efi satellites ne ewim nsɛm so sɛnea wobetumi agye w'adwene sɛ bere bɛn na wobɛkɔ abɔnten. Wei ne nneɛma a ɛkɔ mu.",
        "screen.trust.source_active": "Ɛreyɛ adwuma",
        "screen.trust.source_era5": "Dɔnhwerew biara ewim nsɛm fi Europa climate reanalysis (mframa, nsu, hyew).",
        "screen.trust.source_s5p": "Satellite gas a ɛboa ma wohu pollution clouds.",
        "screen.trust.source_modis": "Satellite aerosol optical depth ma mfuturo ne wusiw.",
        "screen.trust.source_openmeteo": "Ewim nsɛm a ɛyɛ ntɛm sɛ primary feeds yɛ brɛɛ anaa ɛnni hɔ a.",
        "screen.trust.source_worldpop": "Nnipa dodoɔ a yɛde kyekyɛ kurow mu / kurotia models.",
        "screen.trust.source_openaq": "Asase so monitoring nsɛm sɛ station bi bɛn a.",
        "about.version": "Version 1.0.0",
    },
    "ga": {
        "screen.trust.intro": "Wɔ tsɔɔ susu ni jɛ satellites kɛ weather models nɔ koni obaanyɛ owie nɔ yɛ mli kɛha bɔ ni oyaa gbe. Nɛkɛ ji nii ni yɔɔ susu lɛ mli.",
        "screen.trust.source_active": "Tsɔɔɔ nii",
        "screen.trust.source_era5": "Gbi fɛɛ gbi weather jɛ Europa climate reanalysis (mumu, nu, tso).",
        "screen.trust.source_s5p": "Satellite gas columns ni kɛ yeɔ pollution plumes.",
        "screen.trust.source_modis": "Satellite aerosol optical depth kɛha shu kɛ lasu.",
        "screen.trust.source_openmeteo": "Weather fallback ni wa sɛ primary feeds ejaa loo ebe.",
        "screen.trust.source_worldpop": "Nɔbii pii ni a-kɛ jeɔ urban kɛ rural models.",
        "screen.trust.source_openaq": "Shikpɔŋ nɔ monitor readings sɛ station yɔɔ bɛŋ.",
        "about.version": "Sui 1.0.0",
    },
    "fr": {
        "screen.trust.intro": "Nous affichons des estimations issues de satellites et de modèles météo pour vous aider à décider quand sortir. Voici ce qui compose ces estimations.",
        "screen.trust.source_active": "En service",
        "screen.trust.source_era5": "Météo horaire issue de la réanalyse climatique européenne (vent, humidité, température).",
        "screen.trust.source_s5p": "Colonnes de gaz satellitaires qui aident à repérer les panaches de pollution.",
        "screen.trust.source_modis": "Profondeur optique des aérosols satellitaires pour la poussière et la fumée.",
        "screen.trust.source_openmeteo": "Météo de secours rapide quand les sources principales sont lentes ou hors ligne.",
        "screen.trust.source_worldpop": "Densité de population utilisée pour classer les modèles urbain / rural.",
        "screen.trust.source_openaq": "Mesures au sol lorsque des stations signalent à proximité.",
        "about.version": "Version 1.0.0",
        "lang.tw": "Twi asante",
        "lang.ga": "Ga",
        "lang.tn": "Setswana",
        "lang.st": "Sesotho",
        "lang.ss": "siSwati",
        "lang.nd": "Ndébélé du Nord",
        "lang.sw": "Swahili",
    },
    "sw": {
        "screen.trust.intro": "Tunaonyesha makadirio kutoka satelaiti na miundo ya hali ya hewa ili uamue wakati wa kutoka nje. Hivi ndivyo vinavyounda makadirio hayo.",
        "screen.trust.source_active": "Inatumika",
        "screen.trust.source_era5": "Hali ya hewa ya kila saa kutoka uchanganuzi wa hali ya hewa wa Ulaya (upepo, unyevu, joto).",
        "screen.trust.source_s5p": "Gesi za satelaiti zinazosaidia kuona mawingu ya uchafuzi.",
        "screen.trust.source_modis": "Kina cha macho cha erosoli kwa vumbi na moshi.",
        "screen.trust.source_openmeteo": "Hali ya hewa mbadala haraka chanzo kikuu kikichelewa au kikiwa nje ya mtandao.",
        "screen.trust.source_worldpop": "Msongamano wa watu unaotumika kuainisha miundo ya mijini / vijijini.",
        "screen.trust.source_openaq": "Vipimo vya ardhini vituo vinaporipoti karibu.",
        "about.version": "Toleo 1.0.0",
        "lang.tw": "Asante Twi",
        "lang.ga": "Ga",
    },
    "es": {
        "screen.trust.intro": "Mostramos estimaciones de satélites y modelos meteorológicos para que decidas cuándo salir. Esto es lo que entra en esas estimaciones.",
        "screen.trust.source_active": "En uso",
        "screen.trust.source_era5": "Tiempo por hora del reanálisis climático europeo (viento, humedad, temperatura).",
        "screen.trust.source_s5p": "Columnas de gases satelitales que ayudan a detectar penachos de contaminación.",
        "screen.trust.source_modis": "Profundidad óptica de aerosoles para polvo y humo.",
        "screen.trust.source_openmeteo": "Tiempo de respaldo rápido cuando las fuentes principales van lentas o están conexión.",
        "screen.trust.source_worldpop": "Densidad de población para clasificar modelos urbano / rural.",
        "screen.trust.source_openaq": "Lecturas de monitores en tierra cuando hay estaciones cerca.",
        "about.version": "Versión 1.0.0",
        "lang.tw": "Twi asante",
    },
    "pt": {
        "screen.trust.intro": "Mostramos estimativas de satélites e modelos meteorológicos para ajudar a decidir quando sair. Eis o que entra nessas estimativas.",
        "screen.trust.source_active": "Em uso",
        "screen.trust.source_era5": "Tempo horário da reanálise climática europeia (vento, humidade, temperatura).",
        "screen.trust.source_s5p": "Colunas de gases satélite que ajudam a detetar plumas de poluição.",
        "screen.trust.source_modis": "Profundidade ótica de aerossóis para poeira e fumo.",
        "screen.trust.source_openmeteo": "Tempo de recurso rápido quando as fontes principais estão lentas ou offline.",
        "screen.trust.source_worldpop": "Densidade populacional usada para classificar modelos urbano / rural.",
        "screen.trust.source_openaq": "Leituras de monitores no solo quando há estações perto.",
        "about.version": "Versão 1.0.0",
        "lang.tw": "Twi asante",
    },
    "ha": {
        "screen.trust.intro": "Muna nuna kiyasi daga satelit da samfuran yanayi don ku yanke shawarar lokacin fita. Ga abin da ke cikin waɗannan kiyasi.",
        "screen.trust.source_active": "Ana amfani",
        "screen.trust.source_era5": "Yanayi na kowane awa daga binciken yanayi na Turai (iski, danshi, zafi).",
        "screen.trust.source_s5p": "Gas ɗin satelit da ke taimakawa gano gubar gurɓata.",
        "screen.trust.source_modis": "Zurfin gani na aerosol don ƙura da hayaki.",
        "screen.trust.source_openmeteo": "Yanayi na gaggawa idan tushen farko sun yi jinkiri ko ba su da intanet.",
        "screen.trust.source_worldpop": "Yawan jama'a da ake amfani da shi don rarraba samfuran birni / ƙauye.",
        "screen.trust.source_openaq": "Karatun ƙasa idan tashoshi sun bayar da rahoto kusa.",
        "about.version": "Sigar 1.0.0",
        "lang.tw": "Asante Twi",
        "lang.ga": "Ga",
    },
    "yo": {
        "screen.trust.intro": "A ń fi àwọn ìfojúsọ́nà láti satẹ́làìtì àti àwọn àwòrán ojú-ọjọ́ hàn kí o lè pinnu ìgbà tí o máa jáde. Èyí ni ohun tó wà nínú àwọn ìfojúsọ́nà yẹn.",
        "screen.trust.source_active": "Ń ṣiṣẹ́",
        "screen.trust.source_era5": "Ojú-ọjọ́ wákàtí kan láti ìtúpalẹ̀ ojú-ọjọ́ Yúróòpù (afẹ́fẹ́, ọ̀rìn, ooru).",
        "screen.trust.source_s5p": "Àwọn ọ̀wọ́ gáàsì satẹ́làìtì tó ń ran wa lọ́wọ́ láti rí èéfín ìdọ̀tí.",
        "screen.trust.source_modis": "Ijinlẹ optical aerosol fún eruku àti èéfín.",
        "screen.trust.source_openmeteo": "Ojú-ọjọ́ àtìlẹ́yìn kíákíá nígbà tí orísun àkọ́kọ́ bá lọ́ra tàbí kò sí.",
        "screen.trust.source_worldpop": "Ìṣùpọ̀ ènìyàn tí a fi ń pín àwọn àwòrán ìlú / abúlé.",
        "screen.trust.source_openaq": "Ìkàwé ilẹ̀ nígbà tí ibùdó bá ń ròyìn nítòsí.",
        "about.version": "Ẹ̀dà 1.0.0",
        "lang.tw": "Asante Twi",
        "lang.ga": "Ga",
    },
}


def save(path: Path, current: dict, english: dict) -> None:
    ordered = {k: current[k] for k in english if k in current}
    ordered.update({k: v for k, v in current.items() if k not in english})
    path.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    english = json.loads((LOCALES / "en.json").read_text(encoding="utf-8"))
    trust_keys = [
        "screen.trust.intro",
        "screen.trust.source_active",
        "screen.trust.source_era5",
        "screen.trust.source_s5p",
        "screen.trust.source_modis",
        "screen.trust.source_openmeteo",
        "screen.trust.source_worldpop",
        "screen.trust.source_openaq",
    ]

    for path in sorted(LOCALES.glob("*.json")):
        code = path.stem
        data = json.loads(path.read_text(encoding="utf-8"))
        before = len(data)

        if code == "en":
            # en.json already has English labels; keep as-is.
            save(path, data, english)
            continue

        data.update(COUNTRY_EN)
        data.update(LANG_LABELS)
        # Prefer English-style proper names for a few widely shared labels
        # that must stay "Asante Twi" / "Ga" / "Setswana" in Latin scripts.
        data["lang.tw"] = "Asante Twi"
        data["lang.ga"] = "Ga"
        data["lang.tn"] = "Setswana"
        data["lang.st"] = "Sesotho"
        data["lang.ss"] = "siSwati"

        extras = TRUST_BY_LANG.get(code, {})
        for k in trust_keys:
            if k in extras:
                data[k] = extras[k]
            elif k not in data:
                data[k] = english[k]
        for k, v in extras.items():
            if k not in trust_keys:
                data[k] = v
        if "about.version" in extras:
            data["about.version"] = extras["about.version"]
        elif "about.version" not in data:
            data["about.version"] = "Version 1.0.0"

        save(path, data, english)
        print(f"{code}: {before} -> {len(data)} keys")

    print("patched language labels + trust strings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
