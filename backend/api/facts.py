"""a short air quality fact for each day.

written and reviewed here rather than generated, for the same reason the health
guidance is: this goes out as a push notification in more than fifty languages,
and nobody on the team can read most of them to check what was sent.

each fact has to be true, useful to someone in an African city, and
understandable without any background. no statistics we cannot source, and
nothing about how our own estimates are produced.
"""

from datetime import date as dt_date
from typing import List, Optional

# roughly two months before anything repeats, keyed to the day of the year so
# everyone sees the same fact on the same day and nobody sees one twice.
FACTS: List[str] = [
    "Cooking indoors over wood or charcoal is one of the biggest sources of harmful smoke in the home. Opening a window while you cook helps more than you would think.",
    "Air pollution is usually worst in the early morning and again in the evening, when traffic is heavy and the air near the ground is still.",
    "Wind clears polluted air. A still, hot day often means worse air than a breezy one, even when nothing else has changed.",
    "Rain washes dust and smoke out of the air. The hours after a heavy downpour are often the cleanest of the week.",
    "Fine dust is the part of air pollution that matters most for health, because it is small enough to travel deep into the lungs.",
    "Burning rubbish releases far more harmful smoke than burning wood. Even a small fire close to the house affects the air indoors.",
    "Walking one street away from a busy road can noticeably reduce what you breathe in on the way to work or school.",
    "Children breathe faster than adults and are closer to the ground, so they take in more of what is in the air.",
    "During the harmattan, dust from the Sahara can travel thousands of kilometres and settle over cities far from any desert.",
    "Keeping windows closed on a dusty day, then airing the house once the dust settles, keeps indoor air noticeably cleaner.",
    "Older people and anyone with asthma or heart trouble feel bad air first, often before anyone else notices anything.",
    "A cloth mask does little against fine dust. If you need protection on a bad day, a close fitting mask does much more.",
    "Idling engines in traffic put out pollution without moving anyone. Switching off while waiting genuinely helps the street.",
    "Trees and hedges along a road trap some of the dust from traffic before it reaches nearby homes.",
    "Air pollution does not stop at a city boundary. Smoke from farm burning outside town can settle over the whole city.",
    "Generators produce concentrated fumes. Placing one away from windows and doors keeps those fumes out of the house.",
    "Sweeping raises dust back into the air. Damp cloth or a damp mop keeps it down instead.",
    "Air quality can differ noticeably between two ends of the same city, depending on traffic, industry and wind.",
    "Charcoal stoves keep giving off fumes after the flame dies down. Take them outside once the cooking is finished.",
    "Exercising hard means breathing more deeply, so a run on a bad air day takes in far more than a walk would.",
    "Smoke from burning fields can travel for days and affect towns hundreds of kilometres away.",
    "Dust indoors settles on surfaces and gets stirred up again. Regular damp cleaning reduces what everyone breathes.",
    "The air is often cleanest in the middle of the day, once the morning traffic has cleared and the air has begun to move.",
    "Living close to an unpaved road usually means more dust indoors, especially in the dry season.",
    "Pregnant women are advised to avoid heavy smoke, because what she breathes reaches the baby too.",
    "A haze that blurs buildings in the distance usually means a lot of fine dust in the air.",
    "Kerosene lamps give off fumes in the room where they burn. Better lighting improves indoor air as well as sight.",
    "Air pollution is linked to more coughs, chest infections and asthma attacks, especially in children.",
    "The dry season usually brings worse air than the rainy season, because there is nothing to wash the dust away.",
    "Standing behind a vehicle while it starts means breathing the most concentrated part of its exhaust.",
    "Good ventilation matters most in the room where cooking happens, not in the rest of the house.",
    "Roadside food stalls sit in traffic fumes all day. A stall set back from the road is better for the cook as well as the customer.",
    "Cleaner cookstoves cut both smoke and the amount of fuel needed, so they save money as well as lungs.",
    "Smoke from one household affects the neighbours too. Air is shared in a way water and electricity are not.",
    "On a bad air day, indoors with the windows shut is usually cleaner than outdoors.",
    "Fine dust can stay suspended for hours after the wind that lifted it has dropped.",
    "Asthma inhalers work best when used before symptoms get bad. On a poor air day, keep one within reach.",
    "Burning plastic gives off fumes that are harmful even in small amounts. It is never a safe way to get rid of it.",
    "Air quality tends to improve on days when public transport replaces many separate car journeys.",
    "A closed car in traffic can hold more pollution inside it than the street outside.",
    "Damp indoor air encourages mould, which affects breathing in its own way alongside smoke and dust.",
    "Older engines put out far more than newer ones. A well maintained vehicle pollutes noticeably less.",
    "Children's outdoor play is worth timing away from the morning and evening traffic peaks.",
    "Dust masks help outdoors but do nothing about smoke inside the house. Ventilation is what helps there.",
    "Air pollution affects the heart as well as the lungs, which is why doctors take it seriously for older patients.",
    "A single day of very bad air can trigger symptoms in someone whose asthma is normally well controlled.",
    "Cities near the coast often have cleaner air, because sea breezes keep the air moving.",
    "Cooking with a lid on uses less fuel and produces less smoke for the same meal.",
    "Air pollution is one of the leading environmental health risks worldwide, and much of it is preventable.",
    "Smoke settles into clothes and bedding. Airing them out reduces what people breathe overnight.",
    "The safest time to open the house up is usually when there is a light breeze and no nearby burning.",
    "Long exposure to moderate pollution can matter more for health than one very bad day.",
    "Roadside dust is heavier than smoke and settles faster, which is why the far side of a hedge is noticeably cleaner.",
    "Anyone who feels tightness in the chest on a hazy day should treat that as a signal to go indoors.",
    "Improving air quality shows up in fewer hospital visits for breathing problems within weeks, not years.",
    "Burning waste at night does not make the smoke safer. It just makes it harder to see.",
    "Two cities with the same weather can have very different air, depending on traffic and what is burned nearby.",
    "Keeping the cooking area separate from where children sleep reduces what they breathe over a whole night.",
    "Air quality is worst close to the ground, which is exactly where small children spend their time.",
    "Small changes repeated daily, such as cooking with better ventilation, add up to more than any single big effort.",
]


def fact_for(day: Optional[str] = None) -> str:
    """the fact for a given day. everyone sees the same one on the same date."""
    d = dt_date.fromisoformat(day) if day else dt_date.today()
    return FACTS[d.toordinal() % len(FACTS)]
