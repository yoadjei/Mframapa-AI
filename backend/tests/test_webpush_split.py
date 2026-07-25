"""Expo vs Web Push token routing."""

from backend.alerts.push import _split_tokens, send_push
from backend.alerts.webpush_delivery import is_web_subscription


def test_is_web_subscription_detects_json():
    token = (
        '{"endpoint":"https://fcm.googleapis.com/fcm/send/abc",'
        '"keys":{"p256dh":"x","auth":"y"}}'
    )
    assert is_web_subscription(token)
    assert not is_web_subscription("ExponentPushToken[abc]")


def test_split_tokens_routes_platforms():
    web = (
        '{"endpoint":"https://fcm.googleapis.com/fcm/send/abc",'
        '"keys":{"p256dh":"x","auth":"y"}}'
    )
    expo, web_tokens = _split_tokens(["ExponentPushToken[abc]", web, ""])
    assert expo == ["ExponentPushToken[abc]"]
    assert web_tokens == [web]


def test_send_push_with_fake_post_counts_web():
    web = (
        '{"endpoint":"https://fcm.googleapis.com/fcm/send/abc",'
        '"keys":{"p256dh":"x","auth":"y"}}'
    )
    sent = []

    def fake_post(url, messages):
        sent.append((url, messages))

    result = send_push(
        ["ExponentPushToken[abc]", web],
        "Title",
        "Body",
        post=fake_post,
    )
    assert result["sent"] == 2
    assert len(sent) == 1  # only Expo hits the fake HTTP post
