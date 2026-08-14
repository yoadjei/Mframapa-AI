"""health guidance, written once and reviewed, not generated per request.

these lines are deliberately hardcoded rather than produced by a language model.
this is health advice shown in more than fifty languages, and nobody on the team
can read most of them: an invented or subtly wrong instruction in Tigrinya would
never be caught. written English source can be reviewed once, corrected in one
place, and then flows through the same translation pipeline as the rest of the
interface. it also costs nothing, answers instantly, and works offline.

variety comes from category x season x rotation rather than from a model.

a handful of lines per category/season carry a ``{{name}}`` placeholder so a
signed-in user occasionally gets addressed directly ("Wear a mask today,
Davis."). the placeholder survives translation untouched (see
backend/services/gemini_client.py's NEVER TRANSLATE list) and is filled in by
the router after translation. callers with no name simply never draw one of
these lines — see generate_insight() in backend/api/v1/router.py.
"""

from datetime import date as dt_date
from typing import Dict, List, Optional, Tuple

# ── seasons that actually change the advice ──────────────────────────────────
# harmattan is the dry, dusty wind that carries saharan dust across west africa
# and the sahel from roughly december to february. it is the single biggest
# seasonal driver of bad air in the region, so it earns its own set of lines.
HARMATTAN = "harmattan"
DRY = "dry"
RAINY = "rainy"


def season_for(lat: float, lon: float, day: Optional[str] = None) -> str:
    """rough season for a point, from the month and where it sits.

    deliberately simple: the aim is to pick sensible wording, not to classify
    climate. anywhere it is unclear we fall back to the neutral 'dry' set.
    """
    month = (dt_date.fromisoformat(day) if day else dt_date.today()).month

    # west africa and the sahel during the harmattan window
    in_west = -18.0 <= lon <= 25.0 and 4.0 <= lat <= 20.0
    if in_west and month in (12, 1, 2):
        return HARMATTAN

    if lat >= 0:                       # northern hemisphere wet season
        return RAINY if month in (6, 7, 8, 9) else DRY
    return RAINY if month in (11, 12, 1, 2, 3) else DRY


