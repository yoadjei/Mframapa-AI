"""guards against the model leaving the english original inside a translation."""

from backend.services.gemini_client import _strip_source_echo


def test_strips_english_prefix_keeping_translation():
    # "Lite mode (mapu achepetsedwa)" -> the actual translation
    assert _strip_source_echo("Lite mode (mapu achepetsedwa)", "Lite mode") == "mapu achepetsedwa"


def test_strips_trailing_english_gloss():
    # some languages did the reverse: translation first, english in brackets
    out = _strip_source_echo("ክሬዲትስ ኤንድ ኣትሪብዩሽን (Credits & Attribution)", "Credits & Attribution")
    assert out == "ክሬዲትስ ኤንድ ኣትሪብዩሽን"


def test_tolerates_trailing_period_and_case():
    assert _strip_source_echo("lite mode (mapu achepetsedwa).", "Lite mode") == "mapu achepetsedwa"


def test_leaves_legitimate_brackets_alone():
    # brackets that are not an echo of the source must survive untouched
    text = "PM2.5 (micrograms per cubic metre)"
    assert _strip_source_echo(text, "PM2.5 concentration") == text


def test_leaves_clean_translation_untouched():
    assert _strip_source_echo("mapu achepetsedwa", "Lite mode") == "mapu achepetsedwa"


def test_ignores_nested_or_multiple_brackets():
    text = "foo (bar) baz (qux)"
    assert _strip_source_echo(text, "Lite mode") == text
