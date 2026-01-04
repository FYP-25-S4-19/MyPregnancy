from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_record_kick_and_get_counts(authenticated_pregnant_woman_client: tuple[AsyncClient, object]):
    client, _mother = authenticated_pregnant_woman_client

    start = await client.post("/kick-tracker/sessions/start")
    assert start.status_code == 200, start.text

    # Record 2 kicks on Jan 1 and 1 kick on Jan 2
    kick_1 = await client.post("/kick-tracker/kicks", json={"kick_at": "2026-01-01T10:00:00Z"})
    assert kick_1.status_code == 200, kick_1.text
    body_1 = kick_1.json()
    assert body_1["session_id"]
    assert body_1["session_kick_count"] == 1
    assert body_1["today_kick_count"] == 1

    kick_2 = await client.post("/kick-tracker/kicks", json={"kick_at": "2026-01-01T10:05:00Z"})
    assert kick_2.status_code == 200, kick_2.text
    body_2 = kick_2.json()
    assert body_2["session_id"] == body_1["session_id"]
    assert body_2["session_kick_count"] == 2
    assert body_2["today_kick_count"] == 2

    kick_3 = await client.post("/kick-tracker/kicks", json={"kick_at": "2026-01-02T11:00:00Z"})
    assert kick_3.status_code == 200, kick_3.text
    body_3 = kick_3.json()
    assert body_3["session_id"] == body_1["session_id"]
    assert body_3["session_kick_count"] == 3
    assert body_3["today_kick_count"] == 1

    stop = await client.post("/kick-tracker/sessions/stop")
    assert stop.status_code == 200, stop.text

    start_2 = await client.post("/kick-tracker/sessions/start")
    assert start_2.status_code == 200, start_2.text

    kick_new_session = await client.post("/kick-tracker/kicks", json={"kick_at": "2026-01-02T12:00:00Z"})
    assert kick_new_session.status_code == 200, kick_new_session.text
    body_new_session = kick_new_session.json()
    assert body_new_session["session_kick_count"] == 1

    counts = await client.get("/kick-tracker/counts", params={"start_date": "2026-01-01", "end_date": "2026-01-03"})
    assert counts.status_code == 200, counts.text
    counts_body = counts.json()

    assert counts_body["start_date"] == "2026-01-01"
    assert counts_body["end_date"] == "2026-01-03"

    assert counts_body["days"] == [
        {"date": "2026-01-01", "kick_count": 2},
        {"date": "2026-01-02", "kick_count": 2},
        {"date": "2026-01-03", "kick_count": 0},
    ]