# ── the lines ────────────────────────────────────────────────────────────────
# keep each one short, concrete and actionable. no jargon, no mention of how the
# estimate is produced, and never a medical instruction beyond common sense.
_LINES: Dict[str, Dict[str, List[str]]] = {
    "good": {
        DRY: [
            "The air is clean today. A good day to be outside.",
            "Nothing to worry about in the air right now. Enjoy your day.",
            "Air quality is good, so outdoor plans are fine for everyone.",
            "Clear air today. A good time for a long walk or exercise.",
            "No need for precautions today. Open the windows and let air move through.",
            "Clean air today {{name}}, a great day to be outside.",
        ],
        RAINY: [
            "Rain has washed the air clean. Good conditions outside today.",
            "The air is fresh after the rain. A good day to be out.",
            "Clean air today. Watch the weather rather than the air.",
            "Good air quality. Outdoor plans are fine when the rain allows.",
            "Nothing in the air to avoid today. Enjoy the cooler weather.",
            "Clean air today {{name}}, watch the weather rather than the air quality.",
        ],
        HARMATTAN: [
            "A rare clear day in the harmattan. Make the most of it.",
            "The dust has settled for now. Good air today.",
            "Air is clean at the moment, though harmattan dust can return quickly.",
            "Good conditions today. Keep windows open while the air is clear.",
            "Clear air right now. A good day for outdoor work.",
            "Clear skies right now {{name}}, though harmattan dust can return fast.",
        ],
    },
    "moderate": {
        DRY: [
            "Air is acceptable. Most people will not notice anything.",
            "Slightly hazy air. Fine for most, but take it easy if you have asthma.",
            "Air quality is average today. Normal activity is fine.",
            "A little dust in the air. Nothing most people need to act on.",
            "Air is passable. If you tire easily outdoors, keep exercise light.",
            "Air is fine today {{name}}, but ease off exercise if your chest feels tight.",
        ],
        RAINY: [
            "Air is reasonable between showers. Normal plans are fine.",
            "Moderate air today. The rain should keep it from getting worse.",
            "Nothing serious in the air. Most people can carry on as usual.",
            "Air quality is fair. Sensitive people may prefer indoor exercise.",
            "Average air today. Watch how you feel if you have a chest condition.",
            "Nothing serious in the air today {{name}}. Normal plans are fine.",
        ],
        HARMATTAN: [
            "Some dust in the air. Most people are fine, but keep water nearby.",
            "Harmattan haze is mild today. Close windows in the afternoon if dust rises.",
            "Moderate dust levels. Wipe surfaces indoors and keep drinking water.",
            "The air is dusty but manageable. Take breaks if you work outside.",
            "Light haze today. If your throat feels dry, stay indoors a while.",
            "Some dust today {{name}}, keep water nearby if you're outdoors.",
        ],
    },
    "sensitive": {
        DRY: [
            "Children, older people and anyone with asthma should take it easy outdoors.",
            "Not a good day for hard exercise if you have a chest condition.",
            "Keep children's outdoor play shorter than usual today.",
            "If you have asthma, keep your inhaler with you today.",
            "Older relatives should avoid long spells outside this afternoon.",
            "{{name}}, keep outdoor time short today if you have asthma or a chest condition.",
        ],
        RAINY: [
            "Air is heavier today. Sensitive people should limit time outside.",
            "If you have asthma, damp and polluted air together can be difficult. Stay in when you can.",
            "Keep children indoors during the worst of it today.",
            "Not the day for outdoor exercise if your chest is sensitive.",
            "Older people should keep activity light today.",
            "{{name}}, sensitive lungs should stay in more today. Air is heavier than usual.",
        ],
        HARMATTAN: [
            "Dust is high enough to bother children and anyone with asthma. Keep them indoors.",
            "Close windows and doors against the dust, especially at night.",
            "If you have asthma, carry your inhaler and avoid the open road.",
            "Cover your nose and mouth if you must travel far today.",
            "Keep young children inside where you can. The dust is irritating.",
            "{{name}}, carry your inhaler today if you're asthmatic. Harmattan dust is high enough to bother sensitive chests.",
        ],
    },
    "unhealthy": {
        DRY: [
            "Air is poor today. Everyone should cut back on time outside.",
            "Avoid outdoor exercise today. Keep windows closed where you can.",
            "Poor air. Keep children indoors and postpone anything strenuous.",
            "Not a day to be outside longer than you need to be.",
            "If you can move work indoors today, do.",
            "Wear a mask outdoors today if you can, especially near traffic.",
            "{{name}}, you should wear a mask if you're heading out today. Air is poor.",
        ],
        RAINY: [
            "Air is poor despite the rain. Stay in where you can.",
            "Keep windows shut and limit outdoor time today.",
            "Poor air quality. Postpone exercise and outdoor chores.",
            "Everyone should reduce time outside today, not only sensitive people.",
            "Not a good day for children to play outside.",
            "A mask helps if you have to be outside for long today.",
            "{{name}}, keep outdoor time short today. Air is poor despite the rain.",
        ],
        HARMATTAN: [
            "Heavy dust today. Stay indoors where you can and keep windows shut.",
            "Cover your face if you must go out. Visibility and air are both poor.",
            "Keep children and older relatives inside today.",
            "Avoid the roadside, where dust and traffic fumes combine.",
            "Poor air. Damp cloth on window gaps helps keep dust out.",
            "{{name}}, put on a mask before you go out. Dust and traffic fumes are both heavy today.",
        ],
    },
    "hazardous": {
        DRY: [
            "Air is dangerous today. Stay indoors and keep windows and doors closed.",
            "Everyone should avoid going outside. Seek help if breathing becomes hard.",
            "Do not exercise outdoors under any circumstances today.",
            "Keep everyone inside, especially children and older people.",
            "If you have a breathing condition and feel worse, get medical help.",
            "{{name}}, please stay indoors today. The air is dangerous to breathe.",
        ],
        RAINY: [
            "Air is dangerous. Stay indoors with windows and doors closed.",
            "Do not go outside unless you have to. Seek help if breathing is difficult.",
            "Everyone is at risk today, not only sensitive groups.",
            "Keep children inside and avoid all outdoor activity.",
            "If breathing becomes hard, get medical help without waiting.",
            "{{name}}, stay indoors with windows shut today. Conditions are dangerous.",
        ],
        HARMATTAN: [
            "Severe dust. Stay indoors, seal gaps around windows and doors.",
            "Do not travel unless you must. Cover your face completely if you do.",
            "Everyone is at risk. Keep children and older people inside.",
            "If breathing becomes difficult, seek medical help.",
            "Avoid all outdoor work today. The dust is dangerous to breathe.",
            "{{name}}, you must wear a mask if you step outside today. Dust levels are severe.",
        ],
    },
}


def variants(category: str, season: str) -> List[str]:
    """all lines for a category and season, falling back to the dry set."""
    by_season = _LINES.get(category) or _LINES["moderate"]
    return by_season.get(season) or by_season[DRY]


def pick(category: str, season: str, index: int) -> Tuple[str, int]:
    """rotate through the lines: every one appears before any repeats.

    returns the line and the next index, so the caller decides where to keep the
    counter (redis in production, memory in tests).
    """
    options = variants(category, season)
    return options[index % len(options)], (index + 1) % len(options)
